/**
 * Robust outlier filtering that PRESERVES legitimate high-end segment.
 * Soft trim extremes without collapsing luxury into median mass.
 */

import { percentile } from "@/domains/locations/metrics/statistics";

export type OutlierFilterResult = {
  kept: number[];
  removed: number[];
  /** Values above soft upper fence but kept as high-end segment. */
  highEndPreserved: number[];
};

/**
 * Winsorized soft fence (IQR) with high-end preservation:
 * - Drop absurd lower outliers and extreme upper spikes beyond hard fence
 * - Keep values between soft and hard upper fence as highEndPreserved (still in sample)
 */
export function filterOutliersPreserveHighEnd(
  values: readonly number[],
  options?: {
    softIqrMultiplier?: number;
    hardIqrMultiplier?: number;
  },
): OutlierFilterResult {
  if (values.length < 5) {
    return { kept: [...values], removed: [], highEndPreserved: [] };
  }

  const softMult = options?.softIqrMultiplier ?? 1.5;
  const hardMult = options?.hardIqrMultiplier ?? 4;
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = percentile(sorted, 0.25);
  const q3 = percentile(sorted, 0.75);
  if (q1 == null || q3 == null) {
    return { kept: [...values], removed: [], highEndPreserved: [] };
  }

  const iqr = Math.max(1, q3 - q1);
  const softLow = q1 - softMult * iqr;
  const softHigh = q3 + softMult * iqr;
  const hardLow = q1 - hardMult * iqr;
  const hardHigh = q3 + hardMult * iqr;

  const kept: number[] = [];
  const removed: number[] = [];
  const highEndPreserved: number[] = [];

  for (const v of values) {
    if (v < hardLow || v > hardHigh) {
      removed.push(v);
      continue;
    }
    if (v > softHigh && v <= hardHigh) {
      highEndPreserved.push(v);
      kept.push(v);
      continue;
    }
    if (v < softLow && v >= hardLow) {
      // Soft lower outliers — remove (noise / data errors more often)
      removed.push(v);
      continue;
    }
    kept.push(v);
  }

  return { kept, removed, highEndPreserved };
}
