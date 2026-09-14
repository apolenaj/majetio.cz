/**
 * Asking price vs. modeled maximum — negotiation anchor & margin of safety.
 */

import type { AskingPriceComparison, MaxOfferBandSet } from "./types";

export function compareAskingToMaxOffer(
  askingPriceCzk: number,
  maximumOffer: MaxOfferBandSet,
): AskingPriceComparison {
  const modeledLimitCzk = maximumOffer.conservative;
  const gapCzk = askingPriceCzk - modeledLimitCzk;
  const gapPct =
    askingPriceCzk > 0
      ? Math.round((gapCzk / askingPriceCzk) * 10000) / 100
      : 0;

  const discountRequiredCzk = Math.max(0, gapCzk);
  const discountRequiredPct =
    askingPriceCzk > 0
      ? Math.round((discountRequiredCzk / askingPriceCzk) * 10000) / 100
      : 0;

  const marginAmount = modeledLimitCzk - askingPriceCzk;
  const marginPct =
    askingPriceCzk > 0
      ? Math.round((marginAmount / askingPriceCzk) * 10000) / 100
      : 0;

  return {
    askingPriceCzk,
    modeledLimitCzk,
    gapCzk,
    gapPct,
    withinLimit: askingPriceCzk <= modeledLimitCzk,
    negotiationAnchor: {
      discountRequiredCzk,
      discountRequiredPct,
      message:
        discountRequiredCzk > 0
          ? `Pro splnění konzervativního limitu je potřeba sleva cca ${discountRequiredPct} % (${discountRequiredCzk.toLocaleString("cs-CZ")} Kč).`
          : "Asking price je na nebo pod konzervativním maximem — prostor pro vyjednávání je omezený.",
    },
    marginOfSafety: {
      amountCzk: marginAmount,
      pctOfAsking: marginPct,
      message:
        marginAmount >= 0
          ? `Margin of safety +${marginAmount.toLocaleString("cs-CZ")} Kč (${marginPct} % vůči asking).`
          : `Záporná margin of safety ${marginAmount.toLocaleString("cs-CZ")} Kč — asking překračuje konzervativní maximum.`,
    },
  };
}
