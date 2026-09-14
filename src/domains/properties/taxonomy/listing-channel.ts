/**
 * Primary vs secondary market + off-plan framework (Prompt 17.3).
 */

export const LISTING_MARKET_CHANNELS = [
  /** Developer / first sale (often off-plan). */
  "PRIMARY_NEW_BUILD",
  /** Existing stock / resale. */
  "SECONDARY_RESALE",
] as const;

export type ListingMarketChannel = (typeof LISTING_MARKET_CHANNELS)[number];

export const CONSTRUCTION_STATUSES = [
  "ANNOUNCED",
  "UNDER_CONSTRUCTION",
  "COMPLETED",
  "HANDED_OVER",
  "UNKNOWN",
] as const;

export type OffPlanConstructionStatus =
  (typeof CONSTRUCTION_STATUSES)[number];

export type OffPlanProjectFramework = {
  isOffPlan: boolean;
  marketChannel: ListingMarketChannel;
  constructionStatus: OffPlanConstructionStatus;
  /** ISO date (UTC) or year-month — display only. */
  expectedCompletion: string | null;
  developerName: string | null;
  projectName: string | null;
  /** Percent 0–100 when known. */
  constructionProgressPct: number | null;
};

export function defaultOffPlanFramework(
  channel: ListingMarketChannel = "SECONDARY_RESALE",
): OffPlanProjectFramework {
  return {
    isOffPlan: channel === "PRIMARY_NEW_BUILD",
    marketChannel: channel,
    constructionStatus: "UNKNOWN",
    expectedCompletion: null,
    developerName: null,
    projectName: null,
    constructionProgressPct: null,
  };
}

/**
 * Infer channel from soft signals when explicit field missing.
 * Prefer explicit `listingMarketChannel` on Property when present.
 */
export function inferListingMarketChannel(input: {
  explicit?: ListingMarketChannel | null;
  condition?: string | null;
  isOffPlan?: boolean | null;
}): ListingMarketChannel {
  if (input.explicit) return input.explicit;
  if (input.isOffPlan) return "PRIMARY_NEW_BUILD";
  if (input.condition === "NEW") return "PRIMARY_NEW_BUILD";
  return "SECONDARY_RESALE";
}
