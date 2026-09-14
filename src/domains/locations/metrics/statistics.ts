export function median(sorted: readonly number[]): number | null {
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  }
  return sorted[mid]!;
}

export function mean(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function quartiles(sorted: readonly number[]): {
  q1: number | null;
  q3: number | null;
} {
  if (sorted.length < 4) return { q1: null, q3: null };
  const q1Idx = Math.floor(sorted.length * 0.25);
  const q3Idx = Math.floor(sorted.length * 0.75);
  return { q1: sorted[q1Idx] ?? null, q3: sorted[q3Idx] ?? null };
}

export function percentile(sorted: readonly number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.floor(p * (sorted.length - 1))),
  );
  return sorted[idx] ?? null;
}

export function trimmedValues(
  values: readonly number[],
  lowerPct: number,
  upperPct: number,
): number[] {
  if (values.length < 5) return [...values];
  const sorted = [...values].sort((a, b) => a - b);
  const lo = percentile(sorted, lowerPct);
  const hi = percentile(sorted, upperPct);
  if (lo == null || hi == null) return [...values];
  return sorted.filter((v) => v >= lo && v <= hi);
}

export function aggregateNumeric(values: readonly number[]): {
  median: number | null;
  mean: number | null;
  lowerQuartile: number | null;
  upperQuartile: number | null;
  sampleCount: number;
} {
  if (values.length === 0) {
    return {
      median: null,
      mean: null,
      lowerQuartile: null,
      upperQuartile: null,
      sampleCount: 0,
    };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const { q1, q3 } = quartiles(sorted);
  return {
    median: median(sorted),
    mean: mean(sorted),
    lowerQuartile: q1,
    upperQuartile: q3,
    sampleCount: sorted.length,
  };
}
