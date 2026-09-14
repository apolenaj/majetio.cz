/**
 * Confidence scoring for renovation cost estimates.
 */

import type { RenovationConditionAssessment } from "../condition/types";
import type { RenovationScope } from "../scope/types";
import type { CostConfidenceLevel, CostWarning, PricedRenovationItem } from "./types";

export type ConfidenceInput = {
  scope: RenovationScope;
  conditionAssessment?: RenovationConditionAssessment | null;
  pricedItems: PricedRenovationItem[];
  warnings: CostWarning[];
};

export function resolveCostConfidence(input: ConfidenceInput): {
  level: CostConfidenceLevel;
  score: number | null;
} {
  const { scope, conditionAssessment, pricedItems, warnings } = input;

  if (scope.items.length === 0) {
    return { level: "insufficient", score: null };
  }

  const pricedCount = pricedItems.filter((i) => i.costBase !== null).length;
  const pricedRatio = pricedCount / scope.items.length;

  if (pricedRatio === 0) {
    return { level: "insufficient", score: null };
  }

  const quantityKnown = pricedItems.filter((i) => i.quantity !== null).length;
  const quantityRatio = quantityKnown / scope.items.length;

  const hasCriticalWarning = warnings.some((w) => w.severity === "critical");
  const hasStructureUnknown = warnings.some(
    (w) => w.code === "structure_unknown" || w.code === "hidden_defects_risk",
  );

  let score = 100;
  score -= (1 - pricedRatio) * 40;
  score -= (1 - quantityRatio) * 25;
  if (conditionAssessment?.isPartial) {
    score -= 15;
  }
  if (hasStructureUnknown) {
    score -= 20;
  }
  if (hasCriticalWarning) {
    score -= 15;
  }
  if (scope.origin === "user_defined") {
    score -= 5;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let level: CostConfidenceLevel;
  if (pricedRatio < 0.5 || score < 30) {
    level = "insufficient";
  } else if (score >= 75 && pricedRatio >= 0.95 && quantityRatio >= 0.8) {
    level = "high";
  } else if (score >= 50) {
    level = "medium";
  } else {
    level = "low";
  }

  return {
    level,
    score: level === "insufficient" ? null : score,
  };
}
