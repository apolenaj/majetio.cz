"use server";

import { revalidatePath } from "next/cache";

import {
  assertSensitiveAction,
  requirePermission,
  SensitiveActionError,
} from "@/domains/administration";
import {
  setFeatureFlagEnabled,
  upsertFeatureFlag,
  type FeatureFlagScope,
} from "@/domains/platform/admin/feature-flags";
import { upsertAppConfiguration } from "@/domains/platform/admin/config-center";
import {
  createCmsContent,
  transitionCmsContent,
  upsertContentTranslation,
  type CmsContentKind,
  type CmsContentStatus,
  type ContentTranslationStatus,
} from "@/domains/platform/admin/content-governance";
import {
  openIncident,
  updateIncidentStatus,
  type IncidentCategory,
  type IncidentSeverity,
  type IncidentStatus,
} from "@/domains/platform/admin/incidents";
import {
  emergencyPauseMarket,
  setMarketLaunchStatus,
} from "@/domains/platform/admin/market-ops";
import type { LaunchStatus } from "@/domains/markets/types";

function catchSensitive(err: unknown): { ok: false; error: string } | null {
  if (err instanceof SensitiveActionError) {
    return { ok: false, error: err.message };
  }
  return null;
}

export async function adminSetFeatureFlagAction(input: {
  flagId: string;
  enabled: boolean;
  reason: string;
  confirmToken: string;
  percentage?: number | null;
}) {
  const actor = await requirePermission("platform.flags.write");
  try {
    await assertSensitiveAction({
      actorId: actor.id,
      actorRole: actor.role,
      permission: "platform.flags.write",
      reason: input.reason,
      confirmToken: input.confirmToken,
      entity: "FeatureFlag",
      entityId: input.flagId,
    });
  } catch (err) {
    const s = catchSensitive(err);
    if (s) return s;
    throw err;
  }
  const result = await setFeatureFlagEnabled({
    flagId: input.flagId,
    enabled: input.enabled,
    reason: input.reason,
    actorUserId: actor.id,
    percentage: input.percentage,
  });
  if (result.ok) {
    revalidatePath("/admin/nastaveni");
    revalidatePath("/admin/trhy");
  }
  return result;
}

export async function adminUpsertFeatureFlagAction(input: {
  key: string;
  scope: FeatureFlagScope;
  marketCode?: string;
  enabled: boolean;
  percentage?: number | null;
  isKillSwitch?: boolean;
  description?: string;
  reason: string;
  confirmToken: string;
}) {
  const actor = await requirePermission("platform.flags.write");
  try {
    await assertSensitiveAction({
      actorId: actor.id,
      actorRole: actor.role,
      permission: "platform.flags.write",
      reason: input.reason,
      confirmToken: input.confirmToken,
      entity: "FeatureFlag",
      meta: { key: input.key },
    });
  } catch (err) {
    const s = catchSensitive(err);
    if (s) return s;
    throw err;
  }
  const result = await upsertFeatureFlag({
    ...input,
    actorUserId: actor.id,
  });
  if (result.ok) revalidatePath("/admin/nastaveni");
  return result;
}

export async function adminUpsertConfigAction(input: {
  key: string;
  value: unknown;
  description?: string;
  category?: string;
  reason: string;
}) {
  const actor = await requirePermission("platform.flags.write");
  const result = await upsertAppConfiguration({
    ...input,
    actorUserId: actor.id,
  });
  if (result.ok) revalidatePath("/admin/nastaveni");
  return result;
}

export async function adminCreateCmsContentAction(input: {
  slug: string;
  kind: CmsContentKind;
  title: string;
  bodyMarkdown: string;
  marketCode?: string;
  locale?: string;
  isRegulatory?: boolean;
  sourceLabel?: string;
  sourceUrl?: string;
}) {
  const actor = await requirePermission("platform.content.write");
  const result = await createCmsContent({
    ...input,
    actorUserId: actor.id,
  });
  if (result.ok) revalidatePath("/admin/obsah");
  return result;
}

