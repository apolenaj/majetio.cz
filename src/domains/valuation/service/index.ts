/**
 * Valuation core pipeline (Prompt 10 Part 2).
 * Selection → outliers → base value → feature adjustments.
 * No confidence / range yet (Part 3).
 */

import { selectAndWeightComparables } from "./comparable-selection";
import { computeBaseValuation } from "./base-valuation";
import {
  applyAdjustments,
  computeFeatureAdjustments,
} from "./adjustments";
import type {
  ComparableCandidate,
  ValuationCoreResult,
  ValuationSubject,
} from "./types";
import { VALUATION_CORE_ENGINE_VERSION } from "./types";

export { selectAndWeightComparables } from "./comparable-selection";
export {
  computeBaseValuation,
  weightedMedian,
  weightedMean,
  resolvePricePerSqm,
  renormalizeWeights,
} from "./base-valuation";
export { detectOutliers, iqrBounds, meanStd } from "./outliers";
export { computeFeatureAdjustments, applyAdjustments } from "./adjustments";
export { resolveGeoTier, haversineMeters, geoTierWeight } from "./geo-hierarchy";
export { timeDecayWeight, daysBetween } from "./time-decay";
export {
  computeSimilarityScore,
  normalizeLayout,
  areaSimilarity,
  layoutSimilarity,
  conditionSimilarity,
} from "./similarity";
export type * from "./types";
export { VALUATION_CORE_ENGINE_VERSION } from "./types";

export function runValuationCore(
  subject: ValuationSubject,
  candidates: ComparableCandidate[],
  options?: Parameters<typeof selectAndWeightComparables>[2],
): ValuationCoreResult {
  const comparables = selectAndWeightComparables(subject, candidates, options);
  const base = computeBaseValuation(comparables, subject.usableArea);

  const includedCandidates = comparables
    .filter((c) => c.included)
    .map((c) => c.candidate);

  const adjustments =
    base.baseValueCzk != null
      ? computeFeatureAdjustments(
          subject,
          includedCandidates,
          base.baseValueCzk,
        )
      : [];

  const adjustedValueCzk =
    base.baseValueCzk != null
      ? applyAdjustments(base.baseValueCzk, adjustments)
      : null;

  return {
    subjectId: subject.id,
    comparables,
    base,
    adjustments,
    adjustedValueCzk,
    engineVersion: VALUATION_CORE_ENGINE_VERSION,
  };
}
