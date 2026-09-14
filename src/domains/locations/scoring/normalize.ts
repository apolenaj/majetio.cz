/**
 * Normalization helpers for dimension scoring.
 */

export function normalizeHigherIsBetter(
  value: number | null | undefined,
  good: number,
  poor: number,
): number | null {
  if (value == null || Number.isNaN(value)) return null;
  if (value >= good) return 100;
  if (value <= poor) return 10;
  return Math.round(10 + ((value - poor) / (good - poor)) * 90);
}

export function normalizeLowerIsBetter(
  value: number | null | undefined,
  good: number,
  poor: number,
): number | null {
  if (value == null || Number.isNaN(value)) return null;
  if (value <= good) return 100;
  if (value >= poor) return 10;
  return Math.round(10 + ((poor - value) / (poor - good)) * 90);
}

export function normalizePercentBand(
  value: number | null | undefined,
  target: number,
  tolerance: number,
): number | null {
  if (value == null || Number.isNaN(value)) return null;
  const diff = Math.abs(value - target);
  if (diff <= tolerance) return 100;
  if (diff >= tolerance * 3) return 20;
  return Math.round(100 - ((diff - tolerance) / (tolerance * 2)) * 80);
}

export function weightedAverage(
  parts: { value: number | null; weight: number; confidence: number }[],
): { score: number | null; confidence: number } {
  const available = parts.filter((p) => p.value != null && p.weight > 0);
  if (available.length === 0) return { score: null, confidence: 0 };

  const totalWeight = available.reduce((s, p) => s + p.weight, 0);
  const score =
    available.reduce((s, p) => s + p.value! * p.weight, 0) / totalWeight;
  const confidence =
    available.reduce((s, p) => s + p.confidence * p.weight, 0) / totalWeight;

  return { score: Math.round(score), confidence: Math.min(0.95, confidence) };
}

export function clampScore(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}
