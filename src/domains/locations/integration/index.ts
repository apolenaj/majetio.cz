export type {
  PropertySegmentBenchmark,
  ValuationLocationContext,
  InvestmentLocationBenchmark,
  MarketFilterCoverage,
  SearchMarketFilterState,
  MarketOpportunityDefinition,
  MarketAlertEventType,
  MarketAlertEventPayload,
  MarketAlertSubscription,
} from "@/domains/locations/integration/types";

export {
  buildPropertySegmentBenchmark,
  formatBenchmarkHeadline,
  resolvePropertySegmentKey,
} from "@/domains/locations/integration/property-segment-benchmark";

export { buildValuationLocationContext } from "@/domains/locations/integration/valuation-context";
export { buildInvestmentLocationBenchmark } from "@/domains/locations/integration/investment-benchmark";

export {
  CENOVA_HLADINA_OPTIONS,
  VYNOS_BENCHMARK_OPTIONS,
  CENOVY_TREND_OPTIONS,
  assessMarketFilterCoverage,
  applyMarketFilters,
  parseMarketFilterParams,
  serializeMarketFilters,
} from "@/domains/locations/integration/search-market-filters";

export {
  MARKET_OPPORTUNITY_REGISTRY,
  getMarketOpportunity,
  validateOpportunitySlug,
  FORBIDDEN_OPPORTUNITY_PATTERNS,
} from "@/domains/locations/integration/market-opportunities/registry";

export {
  MARKET_ALERT_EVENT_LABELS,
  buildPriceTrendChangedEvent,
  buildSupplySpikeEvent,
  createInMemoryMarketAlertPublisher,
  dispatchToWebhook,
  matchesSubscription,
  type MarketAlertPublisher,
} from "@/domains/locations/integration/market-alerts/events";

export { resolveLocationIntelligenceForProperty } from "@/domains/locations/integration/location-integration-service";

export {
  MIN_PERCENTILE_SAMPLE,
  estimatePercentileFromQuartiles,
  resolveMarketPercentile,
  isDistributionStatisticallyValid,
} from "@/domains/locations/integration/market-percentiles";

export { buildMarketOpportunityInsight } from "@/domains/locations/integration/market-opportunity-insight";

export {
  buildLocationRiskFacts,
  locationFactsForRiskEngine,
  LOCATION_RISK_FACT_CODES,
} from "@/domains/locations/integration/location-risk-facts";

export { buildLocationMarketContextBlock } from "@/domains/locations/integration/market-context";
export { buildStrRegulatoryContext } from "@/domains/locations/integration/str-regulatory-context";
