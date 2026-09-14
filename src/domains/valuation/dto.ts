/**
 * Valuation API DTOs (Prompt 10 Part 4).
 * Public = safe for property detail; Analyst = staff/analyst internals.
 */

import type { GeoTier, ValuationRunStatus } from "./service/types";
import type { ValuationInputSnapshot } from "./types";

export type PublicConfidenceLevel =
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | "INSUFFICIENT"
  | "UNKNOWN";

/** Public-facing adjustment line (no internal weight math beyond factor). */
export type PublicValuationAdjustmentDto = {
  code: string;
  /** Short Czech label, e.g. "Výtah: zvyšuje". */
  label: string;
  direction: "up" | "down" | "neutral";
  factor: number;
  amountCzk: number;
  reason: string;
};

/**
 * Comparable shown on public detail.
 * When `anonymized`, address/exact listing identity is stripped (licence).
 */
export type PublicComparableDto = {
  /** Opaque display id (never a secret internal key when anonymized). */
  id: string;
  label: string;
  anonymized: boolean;
  layout: string | null;
  usableArea: number | null;
  /** Asking/transaction price; may be rounded when anonymized. */
  priceCzk: number | null;
  pricePerSqm: number | null;
  city: string | null;
  district: string | null;
  /** 0–100 similarity for UI. */
  similarityPct: number;
  /** ISO date or YYYY-MM when anonymized. */
  observedAt: string | null;
};

export type PublicValuationDto = {
  kind: "public";
  status: ValuationRunStatus;
  statusReason: string | null;
  estimateMidCzk: number | null;
  lowerBoundCzk: number | null;
  upperBoundCzk: number | null;
  confidenceLevel: PublicConfidenceLevel;
  /** Public explanations only — never internal penalty codes. */
  confidenceExplanations: string[];
  askingPriceCzk: number | null;
  /** (asking − mid) / mid × 100; null when either missing. */
  askingVsMidPct: number | null;
  askingVsMidCzk: number | null;
  adjustments: PublicValuationAdjustmentDto[];
  /** 3–10 most relevant included comps (anonymized when required). */
  comparables: PublicComparableDto[];
  engineVersion: string;
  isDemo: boolean;
  calculatedAt: string;
  disclaimer: string;
  /** Location market context — supplementary to comparables, not a replacement. */
  locationMarketContext?: {
    medianAskingPriceSqm: number | null;
    medianTransactionPriceSqm: number | null;
    priceTrendYoYPct: number | null;
    segmentLabel: string;
    period: string;
    methodologyHref: string;
    disclaimer: string;
  } | null;
};

export type AnalystComparableDto = PublicComparableDto & {
  internalId: string;
  weight: number;
  rawWeight: number;
  geoTier: GeoTier;
  geoWeight: number;
  timeDecayWeight: number;
  similarityScore: number;
  included: boolean;
  exclusionReason: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceMeters: number | null;
  isTransaction: boolean;
};

export type AnalystValuationDto = Omit<PublicValuationDto, "kind"> & {
  kind: "analyst";
  confidenceScore: number;
  baseValueCzk: number | null;
  pricePerSqmWeightedMedian: number | null;
  relativeRangeWidth: number | null;
  inputSnapshot: ValuationInputSnapshot;
  /** Full scored set including excluded + weights. */
  analystComparables: AnalystComparableDto[];
  modelCode: string;
};

export type ValuationDto = PublicValuationDto | AnalystValuationDto;

export const VALUATION_LEGAL_DISCLAIMER =
  "Odhad Majetio je orientační a slouží jako podklad pro další rozhodování. Nejde o znalecký posudek ani závaznou nabídku. Skutečná tržní cena závisí na stavu nemovitosti, právní kontrole a aktuálních podmínkách trhu.";
