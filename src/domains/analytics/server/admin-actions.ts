"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import {
  assertSensitiveAction,
  roleHasPermission,
  SensitiveActionError,
} from "@/domains/administration";
import {
  overrideValuationEstimate,
  transitionValuationModel,
} from "@/domains/valuation/admin/control-center";
import type { ModelLifecycleStatus } from "@/domains/valuation/admin/metrics";
import {
  approveAndActivateAssumption,
  createAssumptionDraftVersion,
  submitAssumptionForApproval,
} from "@/domains/investment/admin/assumptions-governance";
import {
  approveRenovationCatalog,
  createRenovationCatalogDraft,
} from "@/domains/renovation/admin/catalog-governance";
import {
  clearLocationMetricReview,
  remappPropertyLocation,
} from "@/domains/locations/admin/location-ops";
import {
  resolveMortgageOfferReview,
  setMortgageAutoPublish,
} from "@/domains/financing/admin/mortgage-ops";

async function requireActor() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    return { ok: false as const, error: "Přihlášení je povinné." };
  }
  return {
    ok: true as const,
    userId: session.user.id,
    role: session.user.role,
  };
}

function revalidateAnalytics() {
  revalidatePath("/admin/analyzy");
  revalidatePath("/admin/analyzy/valuation");
  revalidatePath("/admin/analyzy/assumptions");
  revalidatePath("/admin/analyzy/renovation");
  revalidatePath("/admin/analyzy/hypoteka");
  revalidatePath("/admin/lokality");
  revalidatePath("/admin");
}

export async function adminTransitionValuationModelAction(input: {
  modelId: string;
  nextStatus: ModelLifecycleStatus;
  reason: string;
  confirmToken?: string;
}) {
  const actor = await requireActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };

  const needsApprove =
    input.nextStatus === "APPROVED" || input.nextStatus === "ACTIVE";
  if (needsApprove) {
    if (!roleHasPermission(actor.role, "analytics.models.approve")) {
      return {
        ok: false as const,
        error: "Chybí oprávnění analytics.models.approve.",
      };
    }
    try {
      await assertSensitiveAction({
        actorId: actor.userId,
        actorRole: actor.role,
        permission: "analytics.models.approve",
        reason: input.reason,
        confirmToken: input.confirmToken ?? "",
        entity: "ValuationModelRegistry",
        entityId: input.modelId,
        meta: { nextStatus: input.nextStatus },
      });
    } catch (err) {
      if (err instanceof SensitiveActionError) {
        return { ok: false as const, error: err.message };
      }
      throw err;
    }
  } else if (!roleHasPermission(actor.role, "analytics.models.write")) {
    return {
      ok: false as const,
      error: "Chybí oprávnění analytics.models.write.",
    };
  }

  const result = await transitionValuationModel({
    modelId: input.modelId,
    nextStatus: input.nextStatus,
    actorUserId: actor.userId,
    reason: input.reason,
  });
  if (!result.ok) return result;
  revalidateAnalytics();
  return { ok: true as const };
}

export async function adminOverrideValuationAction(input: {
  valuationId: string;
  estimatedValue: number;
  reason: string;
}) {
  const actor = await requireActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };
  if (!roleHasPermission(actor.role, "analytics.models.write")) {
    return {
      ok: false as const,
      error: "Chybí oprávnění analytics.models.write.",
    };
  }
  const result = await overrideValuationEstimate({
    ...input,
    actorUserId: actor.userId,
  });
  if (!result.ok) return result;
  revalidateAnalytics();
  return { ok: true as const };
}

export async function adminCreateAssumptionDraftAction(input: {
  versionKey: string;
  label: string;
  changeReason: string;
}) {
  const actor = await requireActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };
  if (!roleHasPermission(actor.role, "analytics.models.write")) {
    return { ok: false as const, error: "Chybí oprávnění." };
  }
  const result = await createAssumptionDraftVersion({
    ...input,
    actorUserId: actor.userId,
  });
  if (!result.ok) return result;
  revalidateAnalytics();
  return result;
}

export async function adminSubmitAssumptionAction(input: { versionId: string }) {
  const actor = await requireActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };
  if (!roleHasPermission(actor.role, "analytics.models.write")) {
    return { ok: false as const, error: "Chybí oprávnění." };
  }
  const result = await submitAssumptionForApproval({
    versionId: input.versionId,
    actorUserId: actor.userId,
  });
  if (!result.ok) return result;
  revalidateAnalytics();
  return { ok: true as const };
}

