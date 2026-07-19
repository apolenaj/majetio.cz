/**
 * Statistical value range from comparable dispersion (Prompt 10 Part 3).
 * Wider band ⇒ lower certainty — never invent a fake tight range.
 */

import type { FeatureAdjustment, ScoredComparable } from "./types";

export type ValuationRangeResult = {
  /** Kč/m² lower quantile (among included comps). */
  lowerPricePerSqm: number | null;
  /** Kč/m² upper quantile. */
  upperPricePerSqm: number | null;
  lowerBoundCzk: number | null;
  upperBoundCzk: number | null;
  /** (upper-lower)/mid — relative width; null if unavailable. */
  relativeWidth: number | null;
  method: "weighted_quantile_ppsqm" | "insufficient_comps";
};

function weightedQuantile(
  points: Array<{ value: number; weight: number }>,
  q: number,
): number | null {
  const clean = points.filter(
    (p) => Number.isFinite(p.value) && Number.isFinite(p.weight) && p.weight > 0,
  );
  if (clean.length === 0) return null;
  const sorted = [...clean].sort((a, b) => a.value - b.value);
  const total = sorted.reduce((s, p) => s + p.weight, 0);
  if (total <= 0) return null;
  const target = Math.min(1, Math.max(0, q)) * total;
  let acc = 0;
  for (const p of sorted) {
    acc += p.weight;
    if (acc >= target) return p.value;
  }
  return sorted[sorted.length - 1]!.value;
}

function adjustmentMultiplier(adjustments: FeatureAdjustment[]): number {
  return 1 + adjustments.reduce((s, a) => s + a.factor, 0);
}

/**
 * Bounds from weighted p20 / p80 of included Kč/m² × subject area × adjustment multiplier.
 * Mid estimate should already be adjusted separately; bounds track dispersion.
 */
export function computeValuationRange(input: {
  comps: ScoredComparable[];
  subjectUsableArea: number | null;
  /** Mid point used for relative width (adjusted or base). */
  midValueCzk: number | null;
  adjustments: FeatureAdjustment[];
  lowerQuantile?: number;
  upperQuantile?: number;
}): ValuationRangeResult {
  const included = input.comps.filter((c) => c.included && c.weight > 0);
  if (
    included.length < 2 ||
    input.subjectUsableArea == null ||
    input.subjectUsableArea <= 0
  ) {
    return {
      lowerPricePerSqm: null,
      upperPricePerSqm: null,
      lowerBoundCzk: null,
      upperBoundCzk: null,
      relativeWidth: null,
      method: "insufficient_comps",
    };
  }

  const points = included.map((c) => ({
    value: c.pricePerSqm,
    weight: c.weight,
  }));
  const loQ = input.lowerQuantile ?? 0.2;
  const hiQ = input.upperQuantile ?? 0.8;
  const lowerPps = weightedQuantile(points, loQ);
  const upperPps = weightedQuantile(points, hiQ);
  if (lowerPps == null || upperPps == null) {
    return {
      lowerPricePerSqm: null,
      upperPricePerSqm: null,
      lowerBoundCzk: null,
      upperBoundCzk: null,
      relativeWidth: null,
      method: "insufficient_comps",
    };
  }

  const lo = Math.min(lowerPps, upperPps);
  const hi = Math.max(lowerPps, upperPps);
  const mult = adjustmentMultiplier(input.adjustments);
  const lowerBoundCzk = Math.round(lo * input.subjectUsableArea * mult);
  const upperBoundCzk = Math.round(hi * input.subjectUsableArea * mult);

  let relativeWidth: number | null = null;
  if (input.midValueCzk != null && input.midValueCzk > 0) {
    relativeWidth =
      Math.round(
        ((upperBoundCzk - lowerBoundCzk) / input.midValueCzk) * 1000,
      ) / 1000;
  }

  return {
    lowerPricePerSqm: Math.round(lo),
    upperPricePerSqm: Math.round(hi),
    lowerBoundCzk,
    upperBoundCzk,
    relativeWidth,
    method: "weighted_quantile_ppsqm",
  };
}
