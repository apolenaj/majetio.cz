/**
 * Freshness — mark metrics stale when past source update cadence / TTL.
 */

import type { LocationMetricFreshness } from "@prisma/client";

const DEFAULT_STALE_DAYS: Record<string, number> = {
  REALTIME: 2,
  DAILY: 3,
  WEEKLY: 14,
  MONTHLY: 45,
  QUARTERLY: 120,
  YEARLY: 400,
  AD_HOC: 90,
};

export function resolveFreshness(input: {
  calculatedAt: Date;
  now?: Date;
  updateFrequency?: keyof typeof DEFAULT_STALE_DAYS;
  staleAfterDays?: number;
}): LocationMetricFreshness {
  const now = input.now ?? new Date();
  const maxAgeDays =
    input.staleAfterDays ??
    DEFAULT_STALE_DAYS[input.updateFrequency ?? "MONTHLY"] ??
    45;
  const ageMs = now.getTime() - input.calculatedAt.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays < 0) return "UNKNOWN";
  return ageDays > maxAgeDays ? "STALE" : "FRESH";
}
