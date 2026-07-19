/**
 * Base valuation from weighted comps (Prompt 10 Part 2).
 * Uses weighted median of Kč/m² (robust) + weighted mean for transparency.
 */

import type { BaseValuationResult, ScoredComparable } from "./types";

export function resolvePricePerSqm(
  priceCzk: number,
  usableArea: number | null,
  explicit: number | null,
): number | null {
  if (explicit != null && Number.isFinite(explicit) && explicit > 0) {
    return explicit;
  }
  if (
    usableArea != null &&
    usableArea > 0 &&
    Number.isFinite(priceCzk) &&
    priceCzk > 0
  ) {
    return priceCzk / usableArea;
  }
  return null;
}

/** Weighted median of values with positive weights. */
export function weightedMedian(
  points: Array<{ value: number; weight: number }>,
): number | null {
  const clean = points.filter(
    (p) => Number.isFinite(p.value) && Number.isFinite(p.weight) && p.weight > 0,
  );
  if (clean.length === 0) return null;
  const sorted = [...clean].sort((a, b) => a.value - b.value);
  const total = sorted.reduce((s, p) => s + p.weight, 0);
  if (total <= 0) return null;
  let acc = 0;
  for (const p of sorted) {
    acc += p.weight;
    if (acc >= total / 2) return p.value;
  }
  return sorted[sorted.length - 1]!.value;
}

export function weightedMean(
  points: Array<{ value: number; weight: number }>,
): number | null {
  const clean = points.filter(
    (p) => Number.isFinite(p.value) && Number.isFinite(p.weight) && p.weight > 0,
  );
  if (clean.length === 0) return null;
  const tw = clean.reduce((s, p) => s + p.weight, 0);
  if (tw <= 0) return null;
  return clean.reduce((s, p) => s + p.value * p.weight, 0) / tw;
}

export function renormalizeWeights(
  comps: ScoredComparable[],
): ScoredComparable[] {
  const included = comps.filter((c) => c.included && c.rawWeight > 0);
  const sum = included.reduce((s, c) => s + c.rawWeight, 0);
  return comps.map((c) => {
    if (!c.included || sum <= 0 || c.rawWeight <= 0) {
      return { ...c, weight: 0 };
    }
    return { ...c, weight: c.rawWeight / sum };
  });
}

/**
 * Base value = weighted median Kč/m² × subject usable area.
 */
export function computeBaseValuation(
  comps: ScoredComparable[],
  subjectUsableArea: number | null,
): BaseValuationResult {
  const included = comps.filter((c) => c.included && c.weight > 0);
  const excludedCount = comps.length - included.length;

  if (included.length === 0) {
    return {
      pricePerSqmWeightedMedian: null,
      pricePerSqmWeightedMean: null,
      baseValueCzk: null,
      method: "insufficient_comps",
      includedCount: 0,
      excludedCount,
    };
  }

  const points = included.map((c) => ({
    value: c.pricePerSqm,
    weight: c.weight,
  }));
  const median = weightedMedian(points);
  const mean = weightedMean(points);

  let baseValueCzk: number | null = null;
  if (
    median != null &&
    subjectUsableArea != null &&
    subjectUsableArea > 0
  ) {
    baseValueCzk = Math.round(median * subjectUsableArea);
  }

  return {
    pricePerSqmWeightedMedian:
      median != null ? Math.round(median) : null,
    pricePerSqmWeightedMean: mean != null ? Math.round(mean) : null,
    baseValueCzk,
    method: "weighted_median_ppsqm",
    includedCount: included.length,
    excludedCount,
  };
}
