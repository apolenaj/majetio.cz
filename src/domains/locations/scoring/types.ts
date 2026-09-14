/**
 * Location scoring types — Phase 3.
 * No single universal black-box score; dimensions are independent.
 */

export const LOCATION_SCORE_METHODOLOGY_VERSION = "location-score.v2026.07";

/** Dimensions are strategy-specific — never merged into one city-wide number. */
export type LocationScoreDimension =
  | "OWN_USE_FIT"
  | "RENTAL_INVESTMENT_FIT"
  | "FLIP_FIT"
  | "MARKET_LIQUIDITY";

export type ScoreAvailability = "available" | "insufficient_data" | "prohibited";

export type RawInputValue = number | string | boolean | null;

export type NormalizedInput = {
  key: string;
  label: string;
  raw: RawInputValue;
  /** 0–100 after normalization; null when input missing. */
  normalized: number | null;
  weight: number;
  available: boolean;
};

export type DimensionScoreResult = {
  dimension: LocationScoreDimension;
  availability: ScoreAvailability;
  /** null when insufficient_data — never substitute 0 for missing data. */
  score: number | null;
  confidence: number;
  weight: number;
  rawInputs: Record<string, RawInputValue>;
  normalizedInputs: NormalizedInput[];
  explanations: string[];
  missingInputs: string[];
};

export type LocationScoreInput = {
  locationId: string;
  segmentKey: string;
  /** Market metrics (from LocationMetric aggregation). */
  market: {
    medianAskingPriceSqm?: number | null;
    medianTransactionPriceSqm?: number | null;
    medianAskingRentSqm?: number | null;
    grossRentalYieldPct?: number | null;
    medianDaysOnMarket?: number | null;
    activeListingsCount?: number | null;
    priceReductionRate?: number | null;
    sampleCounts?: Record<string, number>;
    confidences?: Record<string, number>;
  };
  /** Accessibility & amenities (Majetio POI proximity — not Walk Score). */
  accessibility: import("@/domains/locations/scoring/amenities/types").AccessibilityProfile | null;
  /** Official environmental & development signals only. */
  environment: import("@/domains/locations/scoring/environment/types").EnvironmentalProfile | null;
};

export type LocationScoreResult = {
  locationId: string;
  segmentKey: string;
  methodologyVersion: string;
  computedAt: string;
  dimensions: DimensionScoreResult[];
  /**
   * Optional composite ONLY when user selects a primary strategy/dimension
   * and all required inputs for that dimension are available.
   */
  strategyComposite: {
    dimension: LocationScoreDimension;
    score: number;
    confidence: number;
  } | null;
  disclaimers: string[];
};

export type LocationMatchReason = {
  code: string;
  tone: "positive" | "warning" | "neutral";
  label: string;
};

export type LocationMatchPreferences = {
  maxPriceCzk?: number | null;
  maxPricePerSqm?: number | null;
  preferredCity?: string | null;
  regions?: string[];
  strategies?: string[];
  goal?: string | null;
  targetGrossYieldPct?: number | null;
  riskTolerance?: string | null;
  /** Commute anchor — e.g. workplace coordinates from user input. */
  commuteTarget?: {
    latitude: number;
    longitude: number;
    maxMinutes?: number;
  } | null;
  /** Which dimension to emphasize (derived from goal/strategy if omitted). */
  primaryDimension?: LocationScoreDimension | null;
};

export type LocationMatchScore = {
  available: boolean;
  /** null when unavailable — not 0. */
  score: number | null;
  confidence: number;
  emphasizedDimension: LocationScoreDimension | null;
  reasons: LocationMatchReason[];
  profileComplete: boolean;
  dimensionScores: Pick<
    DimensionScoreResult,
    "dimension" | "score" | "confidence" | "availability"
  >[];
};