export async function adminActivateAssumptionAction(input: {
  versionId: string;
  reason: string;
  confirmToken: string;
}) {
  const actor = await requireActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };
  if (!roleHasPermission(actor.role, "analytics.models.approve")) {
    return { ok: false as const, error: "Chybí approve oprávnění." };
  }
  try {
    await assertSensitiveAction({
      actorId: actor.userId,
      actorRole: actor.role,
      permission: "analytics.models.approve",
      reason: input.reason,
      confirmToken: input.confirmToken,
      entity: "AssumptionConfigVersion",
      entityId: input.versionId,
    });
  } catch (err) {
    if (err instanceof SensitiveActionError) {
      return { ok: false as const, error: err.message };
    }
    throw err;
  }
  const result = await approveAndActivateAssumption({
    versionId: input.versionId,
    actorUserId: actor.userId,
    reason: input.reason,
  });
  if (!result.ok) return result;
  revalidateAnalytics();
  return { ok: true as const };
}

export async function adminCreateRenovationCatalogDraftAction(input: {
  versionKey: string;
  label: string;
  changeReason: string;
}) {
  const actor = await requireActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };
  if (!roleHasPermission(actor.role, "analytics.models.write")) {
    return { ok: false as const, error: "Chybí oprávnění." };
  }
  const result = await createRenovationCatalogDraft({
    ...input,
    actorUserId: actor.userId,
  });
  if (!result.ok) return result;
  revalidateAnalytics();
  return result;
}

export async function adminActivateRenovationCatalogAction(input: {
  versionId: string;
  reason: string;
  confirmToken: string;
  forceDespiteAnomalies?: boolean;
}) {
  const actor = await requireActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };
  if (!roleHasPermission(actor.role, "analytics.models.approve")) {
    return { ok: false as const, error: "Chybí approve oprávnění." };
  }
  try {
    await assertSensitiveAction({
      actorId: actor.userId,
      actorRole: actor.role,
      permission: "analytics.models.approve",
      reason: input.reason,
      confirmToken: input.confirmToken,
      entity: "RenovationCostCatalogVersion",
      entityId: input.versionId,
    });
  } catch (err) {
    if (err instanceof SensitiveActionError) {
      return { ok: false as const, error: err.message };
    }
    throw err;
  }
  const result = await approveRenovationCatalog({
    versionId: input.versionId,
    actorUserId: actor.userId,
    reason: input.reason,
    forceDespiteAnomalies: input.forceDespiteAnomalies,
  });
  if (!result.ok) return result;
  revalidateAnalytics();
  return { ok: true as const };
}

export async function adminClearLocationMetricReviewAction(input: {
  metricId: string;
  reason: string;
}) {
  const actor = await requireActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };
  if (!roleHasPermission(actor.role, "analytics.models.write")) {
    return { ok: false as const, error: "Chybí oprávnění." };
  }
  const result = await clearLocationMetricReview({
    ...input,
    actorUserId: actor.userId,
  });
  if (!result.ok) return result;
  revalidateAnalytics();
  return { ok: true as const };
}

export async function adminRemapPropertyLocationAction(input: {
  propertyId: string;
  locationId: string;
  reason: string;
}) {
  const actor = await requireActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };
  if (!roleHasPermission(actor.role, "analytics.models.write")) {
    return { ok: false as const, error: "Chybí oprávnění." };
  }
  const result = await remappPropertyLocation({
    ...input,
    actorUserId: actor.userId,
  });
  if (!result.ok) return result;
  revalidateAnalytics();
  return { ok: true as const };
}

export async function adminSetMortgageAutoPublishAction(input: {
  enabled: boolean;
  reason: string;
}) {
  const actor = await requireActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };
  if (!roleHasPermission(actor.role, "analytics.models.approve")) {
    return { ok: false as const, error: "Chybí approve oprávnění." };
  }
  const result = await setMortgageAutoPublish({
    ...input,
    actorUserId: actor.userId,
  });
  if (!result.ok) return result;
  revalidateAnalytics();
  return { ok: true as const };
}

export async function adminResolveMortgageOfferAction(input: {
  offerId: string;
  decision: "APPROVE" | "REJECT";
  reason: string;
}) {
  const actor = await requireActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };
  if (!roleHasPermission(actor.role, "analytics.models.write")) {
    return { ok: false as const, error: "Chybí oprávnění." };
  }
  const result = await resolveMortgageOfferReview({
    ...input,
    actorUserId: actor.userId,
  });
  if (!result.ok) return result;
  revalidateAnalytics();
  return { ok: true as const };
}
