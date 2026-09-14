/**
 * Renovation decision metrics — low/base/high, duration, ARV, value creation (BOD 95).
 */

import type { RenovationDecisionMetrics } from "./types";
import { confidenceFromScore } from "./confidence";

export function buildRenovationDecisionMetrics(input: {
  costLowCzk: number | null;
  costBaseCzk: number | null;
  costHighCzk: number | null;
  durationDays: number | null;
  arvCzk: number | null;
  askingPriceCzk: number | null;
  confidenceScore?: number | null;
}): RenovationDecisionMetrics {
  let valueCreationCzk: number | null = null;
  if (
    input.arvCzk != null &&
    input.askingPriceCzk != null &&
    input.costBaseCzk != null
  ) {
    valueCreationCzk = input.arvCzk - (input.askingPriceCzk + input.costBaseCzk);
  }

  return {
    costLowCzk: input.costLowCzk,
    costBaseCzk: input.costBaseCzk,
    costHighCzk: input.costHighCzk,
    durationDays: input.durationDays,
    arvCzk: input.arvCzk,
    valueCreationCzk,
    confidence: confidenceFromScore(input.confidenceScore ?? null),
  };
}
