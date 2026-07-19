/**
 * Valuation engine — schema-aligned types (Prompt 10 Part 1).
 * No calculation logic here — storage contracts only.
 */

export const VALUATION_TYPES = [
  "AUTOMATED_ESTIMATE",
  "ANALYST_ADJUSTED",
  "PROFESSIONAL_REVIEW",
  "USER_SCENARIO",
] as const;

export type ValuationTypeId = (typeof VALUATION_TYPES)[number];

export const VALUATION_STATUSES = [
  "DRAFT",
  "CALCULATED",
  "APPROVED",
  "OUTDATED",
  "FAILED",
  "SUPERSEDED",
] as const;

export type ValuationStatusId = (typeof VALUATION_STATUSES)[number];

export const VALUATION_CONFIDENCE_LEVELS = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "UNKNOWN",
] as const;

export type ValuationConfidenceLevelId =
  (typeof VALUATION_CONFIDENCE_LEVELS)[number];

/**
 * Frozen inputs captured at calculation time.
 * Shape is intentionally open — engine versions may add keys; never mutate stored rows.
 */
export type ValuationInputSnapshot = {
  /** Model code / registry code at time of run */
  modelCode?: string;
  modelVersion?: string;
  propertySnapshot?: {
    propertyId: string;
    propertyType?: string | null;
    usableArea?: number | null;
    layout?: string | null;
    askingPrice?: number | null;
    condition?: string | null;
    city?: string | null;
    district?: string | null;
  };
  /** Opaque engine params (filters, weights refs) — no PII */
  params?: Record<string, unknown>;
  capturedAt?: string;
};

export type ValuationModelRegistrySeed = {
  code: string;
  displayName: string;
  algorithmVersion: string;
  supportedPropertyTypes: Array<
    "APARTMENT" | "HOUSE" | "LAND" | "COMMERCIAL" | "OTHER"
  >;
  description?: string;
};

/** First registered residential model — seed target for later parts. */
export const RESIDENTIAL_APARTMENT_V1: ValuationModelRegistrySeed = {
  code: "residential_apartment_v1",
  displayName: "Residential apartment automated estimate v1",
  algorithmVersion: "1.0.0",
  supportedPropertyTypes: ["APARTMENT"],
  description:
    "Baseline automated estimate for apartments. Algorithm body lands in Prompt 10 Part 2+.",
};
