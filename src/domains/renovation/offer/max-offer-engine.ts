/**
 * Maximum Offer Price Engine — unified entry point.
 */

import { compareAskingToMaxOffer } from "./compare";
import { maxPurchaseFlipBands } from "./reverse-flip";
import { maxPurchaseRentalBands } from "./reverse-rental";
import {
  MAX_OFFER_MODEL_VERSION,
  type MaxOfferInput,
  type MaxOfferResult,
} from "./types";

export function calculateMaximumOffer(input: MaxOfferInput): MaxOfferResult {
  if (input.target.strategy === "flip") {
    const maximumOffer = maxPurchaseFlipBands(
      input.costs,
      input.target.targetProfitCzk,
    );

    return {
      strategy: "flip",
      maximumOffer,
      bindingTarget: `target profit ${input.target.targetProfitCzk} Kč`,
      offerModelVersion: MAX_OFFER_MODEL_VERSION,
      comparison:
        input.askingPriceCzk != null
          ? compareAskingToMaxOffer(input.askingPriceCzk, maximumOffer)
          : null,
    };
  }

  const { bands, bindingTarget } = maxPurchaseRentalBands({
    costs: input.costs,
    targetNetYieldPct: input.target.targetNetYieldPct,
    targetMonthlyCashFlowCzk: input.target.targetMonthlyCashFlowCzk,
    targetCashOnCashPct: input.target.targetCashOnCashPct,
    targetIrrPct: input.target.targetIrrPct,
    holdYears: input.target.holdYears,
  });

  return {
    strategy: "rental",
    maximumOffer: bands,
    bindingTarget,
    offerModelVersion: MAX_OFFER_MODEL_VERSION,
    comparison:
      input.askingPriceCzk != null
        ? compareAskingToMaxOffer(input.askingPriceCzk, bands)
        : null,
  };
}
