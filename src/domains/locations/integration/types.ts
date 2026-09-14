/**
 * Location Intelligence integration types — cross-engine contracts.
 */

export type PropertySegmentBenchmark = {
  available: boolean;
  propertyPricePerSqm: number | null;
  localMedianPricePerSqm: number | null;
  /** Percentage difference vs local median; null when either side missing. */
  diffPct: number | null;
  diffAbsCzkPerSqm: number | null;
  segmentKey: string;
  segmentLabel: string;
  priceKind: "ASKING" | "TRANSACTION";
  period: string;
  sampleCount: number | null;
  confidence: number | null;
  methodologyVersion: string;
  methodologyHref: string;
  source: string;
  locationSlug: string | null;
  locationLabel: string;
  rentBenchmarkPerSqm: number | null;
  priceTrendYoYPct: number | null;
  suppressReason: string | null;
  /**
   * Purchase price percentile vs local segment (0–100).
   * Null when sample size is not statistically valid — UI must hide.
   */
  purchasePricePercentile: number | null;
  /** Rent percentile vs local segment; null when invalid / no property rent. */
  rentPercentile: number | null;
  percentilesStatisticallyValid: boolean;
};

export type ValuationLocationContext = {
  /** Context only — does NOT replace comparables. */
  role: "market_context";
  medianAskingPriceSqm: number | null;
  medianTransactionPriceSqm: number | null;
  priceTrendYoYPct: number | null;
  segmentKey: string;
  segmentLabel: string;
  period: string;
  sampleCount: number | null;
  confidence: number | null;
  methodologyHref: string;
  disclaimer: string;
};

export type InvestmentLocationBenchmark = {
  /** Suggestions only — never overwrite user inputs automatically. */
  role: "benchmark_suggestion";
  suggestedMonthlyRentCzk: number | null;
  locationMedianRentPerSqm: number | null;
  locationGrossYieldPct: number | null;
  suggestedVacancyRatePp: number | null;
  period: string;
  sampleCount: number | null;
  confidence: number | null;
  methodologyHref: string;
  source: string;
  disclaimer: string;
};

export type MarketFilterCoverage = {
  priceBand: boolean;
  yieldBenchmark: boolean;
  priceTrend: boolean;
  reason?: string;
};

export type SearchMarketFilterState = {
  /** pod-trhem | v-trhu | nad-trhem */
  cenovaHladina?: string;
  /** nad-benchmarkem | pod-benchmarkem */
  vynosVsBenchmark?: string;
  /** rostouci | klesajici | stabilni */
  cenovyTrend?: string;
};

export type MarketOpportunityDefinition = {
  slug: string;
  title: string;
  goal: string;
  metricKey: string;
  segmentKey: string;
  sortDirection: "asc" | "desc";
  minSampleCount: number;
  minLocations: number;
  methodologySlug: string;
  methodologySummary: string;
  periodLabel: string;
  /** Explicit target audience — no clickbait "best locations". */
  audience: string;
  forbidden: boolean;
};

export type MarketAlertEventType =
  | "location.price_trend.changed"
  | "location.supply.spike"
  | "location.yield.threshold.crossed"
  | "location.dom.threshold.crossed";

export type MarketAlertEventPayload = {
  eventId: string;
  type: MarketAlertEventType;
  occurredAt: string;
  locationId: string;
  locationSlug: string;
  metricKey: string;
  segmentKey: string;
  previousValue: number | null;
  currentValue: number | null;
  changePct: number | null;
  period: string;
  sampleCount: number | null;
  confidence: number | null;
  methodologyVersion: string;
  source: string;
};

export type MarketAlertSubscription = {
  id: string;
  userId: string;
  eventTypes: MarketAlertEventType[];
  locationIds?: string[];
  segmentKey?: string;
  webhookUrl?: string | null;
  active: boolean;
};
