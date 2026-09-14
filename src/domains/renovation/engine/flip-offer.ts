/**
 * Full flip + maximum offer orchestration (Prompt 5/5).
 */

import { analyzeRenovation, type RenovationEngineAnalyzeInput } from "./analyze";
import {
  buildFlipInputFromAnalysis,
  buildMaxOfferCostContextFromAnalysis,
} from "./builders";
import { calculateRenovationFlip, type RenovationFlipResult } from "../flip";
import {
  calculateMaximumOffer,
  type MaxOfferInput,
  type MaxOfferResult,
} from "../offer";

export type FlipAndOfferInput = RenovationEngineAnalyzeInput & {
  askingPriceCzk?: number | null;
  loanPrincipalCzk?: number | null;
  maxOfferTarget: MaxOfferInput["target"];
  annualOpexCzk?: number | null;
};

export type FlipAndOfferResult = {
  analysis: ReturnType<typeof analyzeRenovation>;
  flip: RenovationFlipResult;
  maxOffer: MaxOfferResult;
};

export function analyzeFlipAndMaxOffer(
  input: FlipAndOfferInput,
): FlipAndOfferResult {
  const analysis = analyzeRenovation(input);
  const purchase =
    input.askingPriceCzk ?? input.purchasePriceCzk;

  const flip = calculateRenovationFlip(
    buildFlipInputFromAnalysis(analysis, {
      purchasePriceCzk: purchase,
      loanPrincipalCzk: input.loanPrincipalCzk,
    }),
  );

  const maxOffer = calculateMaximumOffer({
    target: input.maxOfferTarget,
    costs: buildMaxOfferCostContextFromAnalysis(analysis, {
      annualOpexCzk: input.annualOpexCzk,
    }),
    askingPriceCzk: input.askingPriceCzk ?? input.purchasePriceCzk,
  });

  return { analysis, flip, maxOffer };
}
