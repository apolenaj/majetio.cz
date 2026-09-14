/**
 * Renovation engine orchestration — A→B→C→timeline→holding→D.
 */

import { assessCondition } from "../condition";
import { estimateRenovationCosts } from "../costs";
import { inferScopeFromCondition } from "../scope";
import { estimateRenovationTimeline } from "../timeline";
import { estimateHoldingCosts } from "../holding";
import { computeRenovationOutcome } from "../arv";
import { RENOVATION_ENGINE_VERSION } from "../version";

import type { PropertyCondition } from "../condition/types";
import type { RenovationConditionAssessment } from "../condition/types";
import type { RenovationCostEstimate } from "../costs/types";
import type { RenovationScope } from "../scope/types";
import type { RenovationTimelineEstimate } from "../timeline/types";
import type { HoldingCostBreakdown } from "../holding";
import type { RenovationOutcome } from "../arv/types";
import type {
  ComparableCandidate,
  ValuationSubject,
} from "@/domains/valuation/service/types";

export type RenovationEngineAnalyzeInput = {
  subject: ValuationSubject;
  comparables: ComparableCandidate[];
  condition: PropertyCondition;
  purchasePriceCzk: number;
  usableArea?: number | null;
  bathroomsCount?: number | null;
  location?: {
    city?: string | null;
    region?: string | null;
    publicCity?: string | null;
    publicRegion?: string | null;
  };
  monthlyRentCzk?: number | null;
  annualOpexCzk?: number | null;
  loanPrincipalCzk?: number | null;
  nominalInterestRatePp?: number;
  monthlyHoaCzk?: number | null;
  monthlyEnergyCzk?: number | null;
};

export type RenovationEngineResult = {
  status: "calculated" | "partial" | "failed";
  engineVersion: string;
  condition: RenovationConditionAssessment;
  scope: RenovationScope;
  costs: RenovationCostEstimate;
  timeline: RenovationTimelineEstimate;
  holding: HoldingCostBreakdown;
  outcome: RenovationOutcome;
};

export function analyzeRenovation(
  input: RenovationEngineAnalyzeInput,
): RenovationEngineResult {
  const condition = assessCondition({
    condition: input.condition,
    usableArea: input.usableArea,
    bathroomsCount: input.bathroomsCount,
  });

  const scope = inferScopeFromCondition({
    conditionAssessment: condition,
    usableArea: input.usableArea,
    bathroomsCount: input.bathroomsCount,
  });

  const costs = estimateRenovationCosts({
    scope,
    conditionAssessment: condition,
    propertyAreaSqm: input.usableArea,
    location: input.location,
  });

  const timeline = estimateRenovationTimeline({
    scope,
    structureUnknown: condition.areas.structure.status === "unknown",
  });

  const holding = estimateHoldingCosts({
    timeline,
    timelineScenario: "base",
    purchasePriceCzk: input.purchasePriceCzk,
    loanPrincipalCzk: input.loanPrincipalCzk,
    nominalInterestRatePp: input.nominalInterestRatePp,
    monthlyHoaCzk: input.monthlyHoaCzk,
    monthlyEnergyCzk: input.monthlyEnergyCzk,
    monthlyRentCzk: input.monthlyRentCzk,
  });

  const outcome = computeRenovationOutcome({
    subject: input.subject,
    candidates: input.comparables,
    scope,
    conditionBefore: input.condition,
    monthlyRentBeforeCzk: input.monthlyRentCzk,
    annualOpexCzk: input.annualOpexCzk,
    purchasePriceCzk: input.purchasePriceCzk,
    renovationCost: costs.totalInvestment,
    holdingCosts: holding.total,
  });

  const status =
    costs.confidence === "insufficient" ||
    outcome.arv.confidenceLevel === "insufficient"
      ? "partial"
      : "calculated";

  return {
    status,
    engineVersion: RENOVATION_ENGINE_VERSION,
    condition,
    scope,
    costs,
    timeline,
    holding,
    outcome,
  };
}

/**
 * Async façade for API routes / services.
 */
export const renovationEngine = {
  version: RENOVATION_ENGINE_VERSION,
  analyze(input: RenovationEngineAnalyzeInput): Promise<RenovationEngineResult> {
    return Promise.resolve(analyzeRenovation(input));
  },
};

export type RenovationEngine = typeof renovationEngine;
