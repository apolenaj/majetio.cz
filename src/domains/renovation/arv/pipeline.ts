/**
 * Full ARV + economics pipeline (Concept D).
 */

import { buildPostRenovationScenario } from "./post-renovation-scenario";
import {
  estimateArvFromValuation,
  runBeforeAfterValuation,
} from "./estimate-arv";
import { computeRenovationEconomics } from "./economics";
import type {
  ArvEstimate,
  ArvEstimateInput,
  FullRenovationOutcomeInput,
  RenovationOutcome,
} from "./types";
import type { ValueBand } from "./types";

export function estimateArv(input: ArvEstimateInput): ArvEstimate {
  const valuation = runBeforeAfterValuation({
    subject: input.subject,
    candidates: input.candidates,
    scope: input.scope,
    conditionBefore: input.conditionBefore,
  });

  const arvCore = estimateArvFromValuation(valuation);

  const valueAfter: ValueBand =
    valuation.valueAfter ??
    ({ lowCzk: 0, baseCzk: 0, highCzk: 0 } satisfies ValueBand);

  const postRenovation = buildPostRenovationScenario({
    scope: input.scope,
    conditionBefore: input.conditionBefore,
    valueAfter,
    monthlyRentBeforeCzk: input.monthlyRentBeforeCzk,
  });

  return {
    ...arvCore,
    postRenovation,
    valueBefore: valuation.valueBefore,
  };
}

export function computeRenovationOutcome(
  input: FullRenovationOutcomeInput,
): RenovationOutcome {
  const arv = estimateArv(input);

  const economics = computeRenovationEconomics({
    purchasePriceCzk: input.purchasePriceCzk,
    renovationCost: input.renovationCost,
    holdingCosts: input.holdingCosts,
    valueBefore: arv.valueBefore,
    valueAfter: arv.postRenovation.expectedValueAfter,
    monthlyRentBeforeCzk: input.monthlyRentBeforeCzk,
    monthlyRentAfterCzk: arv.postRenovation.expectedRentAfter?.baseCzk ?? null,
    annualOpexCzk: input.annualOpexCzk,
  });

  return { arv, economics };
}
