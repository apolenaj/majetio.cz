/**
 * Platform Feature Flags + Kill switches (Prompt 6).
 * Every mutation writes FeatureFlagChange + AuditLog (old/new/reason/actor).
 */

import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/auth/audit";

export const KILL_SWITCH_KEYS = [
  "kill.payments",
  "kill.new_listings",
  "kill.valuations",
  "kill.markets",
] as const;

export type KillSwitchKey = (typeof KILL_SWITCH_KEYS)[number];

export type FeatureFlagScope = "GLOBAL" | "MARKET" | "USER_PERCENTAGE";

export type FeatureFlagRow = {
  id: string;
  key: string;
  scope: FeatureFlagScope;
  marketCode: string;
  percentage: number | null;
  enabled: boolean;
  isKillSwitch: boolean;
  description: string | null;
  updatedAt: Date;
};

export function isKillSwitchKey(key: string): key is KillSwitchKey {
  return (KILL_SWITCH_KEYS as readonly string[]).includes(key);
}

export async function listFeatureFlags(input?: {
  killSwitchesOnly?: boolean;
}): Promise<{ items: FeatureFlagRow[]; error: string | null }> {
  try {
    const rows = await prisma.featureFlag.findMany({
      where: input?.killSwitchesOnly ? { isKillSwitch: true } : undefined,
      orderBy: [{ isKillSwitch: "desc" }, { key: "asc" }],
      take: 200,
    });
    return {
      items: rows.map((r) => ({
        id: r.id,
        key: r.key,
        scope: r.scope as FeatureFlagScope,
        marketCode: r.marketCode,
        percentage: r.percentage,
        enabled: r.enabled,
        isKillSwitch: r.isKillSwitch,
        description: r.description,
        updatedAt: r.updatedAt,
      })),
      error: null,
    };
  } catch (err) {
    return {
      items: [],
      error: err instanceof Error ? err.message : "Feature flag list failed",
    };
  }
}

export async function isKillSwitchEngaged(key: KillSwitchKey): Promise<boolean> {
  try {
    const row = await prisma.featureFlag.findFirst({
      where: {
        key,
        scope: "GLOBAL",
        marketCode: "",
        isKillSwitch: true,
      },
      select: { enabled: true },
    });
    return row?.enabled === true;
  } catch {
    return false;
  }
}

export async function setFeatureFlagEnabled(input: {
  flagId: string;
  enabled: boolean;
  reason: string;
  actorUserId: string;
  percentage?: number | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.reason.trim().length < 8) {
    return { ok: false, error: "Reason required (min. 8 characters)." };
  }

  const flag = await prisma.featureFlag.findUnique({
    where: { id: input.flagId },
  });
  if (!flag) return { ok: false, error: "Flag not found." };

  if (
    flag.scope === "USER_PERCENTAGE" &&
    input.percentage != null &&
    (input.percentage < 0 || input.percentage > 100)
  ) {
    return { ok: false, error: "percentage must be 0–100." };
  }

  const oldEnabled = flag.enabled;
  const oldPct = flag.percentage;
  const nextPct =
    input.percentage !== undefined ? input.percentage : flag.percentage;

  const updated = await prisma.featureFlag.update({
    where: { id: flag.id },
    data: {
      enabled: input.enabled,
      percentage: nextPct,
    },
  });

  await prisma.featureFlagChange.create({
    data: {
      featureFlagId: flag.id,
      actorUserId: input.actorUserId,
      reason: input.reason.trim(),
      oldEnabled,
      newEnabled: input.enabled,
      oldValueJson: {
        enabled: oldEnabled,
        percentage: oldPct,
        scope: flag.scope,
        marketCode: flag.marketCode,
      },
      newValueJson: {
        enabled: updated.enabled,
        percentage: updated.percentage,
        scope: updated.scope,
        marketCode: updated.marketCode,
      },
    },
  });

  await writeAuditLog({
    action: flag.isKillSwitch
      ? "admin.kill_switch.change"
      : "admin.feature_flag.change",
    entity: "FeatureFlag",
    entityId: flag.id,
    actorId: input.actorUserId,
    meta: {
      key: flag.key,
      old: oldEnabled,
      new: input.enabled,
      reason: input.reason.trim().slice(0, 300),
      isKillSwitch: flag.isKillSwitch,
    },
  });

  return { ok: true };
}

export async function upsertFeatureFlag(input: {
  key: string;
  scope: FeatureFlagScope;
  marketCode?: string;
  enabled: boolean;
  percentage?: number | null;
  isKillSwitch?: boolean;
  description?: string;
  reason: string;
  actorUserId: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (input.reason.trim().length < 8) {
    return { ok: false, error: "Reason required." };
  }
  if (input.scope === "MARKET" && !input.marketCode?.trim()) {
    return { ok: false, error: "marketCode required for MARKET scope." };
  }
  const marketCode =
    input.scope === "MARKET" ? input.marketCode!.trim().toUpperCase() : "";

  const existing = await prisma.featureFlag.findUnique({
    where: {
      key_scope_marketCode: {
        key: input.key,
        scope: input.scope,
        marketCode,
      },
    },
  });

  if (existing) {
    const result = await setFeatureFlagEnabled({
      flagId: existing.id,
      enabled: input.enabled,
      reason: input.reason,
      actorUserId: input.actorUserId,
      percentage: input.percentage,
    });
    if (!result.ok) return result;
    return { ok: true, id: existing.id };
  }

  const row = await prisma.featureFlag.create({
    data: {
      key: input.key,
      scope: input.scope,
      marketCode,
      enabled: input.enabled,
      percentage: input.percentage ?? null,
      isKillSwitch: input.isKillSwitch ?? isKillSwitchKey(input.key),
      description: input.description ?? null,
    },
  });

  await prisma.featureFlagChange.create({
    data: {
      featureFlagId: row.id,
      actorUserId: input.actorUserId,
      reason: input.reason.trim(),
      oldEnabled: false,
      newEnabled: input.enabled,
      newValueJson: {
        enabled: input.enabled,
        percentage: input.percentage ?? null,
      },
    },
  });

  await writeAuditLog({
    action: "admin.feature_flag.create",
    entity: "FeatureFlag",
    entityId: row.id,
    actorId: input.actorUserId,
    meta: {
      key: row.key,
      old: null,
      new: input.enabled,
      reason: input.reason.trim().slice(0, 300),
    },
  });

  return { ok: true, id: row.id };
}

/** Deterministic USER_PERCENTAGE rollout (stable per userId). */
export function isUserInPercentageRollout(
  userId: string,
  percentage: number,
): boolean {
  if (percentage <= 0) return false;
  if (percentage >= 100) return true;
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return hash % 100 < percentage;
}
