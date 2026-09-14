/**
 * Rate ingestion pipeline — types.
 */

import type {
  CanonicalMortgageOffer,
  ExternalMortgageOffer,
} from "../schemas";

export type IngestionStage =
  | "source"
  | "fetch"
  | "validate"
  | "normalize"
  | "deduplicate"
  | "compare"
  | "anomaly"
  | "store";

export type RateAnomalyCode =
  | "rate_jump"
  | "apr_below_interest"
  | "missing_fixation"
  | "missing_apr"
  | "invalid_ltv"
  | "auto_publish_blocked";

export type RateAnomaly = {
  code: RateAnomalyCode;
  severity: "warning" | "critical";
  message: string;
  offerKey: string;
};

export type NormalizedOfferDraft = CanonicalMortgageOffer & {
  dedupeKey: string;
  anomalies: RateAnomaly[];
};

export type CompareResult = {
  offerKey: string;
  previousInterestRateFrom: number | null;
  interestRateFrom: number;
  rateChanged: boolean;
  deltaPp: number | null;
};

export type IngestionPipelineResult = {
  runId: string;
  stages: IngestionStage[];
  fetchedAt: Date;
  sourceStatus: "ok" | "degraded" | "unavailable";
  normalized: NormalizedOfferDraft[];
  stored: CanonicalMortgageOffer[];
  historyRowsCreated: number;
  anomalies: RateAnomaly[];
  usedFallback: boolean;
};

export type ExistingStoredOffer = CanonicalMortgageOffer & {
  dedupeKey: string;
};

export type FetchResult = {
  offers: ExternalMortgageOffer[];
  fetchedAt: Date;
  sourceStatus: "ok" | "degraded" | "unavailable";
};
