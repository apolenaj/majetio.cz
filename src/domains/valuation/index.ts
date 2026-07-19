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
} from "./service/types";
export { VALUATION_CORE_ENGINE_VERSION } from "./service/types";

export {
  selectAndWeightComparables,
  runValuationCore,
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
