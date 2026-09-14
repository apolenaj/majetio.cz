/**
 * Location Intelligence ingestion — shared types.
 */

import type {
  LocationDataSourceCategory,
  LocationMetricFreshness,
  LocationSourceQuality,
} from "@prisma/client";

export const LOCATION_INGESTION_METHODOLOGY_VERSION =
  "location-ingestion.v2026.07";

export type IngestionStage =
  | "fetch"
  | "validate"
  | "normalize"
  | "aggregate"
  | "quality_check"
  | "store"
  | "publish";

export type RawObservationRecord = {
  /** Stable identity within source (listing id, transaction id, …). */
  externalId: string;
  canonicalKey?: string;
  locationId: string;
  metricKey?: string;
  value: number;
  unit?: string;
  observedAt: string;
  propertyType?: string;
  layout?: string;
  condition?: string;
  isTransaction?: boolean;
  segmentKey?: string;
  meta?: Record<string, unknown>;
};

export type NormalizedObservation = RawObservationRecord & {
  canonicalKey: string;
  segmentKey: string;
  priceKind: "ASKING" | "TRANSACTION" | "NONE";
  valid: true;
};

export type AggregationInputBucket = {
  locationId: string;
  metricKey: string;
  segmentKey: string;
  priceKind: "ASKING" | "TRANSACTION" | "NONE";
  period: string;
  values: number[];
  sampleCanonicalKeys: string[];
};

export type AggregatedMetricCandidate = {
  locationId: string;
  metricKey: string;
  segmentKey: string;
  priceKind: "ASKING" | "TRANSACTION" | "NONE";
  period: string;
  /** Null when aggregation has no primary statistic — never coerce to 0. */
  value: number | null;
  meanValue: number | null;
  lowerQuartile: number | null;
  upperQuartile: number | null;
  sampleCount: number;
  outliersRemoved: number;
  highEndPreserved: number;
  methodologyVersion: string;
  confidence: number;
  sourceQuality: LocationSourceQuality;
  freshness: LocationMetricFreshness;
  reviewRequired: boolean;
  anomalyCodes: string[];
  fallbackFromLocationId: string | null;
  dataSourceId: string | null;
  display: boolean;
  suppressReason: string | null;
};

export type FallbackResolution = {
  resolvedLocationId: string;
  requestedLocationId: string;
  usedFallback: boolean;
  fallbackChain: string[];
  uiMessage: string | null;
};

export type LocationMarketSnapshotPayload = {
  locationId: string;
  period: string;
  segmentKey: string;
  selectedMetrics: Record<
    string,
    {
      value: number;
      sampleCount: number | null;
      confidence: number | null;
      sourceQuality: LocationSourceQuality;
      freshness: LocationMetricFreshness;
      reviewRequired: boolean;
      fallbackFromLocationId: string | null;
    }
  >;
  methodologyVersions: Record<string, string>;
  usedFallback: boolean;
  fallbackNotes: string | null;
  calculatedAt: Date;
};

export type DataSourceDefinition = {
  key: string;
  name: string;
  category: LocationDataSourceCategory;
  urlOrReference?: string;
  license?: string;
  updateFrequency: "REALTIME" | "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "AD_HOC";
  reliability: number;
  allowedUsage: {
    display: boolean;
    commercial: boolean;
    derivative: boolean;
  };
};

export type StageResult<T> = {
  ok: boolean;
  stage: IngestionStage;
  data: T;
  errors: string[];
  warnings: string[];
};
