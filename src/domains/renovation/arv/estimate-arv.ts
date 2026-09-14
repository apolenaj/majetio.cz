/**
 * ARV via Valuation Engine — simulates renovated subject vs. comparables.
 */

import { runValuationEstimate } from "@/domains/valuation/service";
import type {
  ComparableCandidate,
  ValuationEstimateResult,
  ValuationSubject,
} from "@/domains/valuation/service/types";

import type { PropertyCondition } from "../condition/types";
import type { RenovationScope } from "../scope/types";
import { conditionAfterForScope } from "./post-renovation-scenario";
import { ARV_MODEL_VERSION, type ArvConfidenceLevel, type ValueBand } from "./types";

function toValueBand(result: ValuationEstimateResult): ValueBand | null {
  if (result.adjustedValueCzk == null) {
    return null;
  }
  const base = result.adjustedValueCzk;
  const low = result.lowerBoundCzk ?? Math.round(base * 0.94);
  const high = result.upperBoundCzk ?? Math.round(base * 1.06);
  return {
    lowCzk: Math.min(low, base),
    baseCzk: base,
    highCzk: Math.max(high, base),
  };
}

function mapConfidence(level: string, score: number): ArvConfidenceLevel {
  if (level === "INSUFFICIENT" || score < 30) {
    return "insufficient";
  }
  if (level === "HIGH" || score >= 75) {
    return "high";
  }
  if (level === "MEDIUM" || score >= 50) {
    return "medium";
  }
  return "low";
}

export type ValuationPair = {
  before: ValuationEstimateResult;
  after: ValuationEstimateResult;
  valueBefore: ValueBand | null;
  valueAfter: ValueBand | null;
};

export function runBeforeAfterValuation(input: {
  subject: ValuationSubject;
  candidates: ComparableCandidate[];
  scope: RenovationScope;
  conditionBefore: PropertyCondition;
  asOf?: Date;
}): ValuationPair {
  const beforeSubject: ValuationSubject = {
    ...input.subject,
    condition: input.conditionBefore,
  };

  const conditionAfter = conditionAfterForScope(
    input.scope,
    input.conditionBefore,
  );
  const afterSubject: ValuationSubject = {
    ...input.subject,
    condition: conditionAfter,
  };

  const before = runValuationEstimate(beforeSubject, input.candidates, {
    asOf: input.asOf,
  });
  const after = runValuationEstimate(afterSubject, input.candidates, {
    asOf: input.asOf,
  });

  return {
    before,
    after,
    valueBefore: toValueBand(before),
    valueAfter: toValueBand(after),
  };
}

export function estimateArvFromValuation(valuation: ValuationPair): {
  arvLowCzk: number | null;
  arvBaseCzk: number | null;
  arvHighCzk: number | null;
  confidence: number | null;
  confidenceLevel: ArvConfidenceLevel;
  valuationStatus: string;
  arvModelVersion: string;
} {
  const band = valuation.valueAfter;
  const after = valuation.after;

  return {
    arvLowCzk: band?.lowCzk ?? null,
    arvBaseCzk: band?.baseCzk ?? null,
    arvHighCzk: band?.highCzk ?? null,
    confidence: after.confidenceScore > 0 ? after.confidenceScore : null,
    confidenceLevel: mapConfidence(
      after.confidenceLevel,
      after.confidenceScore,
    ),
    valuationStatus: after.status,
    arvModelVersion: ARV_MODEL_VERSION,
  };
}
