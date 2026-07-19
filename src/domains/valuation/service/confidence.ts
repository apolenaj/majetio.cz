/**
 * Explainable confidence scoring (Prompt 10 Part 3).
 * Penalties for sparse / stale / dispersed comps — UI-ready Czech reasons.
 */

import type { GeoTier, ScoredComparable } from "./types";
import type { ValuationConfidenceLevelId } from "../types";
import type { ValuationRangeResult } from "./range";
import { daysBetween } from "./time-decay";

export type ConfidencePenalty = {
  code: string;
  /** Points deducted from 100. */
  points: number;
  reason: string;
};

export type ConfidenceResult = {
  /** 0–100 after penalties (0 when insufficient). */
  score: number;
  level: ValuationConfidenceLevelId | "INSUFFICIENT";
  penalties: ConfidencePenalty[];
  /** Short bullets for UI. */
  explanations: string[];
};

const MIN_COMPS_FOR_ESTIMATE = 3;

export function confidenceLevelFromScore(
  score: number,
  insufficient: boolean,
): ConfidenceResult["level"] {
  if (insufficient || score <= 0) return "INSUFFICIENT";
  if (score >= 75) return "HIGH";
  if (score >= 50) return "MEDIUM";
  if (score >= 25) return "LOW";
  return "INSUFFICIENT";
}

function meanAgeDays(
  comps: ScoredComparable[],
  asOf: Date,
): number | null {
  const ages = comps
    .map((c) => daysBetween(c.candidate.observedAt, asOf))
    .filter((d): d is number => d != null);
  if (ages.length === 0) return null;
  return ages.reduce((s, n) => s + n, 0) / ages.length;
}

function shareTier(
  comps: ScoredComparable[],
): Record<GeoTier, number> {
  const counts: Record<GeoTier, number> = {
    MICRO: 0,
    NEIGHBOR: 0,
    BROADER: 0,
    OUT_OF_SCOPE: 0,
  };
  for (const c of comps) counts[c.geoTier] += 1;
  const n = comps.length || 1;
  return {
    MICRO: counts.MICRO / n,
    NEIGHBOR: counts.NEIGHBOR / n,
    BROADER: counts.BROADER / n,
    OUT_OF_SCOPE: counts.OUT_OF_SCOPE / n,
  };
}

function coefficientOfVariation(comps: ScoredComparable[]): number | null {
  const values = comps.map((c) => c.pricePerSqm).filter((n) => Number.isFinite(n));
  if (values.length < 2) return null;
  const mean = values.reduce((s, n) => s + n, 0) / values.length;
  if (mean <= 0) return null;
  const variance =
    values.reduce((s, n) => s + (n - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance) / mean;
}

/**
 * Start at 100, apply explainable penalties. Never invent high confidence.
 */
export function computeConfidence(input: {
  includedComps: ScoredComparable[];
  range: ValuationRangeResult;
  asOf?: Date;
  blocked?: boolean;
}): ConfidenceResult {
  if (input.blocked) {
    return {
      score: 0,
      level: "INSUFFICIENT",
      penalties: [
        {
          code: "blocked",
          points: 100,
          reason: "Automatický odhad je zablokovaný — vyžaduje individuální ocenění.",
        },
      ],
      explanations: [
        "Automatický odhad není k dispozici pro tuto nemovitost.",
      ],
    };
  }

  const comps = input.includedComps;
  const penalties: ConfidencePenalty[] = [];
  const asOf = input.asOf ?? new Date();

  if (comps.length < MIN_COMPS_FOR_ESTIMATE) {
    const reason =
      comps.length === 0
        ? "Žádné srovnatelné nabídky po filtrech — odhad nelze spočítat."
        : `Méně než ${MIN_COMPS_FOR_ESTIMATE} srovnatelné nabídky (máme ${comps.length}) — data nestačí pro spolehlivý odhad.`;
    return {
      score: 0,
      level: "INSUFFICIENT",
      penalties: [{ code: "too_few_comps", points: 100, reason }],
      explanations: [reason],
    };
  }

  let score = 100;

  if (comps.length < 5) {
    const points = 15;
    score -= points;
    penalties.push({
      code: "sparse_comps",
      points,
      reason: `Jen ${comps.length} srovnatelných nabídek (doporučeno 5+) — nižší jistota.`,
    });
  }

  const age = meanAgeDays(comps, asOf);
  if (age != null && age > 270) {
    const points = 20;
    score -= points;
    penalties.push({
      code: "stale_comps",
      points,
      reason: `Srovnatelná data jsou stará (průměr ~${Math.round(age)} dní) — trh se mohl posunout.`,
    });
  } else if (age != null && age > 150) {
    const points = 10;
    score -= points;
    penalties.push({
      code: "aging_comps",
      points,
      reason: `Část comparables je starší (~${Math.round(age)} dní v průměru).`,
    });
  }

  const cv = coefficientOfVariation(comps);
  if (cv != null && cv > 0.35) {
    const points = 25;
    score -= points;
    penalties.push({
      code: "high_dispersion",
      points,
      reason: `Vysoká rozptýlenost cen za m² (CV=${(cv * 100).toFixed(0)} %) — širší pásmo, nižší jistota.`,
    });
  } else if (cv != null && cv > 0.22) {
    const points = 12;
    score -= points;
    penalties.push({
      code: "moderate_dispersion",
      points,
      reason: `Střední rozptýlenost cen za m² (CV=${(cv * 100).toFixed(0)} %).`,
    });
  }

  if (
    input.range.relativeWidth != null &&
    input.range.relativeWidth > 0.35
  ) {
    const points = 15;
    score -= points;
    penalties.push({
      code: "wide_range",
      points,
      reason: `Široké pásmo odhadu (±${Math.round((input.range.relativeWidth / 2) * 100)} % okolo středu) — nižší jistota.`,
    });
  }

  const tiers = shareTier(comps);
  if (tiers.MICRO < 0.25 && tiers.BROADER >= 0.5) {
    const points = 18;
    score -= points;
    penalties.push({
      code: "weak_local_comps",
      points,
      reason:
        "Málo comparables z mikroregionu — většina z širší oblasti snižuje spolehlivost.",
    });
  }

  const lowSim = comps.filter((c) => c.similarityScore < 0.45).length;
  if (lowSim >= Math.ceil(comps.length / 2)) {
    const points = 12;
    score -= points;
    penalties.push({
      code: "low_similarity",
      points,
      reason:
        "Více než polovina comparables má nízkou podobnost (plocha/dispozice/stav).",
    });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const insufficient = score < 25;
  const level = confidenceLevelFromScore(score, insufficient);

  const explanations =
    penalties.length > 0
      ? penalties.map((p) => p.reason)
      : [
          "Dostatek srovnatelných nabídek, přijatelná lokalita i rozptyl cen — spolehlivost je vyšší.",
        ];

  return { score, level, penalties, explanations };
}

export { MIN_COMPS_FOR_ESTIMATE };
