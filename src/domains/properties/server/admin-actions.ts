"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import {
  assertSensitiveAction,
  roleHasPermission,
  SensitiveActionError,
} from "@/domains/administration";
import { upsertPropertyFieldOverride } from "@/domains/properties/admin/override-service";
import {
  applyModerationDecision,
  submitPropertyForReview,
} from "@/domains/properties/admin/moderation-service";
import type { ModerationDecision } from "@/domains/properties/admin/moderation-copy";
import {
  executePropertyMerge,
  previewPropertyMerge,
  revertPropertyMerge,
} from "@/domains/properties/admin/merge-service";
import { prisma } from "@/lib/db";
import { invalidatePublicPropertyCaches } from "@/domains/properties/cache/property-public-cache";

async function requireActor(): Promise<
  | { ok: true; userId: string; role: string }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    return { ok: false, error: "Přihlášení je povinné." };
  }
  return { ok: true, userId: session.user.id, role: session.user.role };
}

function revalidatePropertyPaths(propertyId?: string) {
  revalidatePath("/admin/nemovitosti");
  revalidatePath("/admin/nemovitosti/moderace");
  revalidatePath("/admin/nemovitosti/duplikaty");
  revalidatePath("/admin");
  if (propertyId) {
    revalidatePath(`/admin/nemovitosti/${propertyId}`);
    revalidatePath(`/admin/properties/${propertyId}`);
  }
}

async function bustPublicPropertyCache(propertyId?: string) {
  if (!propertyId) {
    invalidatePublicPropertyCaches({});
    return;
  }
  const row = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { slug: true },
  });
  invalidatePublicPropertyCaches({
    propertyId,
    slug: row?.slug ?? null,
  });
}

async function revalidateAfterPropertyChange(propertyId?: string) {
  revalidatePropertyPaths(propertyId);
  await bustPublicPropertyCache(propertyId);
}

export async function adminOverridePropertyFieldAction(input: {
  propertyId: string;
  fieldKey: string;
  value: string;
  reason: string;
  expiresAt?: string | null;
}) {
  const actor = await requireActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };
  if (!roleHasPermission(actor.role, "property.override")) {
    return { ok: false as const, error: "Chybí oprávnění property.override." };
  }

  const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    return { ok: false as const, error: "Neplatné datum expirace." };
  }

  const result = await upsertPropertyFieldOverride({
    propertyId: input.propertyId,
    fieldKey: input.fieldKey,
    value: input.value,
    reason: input.reason,
    actorUserId: actor.userId,
    expiresAt,
    applyToCanonical: true,
  });

  if (!result.ok) return result;
  await revalidateAfterPropertyChange(input.propertyId);
  return { ok: true as const };
}

export async function adminSubmitPropertyForReviewAction(input: {
  propertyId: string;
}) {
  const actor = await requireActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };
  if (!roleHasPermission(actor.role, "property.moderate")) {
    return { ok: false as const, error: "Chybí oprávnění property.moderate." };
  }

  const result = await submitPropertyForReview({
    propertyId: input.propertyId,
    actorUserId: actor.userId,
  });
  if (!result.ok) return result;
  await revalidateAfterPropertyChange(input.propertyId);
  return { ok: true as const };
}

export async function adminModeratePropertyAction(input: {
  propertyId: string;
  decision: ModerationDecision;
  reason: string;
}) {
  const actor = await requireActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };
  if (!roleHasPermission(actor.role, "property.moderate")) {
    return { ok: false as const, error: "Chybí oprávnění property.moderate." };
  }

  const result = await applyModerationDecision({
    propertyId: input.propertyId,
    decision: input.decision,
    reason: input.reason,
    actorUserId: actor.userId,
  });
  if (!result.ok) return result;
  await revalidateAfterPropertyChange(input.propertyId);
  return {
    ok: true as const,
    userFacingMessage: result.userFacingMessage,
  };
}

export async function adminPreviewMergeAction(input: {
  candidateId: string;
  preferredCanonicalId?: string;
}) {
  const actor = await requireActor();
  if (!actor.ok) {
    return { ok: false as const, error: actor.error, preview: null };
  }
  if (!roleHasPermission(actor.role, "property.merge")) {
    return {
      ok: false as const,
      error: "Chybí oprávnění property.merge.",
      preview: null,
    };
  }
  const result = await previewPropertyMerge(input);
  if (!result.preview) {
    return { ok: false as const, error: result.error ?? "Preview failed", preview: null };
  }
  return { ok: true as const, preview: result.preview, error: null };
}

export async function adminExecuteMergeAction(input: {
  candidateId: string;
  preferredCanonicalId?: string;
  reason: string;
  confirmToken: string;
  notes?: string;
}) {
  const actor = await requireActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };
  if (!roleHasPermission(actor.role, "property.merge")) {
    return { ok: false as const, error: "Chybí oprávnění property.merge." };
  }

  try {
    await assertSensitiveAction({
      actorId: actor.userId,
      actorRole: actor.role,
      permission: "property.merge",
      reason: input.reason,
      confirmToken: input.confirmToken,
      entity: "PropertyDuplicateCandidate",
      entityId: input.candidateId,
    });
  } catch (err) {
    if (err instanceof SensitiveActionError) {
      return { ok: false as const, error: err.message };
    }
    throw err;
  }

  const result = await executePropertyMerge({
    candidateId: input.candidateId,
    preferredCanonicalId: input.preferredCanonicalId,
    actorUserId: actor.userId,
    notes: input.notes,
  });
  if (!result.ok) return result;

  await revalidateAfterPropertyChange(result.canonicalPropertyId);
  await revalidateAfterPropertyChange(result.secondaryPropertyId);
  return result;
}

export async function adminRevertMergeAction(input: {
  mergeEventId: string;
  reason: string;
  confirmToken: string;
}) {
  const actor = await requireActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };
  if (!roleHasPermission(actor.role, "property.merge")) {
    return { ok: false as const, error: "Chybí oprávnění property.merge." };
  }

  try {
    await assertSensitiveAction({
      actorId: actor.userId,
      actorRole: actor.role,
      permission: "property.merge",
      reason: input.reason,
      confirmToken: input.confirmToken,
      entity: "PropertyMergeEvent",
      entityId: input.mergeEventId,
      meta: { revert: true },
    });
  } catch (err) {
    if (err instanceof SensitiveActionError) {
      return { ok: false as const, error: err.message };
    }
    throw err;
  }

  const result = await revertPropertyMerge({
    mergeEventId: input.mergeEventId,
    actorUserId: actor.userId,
  });
  if (!result.ok) return result;
  await revalidateAfterPropertyChange();
  return { ok: true as const };
}

export async function adminMarkNotDuplicateAction(input: {
  candidateId: string;
  notes?: string;
}) {
  const actor = await requireActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };
  if (!roleHasPermission(actor.role, "property.merge")) {
    return { ok: false as const, error: "Chybí oprávnění property.merge." };
  }

  await prisma.propertyDuplicateCandidate.update({
    where: { id: input.candidateId },
    data: {
      status: "NOT_DUPLICATE",
      reviewedAt: new Date(),
      reviewedById: actor.userId,
      notes: input.notes?.trim() || null,
    },
  });

  revalidatePath("/admin/nemovitosti/duplikaty");
  return { ok: true as const };
}
