/**
 * Comparable selection + weighting pipeline (Prompt 10 Part 2).
 */

import { geoTierWeight, resolveGeoTier } from "./geo-hierarchy";
import { timeDecayWeight } from "./time-decay";
import { computeSimilarityScore } from "./similarity";
import { detectOutliers } from "./outliers";
import { renormalizeWeights, resolvePricePerSqm } from "./base-valuation";
import type {
  ComparableCandidate,
  ScoredComparable,
  ValuationSubject,
} from "./types";

export type SelectComparablesOptions = {
  asOf?: Date;
  /** Drop OUT_OF_SCOPE tiers from the working set. Default true. */
  dropOutOfScope?: boolean;
  /** Minimum similarity to keep (before outlier pass). Default 0.25. */
  minSimilarity?: number;
  /** Max comps kept after scoring (highest rawWeight). Default 25. */
  maxComparables?: number;
};

/**
 * Score candidates: geo hierarchy × time decay × similarity → rawWeight.
 * Then outlier pass marks excluded (keeps rows with reason).
 */
export function selectAndWeightComparables(
  subject: ValuationSubject,
  candidates: ComparableCandidate[],
  options: SelectComparablesOptions = {},
): ScoredComparable[] {
  const dropOutOfScope = options.dropOutOfScope !== false;
  const minSimilarity = options.minSimilarity ?? 0.25;
  const maxComparables = options.maxComparables ?? 25;
  const asOf = options.asOf ?? new Date();

  const scored: ScoredComparable[] = [];

  for (const candidate of candidates) {
    if (candidate.id === subject.id) continue;

    const pps = resolvePricePerSqm(
      candidate.priceCzk,
      candidate.usableArea,
      candidate.pricePerSqm,
    );
    if (pps == null) {
      scored.push({
        candidate,
        pricePerSqm: 0,
        geoTier: "OUT_OF_SCOPE",
        geoWeight: 0,
        timeDecayWeight: 0,
        similarityScore: 0,
        rawWeight: 0,
        weight: 0,
        included: false,
        exclusionReason: "Chybí cena nebo plocha — nelze spočítat Kč/m²",
        distanceMeters: null,
      });
      continue;
    }

    const { tier, distanceMeters } = resolveGeoTier(subject, candidate);
    if (dropOutOfScope && tier === "OUT_OF_SCOPE") {
      continue;
    }

    const geoW = geoTierWeight(tier);
    const timeW = timeDecayWeight(candidate.observedAt, { asOf });
    const similarity = computeSimilarityScore(subject, candidate);

    let included = true;
    let exclusionReason: string | null = null;
    if (tier === "OUT_OF_SCOPE") {
      included = false;
      exclusionReason = "Mimo geografickou hierarchii (mimo region)";
    } else if (similarity < minSimilarity) {
      included = false;
      exclusionReason = `Nízká podobnost (similarity ${similarity} < ${minSimilarity})`;
    }

    const rawWeight = included ? geoW * timeW * similarity : 0;

    scored.push({
      candidate,
      pricePerSqm: pps,
      geoTier: tier,
      geoWeight: geoW,
      timeDecayWeight: timeW,
      similarityScore: similarity,
      rawWeight,
      weight: 0,
      included,
      exclusionReason,
      distanceMeters,
    });
  }

  // Keep top-N by rawWeight among still-included (plus all excluded for audit trail)
  const includedSorted = scored
    .filter((s) => s.included)
    .sort((a, b) => b.rawWeight - a.rawWeight);
  const keepIds = new Set(
    includedSorted.slice(0, maxComparables).map((s) => s.candidate.id),
  );
  for (const s of scored) {
    if (s.included && !keepIds.has(s.candidate.id)) {
      s.included = false;
      s.rawWeight = 0;
      s.exclusionReason = `Mimo top ${maxComparables} comparables podle váhy`;
    }
  }

  // Outlier detection on currently included
  const outlierInput = scored
    .filter((s) => s.included)
    .map((s) => ({
      id: s.candidate.id,
      pricePerSqm: s.pricePerSqm,
      usableArea: s.candidate.usableArea,
      propertyType: subject.propertyType,
    }));
  const marks = detectOutliers(outlierInput);
  const markById = new Map(marks.map((m) => [m.id, m]));

  for (const s of scored) {
    const mark = markById.get(s.candidate.id);
    if (mark?.excluded) {
      s.included = false;
      s.rawWeight = 0;
      s.exclusionReason = mark.reason;
    }
  }

  return renormalizeWeights(scored);
}
