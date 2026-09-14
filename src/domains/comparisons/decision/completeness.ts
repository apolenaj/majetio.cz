/**
 * Decision completeness — strict rule-based (BOD 111–113).
 * low | medium | ready_for_decision
 */

import { comparisonConfig } from "@/config/comparison";
import type {
  ComparisonPropertyDecision,
  DecisionCompletenessStatus,
  FinancingDecisionMetrics,
  RenovationDecisionMetrics,
  RiskDecisionSummary,
  ScoredMetric,
} from "./types";

export type CompletenessGap = {
  id: string;
  labelCs: string;
};

/**
 * Gaps that block a confident decision — rule-based checklist.
 */
export function collectDecisionGaps(input: {
  askingPriceCzk: number | null;
  valuationMidCzk: number | null;
  majetioScore: ScoredMetric;
  matchScore: ScoredMetric;
  locationScore: ScoredMetric;
  renovation: RenovationDecisionMetrics;
  financing: FinancingDecisionMetrics | null;
  risks: RiskDecisionSummary;
  hasCriticalRiskWithoutDetail: boolean;
}): CompletenessGap[] {
  const gaps: CompletenessGap[] = [];

  if (input.askingPriceCzk == null) {
    gaps.push({ id: "asking_price", labelCs: "ověřená nabídková cena" });
  }
  if (input.valuationMidCzk == null) {
    gaps.push({ id: "valuation", labelCs: "odhad hodnoty (valuace)" });
  }
  if (input.majetioScore.score == null) {
    gaps.push({ id: "majetio_score", labelCs: "Majetio Score" });
  }
  if (input.matchScore.score == null || !input.matchScore.breakdown.length) {
    gaps.push({
      id: "match_score",
      labelCs: "shoda s Finančním pasem (doplňte profil)",
    });
  }
  if (input.locationScore.score == null && input.locationScore.breakdown.length === 0) {
    gaps.push({ id: "location_score", labelCs: "skóre lokality s breakdownem" });
  }
  if (
    input.renovation.costBaseCzk == null &&
    input.renovation.arvCzk == null
  ) {
    gaps.push({ id: "renovation", labelCs: "odhad rekonstrukce (low/base/high)" });
  }
  if (
    !input.financing ||
    input.financing.equityCzk == null ||
    input.financing.monthlyPaymentCzk == null
  ) {
    gaps.push({
      id: "financing",
      labelCs: "financování (equity / splátka) z Finančního pasu",
    });
  }
  if (input.risks.items.length === 0) {
    gaps.push({ id: "risks", labelCs: "přehled rizik podle závažnosti" });
  }
  if (input.hasCriticalRiskWithoutDetail) {
    gaps.push({
      id: "risk_detail",
      labelCs: "detail kritických rizik",
    });
  }

  return gaps;
}

export function completenessFromGapCount(
  gapCount: number,
): DecisionCompletenessStatus {
  const { readyMaxMissing, mediumMaxMissing } = comparisonConfig.decision;
  if (gapCount <= readyMaxMissing) return "ready_for_decision";
  if (gapCount <= mediumMaxMissing) return "medium";
  return "low";
}

export function completenessFromGaps(
  gaps: CompletenessGap[],
): DecisionCompletenessStatus {
  return completenessFromGapCount(gaps.length);
}

export function overallCompleteness(
  properties: Array<{ completeness: DecisionCompletenessStatus }>,
): DecisionCompletenessStatus {
  if (properties.length === 0) return "low";
  const rank: Record<DecisionCompletenessStatus, number> = {
    low: 0,
    medium: 1,
    ready_for_decision: 2,
  };
  let worst: DecisionCompletenessStatus = "ready_for_decision";
  for (const p of properties) {
    if (rank[p.completeness] < rank[worst]) worst = p.completeness;
  }
  return worst;
}

export function propertyHasCriticalWithoutDetail(
  risks: RiskDecisionSummary,
): boolean {
  return risks.counts.critical > 0 && risks.items.every((i) => !i.detail?.trim());
}

/** Convenience for assembled property rows. */
export function gapsForProperty(
  p: Pick<
    ComparisonPropertyDecision,
    | "basics"
    | "valuation"
    | "majetioScore"
    | "matchScore"
    | "locationScore"
    | "renovation"
    | "financing"
    | "risks"
  >,
): CompletenessGap[] {
  return collectDecisionGaps({
    askingPriceCzk: p.basics.askingPriceCzk,
    valuationMidCzk: p.valuation.midCzk,
    majetioScore: p.majetioScore,
    matchScore: p.matchScore,
    locationScore: p.locationScore,
    renovation: p.renovation,
    financing: p.financing,
    risks: p.risks,
    hasCriticalRiskWithoutDetail: propertyHasCriticalWithoutDetail(p.risks),
  });
}
