/**
 * Valuation core + estimate pipeline (Prompt 10 Parts 2–3).
 * Selection → outliers → base → adjustments → range → confidence / edge cases.
 */

import { selectAndWeightComparables } from "./comparable-selection";
import { computeBaseValuation } from "./base-valuation";
import {
  applyAdjustments,
  computeFeatureAdjustments,
} from "./adjustments";
import { computeValuationRange } from "./range";
import {
  computeConfidence,
  MIN_COMPS_FOR_ESTIMATE,
} from "./confidence";
import { evaluateSubjectEdgeCases } from "./edge-cases";
import type {
  ComparableCandidate,
  ValuationCoreResult,
  ValuationEstimateResult,
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
export { computeValuationRange } from "./range";
export {
  computeConfidence,
  confidenceLevelFromScore,
  MIN_COMPS_FOR_ESTIMATE,
} from "./confidence";
export { evaluateSubjectEdgeCases } from "./edge-cases";
export {
  shouldRecalculateValuation,
  buildSubjectFingerprint,
  DEFAULT_VALUATION_MAX_AGE_DAYS,
} from "./staleness";
export type * from "./types";
export type { ValuationRangeResult } from "./range";
export type { ConfidenceResult, ConfidencePenalty } from "./confidence";
export type { EdgeCaseDecision } from "./edge-cases";
export type {
  CachedValuationRef,
  RecalculationContext,
  RecalculationDecision,
} from "./staleness";
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

/**
 * Full automated estimate with range + confidence + edge-case gating.
 * Never invents a number when data are insufficient or subject is atypical.
 */
export function runValuationEstimate(
  subject: ValuationSubject,
  candidates: ComparableCandidate[],
  options?: Parameters<typeof selectAndWeightComparables>[2] & {
    asOf?: Date;
  },
): ValuationEstimateResult {
  const asOf = options?.asOf ?? new Date();
  const edge = evaluateSubjectEdgeCases(subject);

  if (edge.blockAutomated) {
    const emptyCore = runValuationCore(subject, [], { ...options, asOf });
    const confidence = computeConfidence({
      includedComps: [],
      range: {
        lowerPricePerSqm: null,
        upperPricePerSqm: null,
        lowerBoundCzk: null,
        upperBoundCzk: null,
        relativeWidth: null,
        method: "insufficient_comps",
      },
      asOf,
      blocked: true,
    });
    return {
      ...emptyCore,
      adjustedValueCzk: null,
      base: {
        ...emptyCore.base,
        baseValueCzk: null,
        pricePerSqmWeightedMedian: null,
        pricePerSqmWeightedMean: null,
        method: "insufficient_comps",
      },
      status: "REQUIRES_INDIVIDUAL_APPRAISAL",
      lowerBoundCzk: null,
      upperBoundCzk: null,
      relativeRangeWidth: null,
      confidenceScore: 0,
      confidenceLevel: "INSUFFICIENT",
      confidenceExplanations: edge.reasons,
      statusReason: edge.reasons.join(" "),
    };
  }

  const core = runValuationCore(subject, candidates, { ...options, asOf });
  const included = core.comparables.filter((c) => c.included && c.weight > 0);

  const range = computeValuationRange({
    comps: core.comparables,
    subjectUsableArea: subject.usableArea,
    midValueCzk: core.adjustedValueCzk,
    adjustments: core.adjustments,
  });

  const confidence = computeConfidence({
    includedComps: included,
    range,
    asOf,
  });

  if (
    included.length < MIN_COMPS_FOR_ESTIMATE ||
    core.adjustedValueCzk == null ||
    confidence.level === "INSUFFICIENT"
  ) {
    const reason =
      confidence.explanations[0] ??
      `Nedostatek srovnatelných dat (minimum ${MIN_COMPS_FOR_ESTIMATE}).`;
    return {
      ...core,
      adjustedValueCzk: null,
      base: {
        ...core.base,
        baseValueCzk: null,
        method: "insufficient_comps",
      },
      status: "INSUFFICIENT_DATA",
      lowerBoundCzk: null,
      upperBoundCzk: null,
      relativeRangeWidth: null,
      confidenceScore: 0,
      confidenceLevel: "INSUFFICIENT",
      confidenceExplanations: confidence.explanations,
      statusReason: reason,
    };
  }

  // Ensure mid sits inside bounds when possible
  let lower = range.lowerBoundCzk;
  let upper = range.upperBoundCzk;
  const mid = core.adjustedValueCzk;
  if (lower != null && upper != null && mid != null) {
    if (lower > mid) lower = mid;
    if (upper < mid) upper = mid;
    if (lower === upper) {
      // Degenerate band — widen slightly from relative uncertainty floor
      const pad = Math.round(mid * 0.03);
      lower = mid - pad;
      upper = mid + pad;
    }
  }

  return {
    ...core,
    status: "CALCULATED",
    lowerBoundCzk: lower,
    upperBoundCzk: upper,
    relativeRangeWidth: range.relativeWidth,
    confidenceScore: confidence.score,
    confidenceLevel: confidence.level as ValuationEstimateResult["confidenceLevel"],
    confidenceExplanations: confidence.explanations,
    statusReason: null,
  };
}
