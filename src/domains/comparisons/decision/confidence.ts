/**
 * Confidence helpers — never inflate missing data into high confidence.
 */

import type { ConfidenceLevel } from "./types";

export function confidenceFromScore(
  score: number | null | undefined,
): ConfidenceLevel {
  if (score == null || !Number.isFinite(score)) return "unknown";
  if (score >= 75) return "high";
  if (score >= 45) return "medium";
  if (score >= 0) return "low";
  return "unknown";
}

export function confidenceFromRatio(
  ratio: number | null | undefined,
): ConfidenceLevel {
  if (ratio == null || !Number.isFinite(ratio)) return "unknown";
  if (ratio >= 0.75) return "high";
  if (ratio >= 0.45) return "medium";
  if (ratio >= 0) return "low";
  return "unknown";
}

export function minConfidence(
  ...levels: ConfidenceLevel[]
): ConfidenceLevel {
  const rank: Record<ConfidenceLevel, number> = {
    unknown: 0,
    low: 1,
    medium: 2,
    high: 3,
  };
  let worst: ConfidenceLevel = "high";
  for (const l of levels) {
    if (rank[l] < rank[worst]) worst = l;
  }
  return levels.length === 0 ? "unknown" : worst;
}
