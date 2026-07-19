export type {
  ValuationTypeId,
  ValuationStatusId,
  ValuationConfidenceLevelId,
  ValuationInputSnapshot,
  ValuationModelRegistrySeed,
} from "./types";
export {
  VALUATION_TYPES,
  VALUATION_STATUSES,
  VALUATION_CONFIDENCE_LEVELS,
  RESIDENTIAL_APARTMENT_V1,
} from "./types";

export type {
  GeoTier,
  ValuationSubject,
  ComparableCandidate,
  ScoredComparable,
  FeatureAdjustment,
  BaseValuationResult,
  ValuationCoreResult,
  ValuationEstimateResult,
  ValuationRunStatus,
} from "./service/types";
export { VALUATION_CORE_ENGINE_VERSION } from "./service/types";

export {
  selectAndWeightComparables,
  runValuationCore,
  runValuationEstimate,
  computeValuationRange,
  computeConfidence,
  confidenceLevelFromScore,
  MIN_COMPS_FOR_ESTIMATE,
  evaluateSubjectEdgeCases,
  shouldRecalculateValuation,
  buildSubjectFingerprint,
  DEFAULT_VALUATION_MAX_AGE_DAYS,
} from "./service";
export { resolveGeoTier, haversineMeters, geoTierWeight } from "./service/geo-hierarchy";
export { timeDecayWeight, daysBetween } from "./service/time-decay";
export {
  computeSimilarityScore,
  normalizeLayout,
  areaSimilarity,
  layoutSimilarity,
  conditionSimilarity,
} from "./service/similarity";
export { detectOutliers, iqrBounds, meanStd } from "./service/outliers";
export {
  computeBaseValuation,
  weightedMedian,
  weightedMean,
  resolvePricePerSqm,
  renormalizeWeights,
} from "./service/base-valuation";
export {
  computeFeatureAdjustments,
  applyAdjustments,
} from "./service/adjustments";

export type {
  PublicConfidenceLevel,
  PublicValuationAdjustmentDto,
  PublicComparableDto,
  PublicValuationDto,
  AnalystComparableDto,
  AnalystValuationDto,
  ValuationDto,
} from "./dto";
export { VALUATION_LEGAL_DISCLAIMER } from "./dto";
export {
  createValuationService,
  valuationService,
  toValuationSubject,
  adjustmentPublicLabel,
  type ValuationViewer,
  type ValuationServiceDeps,
} from "./service/valuation-service";
export {
  buildAnalystOverrideAudit,
  createAnalystOverrideAuditLog,
  type AnalystOverrideInput,
  type AnalystOverrideAuditRecord,
} from "./service/analyst-override";
