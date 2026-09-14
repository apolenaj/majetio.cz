/**
 * Property alert thresholds & fatigue limits.
 */

export const propertyAlertConfig = {
  channels: ["IN_APP", "EMAIL"] as const,
  price: {
    /** Ignore absolute moves smaller than this (Kč). */
    minAbsoluteChangeCzk: 10_000,
    /** Ignore relative moves smaller than this (ratio, e.g. 0.005 = 0.5 %). */
    minRelativeChange: 0.005,
    /** PriceChangeType values that are never alert-worthy. */
    ignoreChangeTypes: ["INITIAL", "CORRECTED", "REMOVED"] as const,
  },
  status: {
    /**
     * Explicit lifecycle statuses that warrant STATUS_CHANGED.
     * Never includes freshness-only silence (STALE / source outage → UNAVAILABLE).
     */
    noteworthy: ["RESERVED", "SOLD", "RENTED", "WITHDRAWN"] as const,
    /** Previous statuses that make a return to ACTIVE a RELISTED event. */
    relistFrom: [
      "SOLD",
      "RENTED",
      "WITHDRAWN",
      "UNAVAILABLE",
      "ARCHIVED",
      "RESERVED",
    ] as const,
  },
  fatigue: {
    /** Max property alerts per user per calendar day (all types). */
    maxPerUserPerDay: 20,
    /** Max alerts for the same property per user per day. */
    maxPerPropertyPerDay: 3,
    /** Saved-search matches batch window (hours). */
    savedSearchBatchHours: 24,
  },
  /** Alert types that are always transactional (never require marketing consent). */
  transactionalTypes: [
    "PRICE_DECREASE",
    "PRICE_INCREASE",
    "PRICE_DROP",
    "STATUS_CHANGED",
    "RELISTED",
    "NEW_ANALYSIS_AVAILABLE",
    "FINANCING_CHANGED",
    "SAVED_SEARCH_MATCH",
    "NEW_PROPERTY",
  ] as const,
} as const;

export type PropertyAlertConfig = typeof propertyAlertConfig;
