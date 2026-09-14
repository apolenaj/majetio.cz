/**
 * Location Intelligence DTOs — Public (safe aggregates) vs Internal (source detail).
 * Public DTOs MUST NOT expose raw provider payloads or precise private addresses.
 */

export type PublicLocationDto = {
  kind: "public";
  id: string;
  slug: string;
  name: string;
  publicLabel: string;
  type: string;
  hierarchyLabel: string | null;
  countryCode: string;
  /** Approximate centroid only — never exact private address. */
  centroid: { latitude: number; longitude: number } | null;
  /** Coarse precision for maps. */
  mapPrecision: "CITY" | "DISTRICT" | "APPROXIMATE" | "NONE";
};

export type PublicMetricPointDto = {
  metricKey: string;
  label: string;
  value: number;
  unit: string | null;
  period: string;
  sampleCount: number | null;
  confidence: number | null;
  freshness: "FRESH" | "STALE" | "UNKNOWN";
  priceKind: "ASKING" | "TRANSACTION" | "NONE";
  segmentKey: string;
  methodologyVersion: string;
  /** Present when metric inherited from coarser geography. */
  fallbackMessage: string | null;
};

export type LocationMarketSummaryDto = {
  kind: "public";
  location: PublicLocationDto;
  period: string;
  segmentKey: string;
  methodologyVersion: string;
  metrics: PublicMetricPointDto[];
  usedFallback: boolean;
  fallbackNotes: string | null;
  calculatedAt: string;
  /** Cache identity for this summary. */
  cacheKey: string;
};

export type LocationComparisonDto = {
  kind: "public";
  period: string;
  segmentKey: string;
  segmentLabel: string;
  methodologyHref: string;
  locations: PublicLocationDto[];
  rows: {
    metricKey: string;
    label: string;
    unit: string;
    values: (string | null)[];
  }[];
};

/**
 * Internal-only metric detail — never return from public routes.
 * May include source keys, raw sample diagnostics, review flags.
 */
export type InternalLocationMetricDto = {
  kind: "internal";
  id: string;
  locationId: string;
  metricKey: string;
  category: string;
  value: number;
  unit: string | null;
  period: string;
  source: string | null;
  sourceType: string;
  sourceQuality: string;
  dataSourceId: string | null;
  priceKind: string;
  segmentKey: string;
  segment: unknown;
  sampleCount: number | null;
  meanValue: number | null;
  lowerQuartile: number | null;
  upperQuartile: number | null;
  confidence: number | null;
  freshness: string;
  reviewRequired: boolean;
  fallbackFromLocationId: string | null;
  methodologyVersion: string;
  calculatedAt: string;
  validFrom: string;
  validTo: string | null;
  publishedAt: string | null;
  /** Internal diagnostics — never expose publicly. */
  diagnostics?: {
    outliersRemoved?: number;
    highEndPreserved?: number;
    anomalyCodes?: string[];
  };
};

export type LocationViewerScope = "public" | "internal" | "analyst";
