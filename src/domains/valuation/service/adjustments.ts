/**
 * Feature adjustments / korekce (Prompt 10 Part 2).
 * Each adjustment exposes factor, amountCzk, reason — explainable.
 */

import type {
  ComparableCandidate,
  FeatureAdjustment,
  ValuationSubject,
} from "./types";

const CONDITION_RANK: Record<string, number> = {
  NEW: 6,
  EXCELLENT: 5,
  GOOD: 4,
  AVERAGE: 3,
  NEEDS_RENOVATION: 2,
  SHELL: 1,
  UNKNOWN: 3,
};

function conditionRank(c: string | null | undefined): number {
  return CONDITION_RANK[(c ?? "UNKNOWN").toUpperCase()] ?? 3;
}

/**
 * Build explainable adjustments vs typical included comps.
 * Factors are relative deltas (0.02 = +2 %). amountCzk = round(base × factor).
 */
export function computeFeatureAdjustments(
  subject: ValuationSubject,
  includedComps: ComparableCandidate[],
  baseValueCzk: number,
): FeatureAdjustment[] {
  if (!Number.isFinite(baseValueCzk) || baseValueCzk <= 0) return [];

  const adjustments: FeatureAdjustment[] = [];

  // Balcony: subject has, majority of comps do not → +2 %
  if (subject.hasBalcony === true) {
    const withBalcony = includedComps.filter((c) => c.hasBalcony === true).length;
    const known = includedComps.filter((c) => c.hasBalcony != null).length;
    if (known >= 2 && withBalcony / known < 0.4) {
      const factor = 0.02;
      adjustments.push({
        code: "balcony",
        factor,
        amountCzk: Math.round(baseValueCzk * factor),
        reason: "Balkon: subjekt má balkon, většina comparables ne (+2 %)",
      });
    }
  }

  // Floor: ground floor penalty; high floor + elevator premium
  if (subject.floor != null) {
    if (subject.floor === 0 || subject.floor === 1) {
      const factor = -0.03;
      adjustments.push({
        code: "ground_floor",
        factor,
        amountCzk: Math.round(baseValueCzk * factor),
        reason: "Přízemí / 1. NP: typicky nižší poptávka (−3 %)",
      });
    } else if (
      subject.floorsTotal != null &&
      subject.floor >= subject.floorsTotal - 1 &&
      subject.hasElevator === true
    ) {
      const factor = 0.015;
      adjustments.push({
        code: "high_floor_elevator",
        factor,
        amountCzk: Math.round(baseValueCzk * factor),
        reason: "Vyšší patro s výtahem (+1,5 %)",
      });
    }
  }

  // Condition vs median comp condition
  if (includedComps.length > 0 && subject.condition) {
    const ranks = includedComps.map((c) => conditionRank(c.condition)).sort((a, b) => a - b);
    const mid = ranks[Math.floor(ranks.length / 2)]!;
    const sub = conditionRank(subject.condition);
    const delta = sub - mid;
    if (delta >= 2) {
      const factor = 0.04;
      adjustments.push({
        code: "condition_better",
        factor,
        amountCzk: Math.round(baseValueCzk * factor),
        reason: `Stav lepší než medián comparables (${subject.condition} vs. medián rank ${mid}) (+4 %)`,
      });
    } else if (delta <= -2) {
      const factor = -0.05;
      adjustments.push({
        code: "condition_worse",
        factor,
        amountCzk: Math.round(baseValueCzk * factor),
        reason: `Stav horší než medián comparables (${subject.condition}) (−5 %) — typicky před rekonstrukcí`,
      });
    }
  }

  // Elevator missing in mid/high building
  if (
    subject.hasElevator === false &&
    subject.floorsTotal != null &&
    subject.floorsTotal >= 5 &&
    (subject.floor ?? 0) >= 3
  ) {
    const factor = -0.025;
    adjustments.push({
      code: "no_elevator",
      factor,
      amountCzk: Math.round(baseValueCzk * factor),
      reason: "Byt ve vyšším patře bez výtahu (−2,5 %)",
    });
  }

  return adjustments;
}

/** Apply Σ factors: adjusted = base × (1 + Σ factor). */
export function applyAdjustments(
  baseValueCzk: number,
  adjustments: FeatureAdjustment[],
): number {
  const sum = adjustments.reduce((s, a) => s + a.factor, 0);
  return Math.round(baseValueCzk * (1 + sum));
}
