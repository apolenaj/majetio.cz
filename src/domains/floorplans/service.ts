/**
 * Floor plan persistence + authorization (seller-owned listings only).
 */

import { prisma } from "@/lib/db";
import { assertCanManageListing } from "@/domains/listings/seller/seller-listing-service";
import {
  disclaimerForKind,
  emptyFloorPlanDocument,
  recomputeRoomAreas,
  validateFloorPlanDocument,
  type FloorPlanDocument,
} from "@/domains/floorplans";

function parseDocument(raw: unknown): FloorPlanDocument {
  if (!raw || typeof raw !== "object") {
    return emptyFloorPlanDocument();
  }
  return raw as FloorPlanDocument;
}

export async function getOrCreateFloorPlanForProperty(input: {
  propertyId: string;
  userId: string;
}) {
  const access = await assertCanManageListing({
    propertyId: input.propertyId,
    userId: input.userId,
  });
  if (!access.ok) {
    return { ok: false as const, error: "Nemáte oprávnění upravit tuto nabídku." };
  }

  let plan = await prisma.propertyFloorPlan.findFirst({
    where: { propertyId: input.propertyId, status: { not: "ARCHIVED" } },
    include: {
      draftRevision: true,
      publishedRevision: true,
      analysisJobs: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!plan) {
    plan = await prisma.$transaction(async (tx) => {
      const created = await tx.propertyFloorPlan.create({
        data: {
          propertyId: input.propertyId,
          createdByUserId: input.userId,
          status: "DRAFT",
        },
      });
      const doc = emptyFloorPlanDocument();
      const rev = await tx.propertyFloorPlanRevision.create({
        data: {
          floorPlanId: created.id,
          version: 1,
          document: doc,
          outputKind: doc.outputKind,
          scaleState: doc.scaleState,
          disclaimerCs: doc.disclaimerCs,
          createdByUserId: input.userId,
        },
      });
      return tx.propertyFloorPlan.update({
        where: { id: created.id },
        data: { draftRevisionId: rev.id },
        include: {
          draftRevision: true,
          publishedRevision: true,
          analysisJobs: { orderBy: { createdAt: "desc" }, take: 5 },
        },
      });
    });
  }

  return { ok: true as const, plan };
}

export async function saveFloorPlanDraft(input: {
  propertyId: string;
  userId: string;
  document: FloorPlanDocument;
}) {
  const access = await assertCanManageListing({
    propertyId: input.propertyId,
    userId: input.userId,
  });
  if (!access.ok) {
    return { ok: false as const, error: "Nemáte oprávnění upravit tuto nabídku." };
  }

  const plan = await prisma.propertyFloorPlan.findFirst({
    where: { propertyId: input.propertyId, status: { not: "ARCHIVED" } },
    include: { draftRevision: true, revisions: { orderBy: { version: "desc" }, take: 1 } },
  });
  if (!plan) {
    return { ok: false as const, error: "Půdorys neexistuje." };
  }

  let document = recomputeRoomAreas(input.document);
  document = {
    ...document,
    issues: validateFloorPlanDocument(document),
    disclaimerCs: disclaimerForKind(document.outputKind),
  };

  const nextVersion = (plan.revisions[0]?.version ?? 0) + 1;
  const rev = await prisma.propertyFloorPlanRevision.create({
    data: {
      floorPlanId: plan.id,
      version: nextVersion,
      document,
      outputKind: document.outputKind,
      scaleState: document.scaleState,
      disclaimerCs: document.disclaimerCs,
      createdByUserId: input.userId,
    },
  });

  const updated = await prisma.propertyFloorPlan.update({
    where: { id: plan.id },
    data: {
      draftRevisionId: rev.id,
      status: plan.status === "PUBLISHED" ? "REVIEW_REQUIRED" : "DRAFT",
    },
    include: { draftRevision: true, publishedRevision: true },
  });

  return { ok: true as const, plan: updated, revisionId: rev.id };
}

export async function publishFloorPlan(input: {
  propertyId: string;
  userId: string;
  revisionId?: string;
}) {
  const access = await assertCanManageListing({
    propertyId: input.propertyId,
    userId: input.userId,
  });
  if (!access.ok) {
    return { ok: false as const, error: "Nemáte oprávnění upravit tuto nabídku." };
  }

  const plan = await prisma.propertyFloorPlan.findFirst({
    where: { propertyId: input.propertyId, status: { not: "ARCHIVED" } },
  });
  if (!plan) return { ok: false as const, error: "Půdorys neexistuje." };

  const revisionId = input.revisionId ?? plan.draftRevisionId;
  if (!revisionId) {
    return { ok: false as const, error: "Není co publikovat — uložte návrh." };
  }

  const rev = await prisma.propertyFloorPlanRevision.findFirst({
    where: { id: revisionId, floorPlanId: plan.id },
  });
  if (!rev) return { ok: false as const, error: "Revize nenalezena." };

  const doc = parseDocument(rev.document);
  const issues = validateFloorPlanDocument(doc);
  if (issues.some((i) => i.severity === "error")) {
    return {
      ok: false as const,
      error: "Půdorys obsahuje chyby geometrie. Opravte je před zveřejněním.",
      issues,
    };
  }

  await prisma.propertyFloorPlan.update({
    where: { id: plan.id },
    data: {
      publishedRevisionId: rev.id,
      status: "PUBLISHED",
    },
  });

  return { ok: true as const };
}

/** Public published document only — never drafts. */
export async function loadPublishedFloorPlan(propertyId: string) {
  const plan = await prisma.propertyFloorPlan.findFirst({
    where: { propertyId, status: "PUBLISHED" },
    include: { publishedRevision: true },
  });
  if (!plan?.publishedRevision) return null;
  return {
    planId: plan.id,
    revisionId: plan.publishedRevision.id,
    document: parseDocument(plan.publishedRevision.document),
    updatedAt: plan.updatedAt,
  };
}

/**
 * Photo → AI analysis. Without provider config, job fails clearly
 * (never returns a fake floor plan as if photos were analysed).
 */
export async function enqueuePhotoAnalysisJob(input: {
  propertyId: string;
  userId: string;
  clientRequestId: string;
  photoGroupPayload: unknown;
}) {
  const access = await assertCanManageListing({
    propertyId: input.propertyId,
    userId: input.userId,
  });
  if (!access.ok) {
    return { ok: false as const, error: "Nemáte oprávnění." };
  }

  const ensured = await getOrCreateFloorPlanForProperty(input);
  if (!ensured.ok) return ensured;

  const existing = await prisma.propertyFloorPlanAnalysisJob.findFirst({
    where: {
      floorPlanId: ensured.plan.id,
      clientRequestId: input.clientRequestId,
    },
  });
  if (existing) {
    return { ok: true as const, job: existing, deduped: true as const };
  }

  const recentCount = await prisma.propertyFloorPlanAnalysisJob.count({
    where: {
      floorPlanId: ensured.plan.id,
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
  });
  if (recentCount >= 5) {
    return {
      ok: false as const,
      error:
        "Limit analýz pro tuto nabídku (5 / hodina) byl dosažen. Zkuste později nebo použijte ruční editor.",
    };
  }

  const providerConfigured = Boolean(
    process.env.FLOORPLAN_VISION_API_KEY || process.env.OPENAI_API_KEY,
  );

  const draftVersion = ensured.plan.draftRevision?.version ?? null;

  const job = await prisma.propertyFloorPlanAnalysisJob.create({
    data: {
      floorPlanId: ensured.plan.id,
      kind: "photo_analysis",
      status: providerConfigured ? "QUEUED" : "FAILED",
      progressPct: providerConfigured ? 0 : 100,
      clientRequestId: input.clientRequestId,
      payload: {
        groups: input.photoGroupPayload,
        expectedDraftVersion: draftVersion,
        maxFiles: 40,
        maxBytesPerFile: 12_000_000,
      } as object,
      createdByUserId: input.userId,
      finishedAt: providerConfigured ? null : new Date(),
      errorMessageCs: providerConfigured
        ? null
        : "Analýza fotografií není aktuálně dostupná (chybí konfigurace poskytovatele). Použijte ruční editor nebo nahrání existujícího půdorysu.",
    },
  });

  return { ok: true as const, job, deduped: false as const };
}
