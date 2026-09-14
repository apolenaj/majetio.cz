/**
 * Pure quota reconciliation — used by OrganizationService and unit tests.
 * Downgrade never deletes listings; excess → OVER_LIMIT + CTA.
 */

import {
  OVER_LIMIT_CTA,
  b2bPlansConfig,
  isB2bPlanKey,
  type B2bPlanKey,
  type B2bPlanLimits,
} from "@/config/organizations-b2b";

export type QuotaListing = {
  id: string;
  /** Prefer publishedAt, else createdAt — newer kept WITHIN_LIMIT first. */
  rankAt: Date;
  listingQuotaState: "WITHIN_LIMIT" | "OVER_LIMIT";
};

export type QuotaReconcileResult = {
  keepWithinLimitIds: string[];
  markOverLimitIds: string[];
  restoreWithinLimitIds: string[];
  overLimitReason: string;
  actionRequired: typeof OVER_LIMIT_CTA & {
    overLimitCount: number;
    listingsLimit: number;
  };
};

export function resolveB2bPlanLimits(
  planKey: string,
  planLimitsJson?: unknown,
): B2bPlanLimits {
  if (planLimitsJson && typeof planLimitsJson === "object" && !Array.isArray(planLimitsJson)) {
    const raw = planLimitsJson as Record<string, unknown>;
    const max =
      typeof raw.maxActiveListings === "number" ? raw.maxActiveListings : null;
    const seats = typeof raw.seats === "number" ? raw.seats : null;
    if (max != null && seats != null) {
      return {
        maxActiveListings: max,
        seats,
        projectsMax:
          typeof raw.projectsMax === "number" ? raw.projectsMax : undefined,
      };
    }
  }
  if (isB2bPlanKey(planKey)) {
    return { ...b2bPlansConfig[planKey].limits };
  }
  return { ...b2bPlansConfig.agent_free.limits };
}

export function comparePlanTier(fromKey: string, toKey: string): "UPGRADE" | "DOWNGRADE" | "SAME" {
  const order: B2bPlanKey[] = [
    "agent_free",
    "agent_pro",
    "agency_growth",
    "developer_standard",
  ];
  const a = isB2bPlanKey(fromKey) ? order.indexOf(fromKey) : -1;
  const b = isB2bPlanKey(toKey) ? order.indexOf(toKey) : -1;
  if (a === b) return "SAME";
  // Prefer limit-based when both known
  const fromLimits = resolveB2bPlanLimits(fromKey);
  const toLimits = resolveB2bPlanLimits(toKey);
  if (toLimits.maxActiveListings > fromLimits.maxActiveListings) return "UPGRADE";
  if (toLimits.maxActiveListings < fromLimits.maxActiveListings) return "DOWNGRADE";
  if (b > a) return "UPGRADE";
  if (b < a) return "DOWNGRADE";
  return "SAME";
}

/**
 * Keep the newest `limit` listings WITHIN_LIMIT; mark the rest OVER_LIMIT.
 * On upgrade capacity, restore oldest OVER_LIMIT first until quota fills.
 */
export function reconcileListingQuota(input: {
  listings: QuotaListing[];
  listingsLimit: number;
  reason?: string;
}): QuotaReconcileResult {
  const limit = Math.max(0, Math.floor(input.listingsLimit));
  const sorted = [...input.listings].sort(
    (a, b) => b.rankAt.getTime() - a.rankAt.getTime(),
  );

  const keepWithinLimitIds = sorted.slice(0, limit).map((l) => l.id);
  const keepSet = new Set(keepWithinLimitIds);
  const markOverLimitIds = sorted
    .filter((l) => !keepSet.has(l.id))
    .map((l) => l.id);

  const restoreWithinLimitIds = sorted
    .slice(0, limit)
    .filter((l) => l.listingQuotaState === "OVER_LIMIT")
    .map((l) => l.id);

  const overLimitCount = markOverLimitIds.length;
  const overLimitReason =
    input.reason ??
    (overLimitCount > 0
      ? `Tarif povoluje ${limit} aktivních nabídek; ${overLimitCount} je nad limitem.`
      : "");

  return {
    keepWithinLimitIds,
    markOverLimitIds,
    restoreWithinLimitIds,
    overLimitReason,
    actionRequired: {
      ...OVER_LIMIT_CTA,
      overLimitCount,
      listingsLimit: limit,
    },
  };
}
