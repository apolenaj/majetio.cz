export * from "@/domains/locations/scoring/amenities/types";
export {
  buildAccessibilityProfile,
  computeProximityMetrics,
  buildAccessibilitySubIndices,
  normalizeNearestDistanceScore,
} from "@/domains/locations/scoring/amenities/compute-proximity";
export {
  AMENITY_RELEVANCE_PROFILES,
  relevanceProfileForDimension,
  computeWeightedAccessibilityScore,
  categoryFromAccessibilityKey,
} from "@/domains/locations/scoring/amenities/relevance-profiles";

export * from "@/domains/locations/scoring/environment/types";
export {
  computeEnvironmentalImpacts,
  sumAdjustmentsForDimension,
} from "@/domains/locations/scoring/environment/compute-impacts";

export {
  LOCATION_SCORE_METHODOLOGY_VERSION,
  type LocationScoreDimension,
  type LocationScoreInput,
  type LocationScoreResult,
  type DimensionScoreResult,
  type LocationMatchPreferences,
  type LocationMatchScore,
  type LocationMatchReason,
} from "@/domains/locations/scoring/types";

export {
  PROHIBITED_SCORE_CATEGORIES,
  ProhibitedScoreInputError,
  assertAllowedScoreInput,
  SCORE_DISCLAIMERS,
} from "@/domains/locations/scoring/guardrails";

export { DIMENSION_REGISTRY, ALL_DIMENSIONS } from "@/domains/locations/scoring/dimension-registry";
export {
  computeDimensionScore,
  computeAllDimensionScores,
} from "@/domains/locations/scoring/compute-dimensions";
export {
  computeLocationScore,
  inferPrimaryDimension,
} from "@/domains/locations/scoring/compute-location-score";
export {
  computeLocationMatchScore,
  matchProfileToLocationPreferences,
  isLocationMatchProfileComplete,
} from "@/domains/locations/scoring/location-match-score";

export {
  normalizeHigherIsBetter,
  normalizeLowerIsBetter,
  weightedAverage,
} from "@/domains/locations/scoring/normalize";
