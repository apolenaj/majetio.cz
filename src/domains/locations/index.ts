export {
  LOCATION_TYPE_ORDER,
  LOCATION_TYPE_LABELS_CS,
  OPTIONAL_CZ_LEVELS,
  locationTypeRank,
  isFinerType,
  isCoarserOrEqual,
} from "@/domains/locations/types/hierarchy";

export {
  getLocationTypeRegistry,
  labelForLocationType,
  commonlyUsedLocationTypes,
  CZ_LOCATION_TYPE_REGISTRY,
  AE_LOCATION_TYPE_REGISTRY,
  type MarketLocationTypeRegistry,
  type LocationTypeRegistryEntry,
} from "@/domains/locations/market/location-type-registry";

export {
  buildLocationPath,
  assertValidParentChild,
  type LocationGraphNode,
} from "@/domains/locations/market/location-graph";

export {
  addressInputSchema,
  locationResolutionResultSchema,
  type AddressInput,
  type LocationResolutionResult,
} from "@/domains/locations/schemas/address-input";

export {
  GEOSPATIAL_BACKEND,
  isGeoJsonBoundary,
  pointInGeoJsonBoundary,
  haversineDistanceMeters,
  type GeoPoint,
  type GeoJsonBoundary,
} from "@/domains/locations/service/geospatial";

export {
  normalizeAddressInput,
  normalizeLocationName,
  inferMaxAssignableType,
} from "@/domains/locations/service/normalize";

export {
  LocationResolutionService,
  LOCATION_RESOLVER_VERSION,
  namesMatch,
} from "@/domains/locations/service/location-resolution-service";

export {
  createPrismaLocationRepository,
  type LocationRecord,
  type LocationRepository,
} from "@/domains/locations/service/location-repository";

export { assignPropertyLocation } from "@/domains/locations/service/property-location-assignment";

export {
  LOCATION_METRICS_METHODOLOGY_VERSION,
  LOCATION_METRIC_CATEGORIES,
  LOCATION_METRIC_REGISTRY,
  DEFAULT_METRIC_AGGREGATION_CONFIG,
  getMetricDefinition,
  encodeSegmentKey,
  decodeSegmentKey,
  resolveMetricConfidence,
  computeTrailingTrends,
  aggregateLiquidityMetrics,
  type LocationMetricKey,
  type LocationMetricDefinition,
  type LocationMetricSegment,
  type AggregatedMetricRecord,
  type MetricTrend,
  type TrailingTrendBundle,
} from "@/domains/locations/metrics";

export {
  LocationMetricAggregationService,
  createLocationMetricAggregationService,
} from "@/domains/locations/service/location-metric-aggregation-service";

export {
  loadLocationPageProfile,
  loadLocationComparison,
  listComparableLocationSlugs,
  segmentLabelFromKey,
} from "@/domains/locations/service/location-page-service";

export {
  LocationMetricService,
  createLocationMetricService,
  createPrismaLocationMetricRepository,
  type LocationMetricRepository,
} from "@/domains/locations/service/location-metric-service";

export {
  LocationScoreService,
  createLocationScoreService,
  buildLocationScoreInputFromProfile,
} from "@/domains/locations/service/location-score-service";

export {
  LOCATION_SCORE_METHODOLOGY_VERSION,
  computeLocationScore,
  computeLocationMatchScore,
  computeAllDimensionScores,
  buildAccessibilityProfile,
  type LocationScoreResult,
  type LocationMatchScore,
  type LocationScoreDimension,
  type AccessibilityProfile,
  type EnvironmentalProfile,
  type PoiRecord,
  type LocationMatchPreferences,
  SCORE_DISCLAIMERS,
} from "@/domains/locations/scoring";

export {
  resolveLocationIntelligenceForProperty,
  buildPropertySegmentBenchmark,
  buildValuationLocationContext,
  buildInvestmentLocationBenchmark,
  MARKET_OPPORTUNITY_REGISTRY,
  getMarketOpportunity,
  type PropertySegmentBenchmark,
  type ValuationLocationContext,
  type InvestmentLocationBenchmark,
} from "@/domains/locations/integration";

export {
  LOCATION_INGESTION_METHODOLOGY_VERSION,
  LOCATION_DATA_SOURCE_REGISTRY,
  runLocationIngestionPipeline,
  resolveFallbackLocation,
  createLocationIngestionService,
  LocationIngestionService,
  type RawObservationRecord,
  type AggregatedMetricCandidate,
  type FallbackResolution,
  type LocationMarketSnapshotPayload,
} from "@/domains/locations/ingestion";

export type {
  PublicLocationDto,
  PublicMetricPointDto,
  LocationMarketSummaryDto,
  LocationComparisonDto,
  InternalLocationMetricDto,
  LocationViewerScope,
} from "@/domains/locations/dto";

export {
  toPublicLocationDto,
  toPublicMetricPointDto,
  toInternalLocationMetricDto,
} from "@/domains/locations/service/dto-mappers";

export {
  LocationService,
  createLocationService,
  getPublicLocationBySlugCached,
} from "@/domains/locations/service/location-service";

export {
  LocationMarketService,
  createLocationMarketService,
} from "@/domains/locations/service/location-market-service";

export {
  LocationComparisonService,
  createLocationComparisonService,
} from "@/domains/locations/service/location-comparison-service";

export {
  LocationIntelligenceService,
  createLocationIntelligenceService,
  type PropertyLocationIntelligence,
} from "@/domains/locations/service/location-intelligence-service";

export {
  buildLocationCacheKey,
  buildMarketSummaryCacheKey,
  buildComparisonCacheKey,
  assertNotSharedPersonalizedCache,
  DEFAULT_PUBLIC_CACHE_TTL_MS,
} from "@/domains/locations/cache/location-cache";

export { buildLocationJobIdempotencyKey } from "@/domains/locations/jobs/idempotency";

export {
  runMetricAggregationJob,
  runDataRefreshJob,
  runAnomalyCheckJob,
  type LocationJobResult,
} from "@/domains/locations/jobs/cron-jobs";

export {
  emitLocationTelemetry,
  registerLocationTelemetrySink,
  type LocationTelemetryEvent,
} from "@/domains/locations/observability/telemetry";

export {
  locationHref,
  resolveLocationPathSegments,
  isLocationPageIndexable,
  buildLocationBreadcrumbs,
  listIndexableCanonicalPaths,
} from "@/domains/locations/seo/location-urls";

export { buildDynamicMarketSummary } from "@/domains/locations/seo/dynamic-summary";
export { buildLocationSeoJsonLd } from "@/domains/locations/seo/json-ld";

export {
  encodeGeohash,
  aggregateToGeohashGrid,
  buildDemoMapCells,
  MAP_CELL_MIN_SAMPLES,
  type MapLayerKind,
  type AggregatedMapCell,
} from "@/domains/locations/maps/geohash-grid";

export {
  listWatchedLocations,
  watchLocation,
  unwatchLocation,
  type WatchedLocationDto,
} from "@/domains/locations/watch/watched-location-service";
