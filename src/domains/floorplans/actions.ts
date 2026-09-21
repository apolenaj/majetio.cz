"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import {
  enqueuePhotoAnalysisJob,
  getOrCreateFloorPlanForProperty,
  publishFloorPlan,
  saveFloorPlanDraft,
} from "@/domains/floorplans/service";
import {
  disclaimerForKind,
  emptyFloorPlanDocument,
  type FloorPlanDocument,
} from "./types";
import { putListingObject } from "@/lib/storage/listing-media-storage";
import { prisma } from "@/lib/db";
import { assertCanManageListing } from "@/domains/listings/seller/seller-listing-service";
import { assertSafeUploadMeta } from "@/lib/security/upload-mime";

export type FloorPlanActionResult =
  | { ok: true; message?: string; data?: unknown }
  | { ok: false; error: string; issues?: string[] };

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user.id;
}

export async function loadFloorPlanEditorAction(
  propertyId: string,
): Promise<FloorPlanActionResult> {
  const userId = await requireUser();
  if (!userId) return { ok: false, error: "Přihlaste se." };
  const result = await getOrCreateFloorPlanForProperty({ propertyId, userId });
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, data: result.plan };
}

export async function saveFloorPlanDraftAction(
  propertyId: string,
  document: FloorPlanDocument,
): Promise<FloorPlanActionResult> {
  const userId = await requireUser();
  if (!userId) return { ok: false, error: "Přihlaste se." };
  const result = await saveFloorPlanDraft({ propertyId, userId, document });
  if (!result.ok) return { ok: false, error: result.error };
  revalidatePath(`/ucet/nabidky/${propertyId}`);
  return { ok: true, message: "Koncept půdorysu uložen.", data: result.plan };
}

export async function publishFloorPlanAction(
  propertyId: string,
  revisionId?: string,
): Promise<FloorPlanActionResult> {
  const userId = await requireUser();
  if (!userId) return { ok: false, error: "Přihlaste se." };
  const result = await publishFloorPlan({ propertyId, userId, revisionId });
  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      issues: result.issues?.map((i) => i.messageCs),
    };
  }
  revalidatePath(`/ucet/nabidky/${propertyId}`);
  revalidatePath("/nemovitosti");
  return { ok: true, message: "Půdorys je připraven ke zveřejnění s nabídkou." };
}

export async function startPhotoFloorPlanAnalysisAction(
  propertyId: string,
  formData: FormData,
): Promise<FloorPlanActionResult> {
  const userId = await requireUser();
  if (!userId) return { ok: false, error: "Přihlaste se." };

  const clientRequestId = String(formData.get("clientRequestId") ?? "").trim();
  if (!clientRequestId || clientRequestId.length > 80) {
    return { ok: false, error: "Neplatný identifikátor požadavku." };
  }

  let groups: unknown = [];
  try {
    groups = JSON.parse(String(formData.get("photoGroups") ?? "[]"));
  } catch {
    return { ok: false, error: "Neplatná data skupin fotografií." };
  }

  const result = await enqueuePhotoAnalysisJob({
    propertyId,
    userId,
    clientRequestId,
    photoGroupPayload: groups,
  });
  if (!result.ok) return { ok: false, error: result.error };

  if (result.job.status === "FAILED") {
    return {
      ok: false,
      error:
        result.job.errorMessageCs ??
        "Analýza fotografií není dostupná. Použijte ruční editor nebo nahrání plánu.",
    };
  }

  return {
    ok: true,
    message: result.deduped
      ? "Požadavek už probíhá."
      : "Analýza zařazena do fronty.",
    data: { jobId: result.job.id, status: result.job.status },
  };
}

const uploadMeta = z.object({
  pageIndex: z.coerce.number().int().min(0).max(50).optional(),
});

export async function uploadFloorPlanDocumentAction(
  propertyId: string,
  formData: FormData,
): Promise<FloorPlanActionResult> {
  const userId = await requireUser();
  if (!userId) return { ok: false, error: "Přihlaste se." };

  const access = await assertCanManageListing({ propertyId, userId });
  if (!access.ok) return { ok: false, error: "Nemáte oprávnění." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Vyberte soubor PNG, JPG nebo PDF." };
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const mimeCheck = assertSafeUploadMeta({
    contentType: file.type || "application/octet-stream",
    fileName: file.name,
    sizeBytes: bytes.byteLength,
  });
  if (!mimeCheck.ok) {
    return {
      ok: false,
      error:
        mimeCheck.reason === "too_large"
          ? "Soubor je příliš velký."
          : "Soubor nelze nahrát (typ nebo přípona).",
    };
  }

  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowed.includes(mimeCheck.mime)) {
    return { ok: false, error: "Povolené formáty: PNG, JPG, WEBP, PDF." };
  }

  const parsed = uploadMeta.safeParse({
    pageIndex: formData.get("pageIndex") ?? undefined,
  });

  const stored = await putListingObject({
    bytes,
    fileName: file.name,
    contentType: mimeCheck.mime,
    keyPrefix: `listings/${propertyId}/floorplans`,
    allowPdf: true,
  });
  if (!stored.ok) {
    return { ok: false, error: stored.error };
  }

  await prisma.propertyMedia.create({
    data: {
      propertyId,
      url: stored.object.url,
      type: "FLOORPLAN",
      mimeType: mimeCheck.mime,
      title: stored.object.storageKey,
      alt: `Půdorys — ${file.name}`,
      sortOrder: 0,
    },
  });

  const ensured = await getOrCreateFloorPlanForProperty({ propertyId, userId });
  if (!ensured.ok) return { ok: false, error: ensured.error };

  const draft = ensured.plan.draftRevision?.document as FloorPlanDocument | undefined;
  const base = draft
    ? { ...draft }
    : emptyFloorPlanDocument({ outputKind: "FROM_DOCUMENT" });

  const nextDoc: FloorPlanDocument = {
    ...base,
    outputKind: "FROM_DOCUMENT",
    disclaimerCs: disclaimerForKind("FROM_DOCUMENT"),
    sourceFiles: [
      ...base.sourceFiles,
      {
        id: `src-${Date.now()}`,
        kind: mimeCheck.mime === "application/pdf" ? "floorplan_pdf" : "floorplan_image",
        url: stored.object.url,
        mediaId: null,
        fileName: file.name,
        mimeType: mimeCheck.mime,
        pageIndex: parsed.success ? parsed.data.pageIndex ?? 0 : 0,
      },
    ],
  };

  const saved = await saveFloorPlanDraft({
    propertyId,
    userId,
    document: nextDoc,
  });
  if (!saved.ok) return { ok: false, error: saved.error };

  revalidatePath(`/ucet/nabidky/${propertyId}`);
  return {
    ok: true,
    message:
      "Dokument nahrán. Upravte geometrii v editoru nebo potvrďte publikaci s označením původu.",
    data: { url: stored.object.url },
  };
}
