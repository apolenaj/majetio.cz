export {
  LOCATION_INGESTION_METHODOLOGY_VERSION,
  type RawObservationRecord,
  type AggregatedMetricCandidate,
  type FallbackResolution,
  type LocationMarketSnapshotPayload,
  type DataSourceDefinition,
} from "@/domains/locations/ingestion/types";

export {
  LOCATION_DATA_SOURCE_REGISTRY,
  getDataSourceDefinition,
  sourceQualityFromReliability,
} from "@/domains/locations/ingestion/sources";

export { filterOutliersPreserveHighEnd } from "@/domains/locations/ingestion/outlier-filter";
export {
  deduplicateObservations,
  buildCanonicalKey,
  resolveSegmentKey,
} from "@/domains/locations/ingestion/dedupe";
export {
  detectMetricAnomalies,
  ANOMALY_RULES,
} from "@/domains/locations/ingestion/anomalies";
export { resolveFreshness } from "@/domains/locations/ingestion/freshness";
export {
  resolveFallbackLocation,
  FALLBACK_HIERARCHY,
} from "@/domains/locations/ingestion/fallback";
export {
  buildLocationQualityIssues,
  toLocationIssueWrites,
} from "@/domains/locations/ingestion/quality";
export { aggregateBucket, groupIntoBuckets } from "@/domains/locations/ingestion/aggregate";
export {
  runLocationIngestionPipeline,
  validateObservations,
  normalizeObservations,
} from "@/domains/locations/ingestion/pipeline";
export { buildLocationMarketSnapshot } from "@/domains/locations/ingestion/snapshot";
export {
  LocationIngestionService,
  createLocationIngestionService,
} from "@/domains/locations/ingestion/service";
