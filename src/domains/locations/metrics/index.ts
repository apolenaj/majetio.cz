export {
  LOCATION_METRICS_METHODOLOGY_VERSION,
  LOCATION_METRIC_CATEGORIES,
  LOCATION_METRIC_REGISTRY,
  DEFAULT_METRIC_AGGREGATION_CONFIG,
  getMetricDefinition,
  type LocationMetricDefinition,
  type LocationMetricKey,
  type MetricAggregationConfig,
  type MetricStatistic,
} from "@/domains/locations/metrics/registry";

export {
  SEGMENT_ALL_KEY,
  encodeSegmentKey,
  decodeSegmentKey,
  normalizeLayout,
  inferMarketAge,
  type LocationMetricSegment,
  type MarketAgeSegment,
} from "@/domains/locations/metrics/segment";

export {
  median,
  mean,
  quartiles,
  percentile,
  trimmedValues,
  aggregateNumeric,
} from "@/domains/locations/metrics/statistics";

export {
  resolveMetricConfidence,
  type MetricDisplayDecision,
} from "@/domains/locations/metrics/confidence";

export {
  computePeriodTrend,
  computeTrailingTrends,
  type MetricTimePoint,
  type MetricTrend,
  type TrailingTrendBundle,
  type TrendDirection,
} from "@/domains/locations/metrics/trends";

export {
  aggregateLiquidityMetrics,
  computeRentListingsTurnover,
  type ListingObservation,
  type LiquidityAggregate,
} from "@/domains/locations/metrics/liquidity";

export type {
  RawPriceObservation,
  RawRentObservation,
  MetricAggregationContext,
  AggregatedMetricRecord,
  MetricHistoryPoint,
  SegmentBucket,
} from "@/domains/locations/metrics/types";