export async function adminTransitionCmsAction(input: {
  contentId: string;
  nextStatus: CmsContentStatus;
  reason: string;
  confirmToken?: string;
}) {
  if (input.nextStatus === "PUBLISHED") {
    const actor = await requirePermission("platform.content.publish");
    try {
      await assertSensitiveAction({
        actorId: actor.id,
        actorRole: actor.role,
        permission: "platform.content.publish",
        reason: input.reason,
        confirmToken: input.confirmToken ?? "",
        entity: "CmsContent",
        entityId: input.contentId,
      });
    } catch (err) {
      const s = catchSensitive(err);
      if (s) return s;
      throw err;
    }
    const result = await transitionCmsContent({
      ...input,
      actorUserId: actor.id,
    });
    if (result.ok) revalidatePath("/admin/obsah");
    return result;
  }
  const actor = await requirePermission("platform.content.write");
  const result = await transitionCmsContent({
    ...input,
    actorUserId: actor.id,
  });
  if (result.ok) revalidatePath("/admin/obsah");
  return result;
}

export async function adminUpsertTranslationAction(input: {
  contentId: string;
  locale: string;
  title: string;
  bodyMarkdown: string;
  status: ContentTranslationStatus;
}) {
  const actor = await requirePermission("platform.content.write");
  const result = await upsertContentTranslation({
    ...input,
    actorUserId: actor.id,
  });
  if (result.ok) revalidatePath("/admin/obsah");
  return result;
}

export async function adminOpenIncidentAction(input: {
  title: string;
  summary: string;
  category: IncidentCategory;
  severity?: IncidentSeverity;
  marketCode?: string | null;
}) {
  const actor = await requirePermission("platform.incidents.write");
  const result = await openIncident({
    ...input,
    actorUserId: actor.id,
  });
  if (result.ok) revalidatePath("/admin/incidenty");
  return result;
}

export async function adminUpdateIncidentAction(input: {
  incidentId: string;
  status: IncidentStatus;
  reason: string;
}) {
  const actor = await requirePermission("platform.incidents.write");
  const result = await updateIncidentStatus({
    ...input,
    actorUserId: actor.id,
  });
  if (result.ok) revalidatePath("/admin/incidenty");
  return result;
}

export async function adminSetMarketLaunchAction(input: {
  marketCode: string;
  nextStatus: LaunchStatus;
  reason: string;
  confirmToken: string;
}) {
  const actor = await requirePermission("platform.markets.write");
  try {
    await assertSensitiveAction({
      actorId: actor.id,
      actorRole: actor.role,
      permission: "platform.markets.write",
      reason: input.reason,
      confirmToken: input.confirmToken,
      entity: "Market",
      entityId: input.marketCode,
      meta: { nextStatus: input.nextStatus },
    });
  } catch (err) {
    const s = catchSensitive(err);
    if (s) return s;
    throw err;
  }
  const result = await setMarketLaunchStatus({
    marketCode: input.marketCode,
    nextStatus: input.nextStatus,
    actorUserId: actor.id,
    reason: input.reason,
  });
  if (result.ok) revalidatePath("/admin/trhy");
  return result;
}

export async function adminEmergencyPauseMarketAction(input: {
  marketCode: string;
  reason: string;
  confirmToken: string;
}) {
  const actor = await requirePermission("platform.markets.write");
  try {
    await assertSensitiveAction({
      actorId: actor.id,
      actorRole: actor.role,
      permission: "platform.markets.write",
      reason: input.reason,
      confirmToken: input.confirmToken,
      entity: "Market",
      entityId: input.marketCode,
      meta: { nextStatus: "PAUSED" },
    });
  } catch (err) {
    const s = catchSensitive(err);
    if (s) return s;
    throw err;
  }
  const result = await emergencyPauseMarket({
    marketCode: input.marketCode,
    actorUserId: actor.id,
    reason: input.reason,
  });
  if (result.ok) revalidatePath("/admin/trhy");
  return result;
}
