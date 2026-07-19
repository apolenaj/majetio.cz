/**
 * Valuation engine math types (Prompt 10 Part 2).
 * Explainable inputs/outputs — no ML black box.
 */

export type GeoTier = "MICRO" | "NEIGHBOR" | "BROADER" | "OUT_OF_SCOPE";

export type ValuationSubject = {
  id: string;
  propertyType: string;
  usableArea: number | null;
  layout: string | null;
  condition: string | null;
  floor: number | null;
  floorsTotal?: number | null;
  hasBalcony?: boolean | null;
  hasElevator?: boolean | null;
  city: string | null;
  district: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type ComparableCandidate = {
  id: string;
  usableArea: number | null;
  layout: string | null;
  condition: string | null;
  floor: number | null;
  floorsTotal?: number | null;
  hasBalcony?: boolean | null;
  hasElevator?: boolean | null;
  city: string | null;
  district: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  /** Transaction or asking price in CZK. */
  priceCzk: number;
  /** If null, derived from priceCzk / usableArea when possible. */
  pricePerSqm: number | null;
  observedAt: string;
  isTransaction?: boolean;
};

export type ScoredComparable = {
  candidate: ComparableCandidate;
  pricePerSqm: number;
  geoTier: GeoTier;
  geoWeight: number;
  timeDecayWeight: number;
  similarityScore: number;
  /** Combined pre-normalization weight (geo × time × similarity). */
  rawWeight: number;
  /** Weight after outlier filtering + renormalization (0 if excluded). */
  weight: number;
  included: boolean;
  exclusionReason: string | null;
  distanceMeters: number | null;
};

export type FeatureAdjustment = {
  code: string;
  /** Relative factor, e.g. +0.02 = +2 %. */
  factor: number;
  /** Absolute CZK impact on base value (factor × base, rounded). */
  amountCzk: number;
  reason: string;
};

export type BaseValuationResult = {
  pricePerSqmWeightedMedian: number | null;
  pricePerSqmWeightedMean: number | null;
  /** Base value before feature adjustments (median ppsqm × subject area). */
  baseValueCzk: number | null;
  method: "weighted_median_ppsqm" | "insufficient_comps";
  includedCount: number;
  excludedCount: number;
};

export type ValuationCoreResult = {
  subjectId: string;
  comparables: ScoredComparable[];
  base: BaseValuationResult;
  adjustments: FeatureAdjustment[];
  /** baseValue × (1 + Σ factors), rounded. */
  adjustedValueCzk: number | null;
  engineVersion: string;
};

/** Outcome of automated estimate including Part 3 range + confidence. */
export type ValuationRunStatus =
  | "CALCULATED"
  | "INSUFFICIENT_DATA"
  | "REQUIRES_INDIVIDUAL_APPRAISAL";

export type ValuationEstimateResult = ValuationCoreResult & {
  status: ValuationRunStatus;
  lowerBoundCzk: number | null;
  upperBoundCzk: number | null;
  relativeRangeWidth: number | null;
  confidenceScore: number;
  confidenceLevel: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN" | "INSUFFICIENT";
  confidenceExplanations: string[];
  /** Human-readable block / insufficient message for UI. */
  statusReason: string | null;
};

export const VALUATION_CORE_ENGINE_VERSION =
  "residential_apartment_v1.core.0.2.0";
