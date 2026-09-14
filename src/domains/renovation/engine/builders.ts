/**
 * Build flip & max-offer inputs from renovation analysis pipeline.
 */

import { ASSUMPTION_CONFIG_V2026_07 } from "@/config/investment-assumptions";
import { Money, Percentage } from "@/domains/finance";
import { calculateGrossIncome } from "@/domains/investment/engine/calculations/income";

import type { RenovationEngineResult } from "../engine/analyze";
import type { RenovationFlipInput } from "../flip/types";
import type { MaxOfferCostContext } from "../offer/types";

const defaults = ASSUMPTION_CONFIG_V2026_07.defaults;

export function acquisitionCostsFromPurchase(purchaseCzk: number): {
  acquisitionCostsCzk: number;
  feesCzk: number;
} {
  return {
    acquisitionCostsCzk: Math.round(
      purchaseCzk * defaults.acquisitionCostsShareOfPrice,
    ),
    feesCzk: Math.round(purchaseCzk * defaults.feesShareOfPrice),
  };
}

export function buildFlipInputFromAnalysis(
  analysis: RenovationEngineResult,
  options: {
    purchasePriceCzk: number;
    loanPrincipalCzk?: number | null;
    sellingCostRatePct?: number;
  },
): RenovationFlipInput {
  const acq = acquisitionCostsFromPurchase(options.purchasePriceCzk);
  const holdMonths = Math.max(
    1,
    Math.round(analysis.timeline.base.months),
  );

  return {
    purchasePriceCzk: options.purchasePriceCzk,
    acquisitionCostsCzk: acq.acquisitionCostsCzk,
    feesCzk: acq.feesCzk,
    renovationCost: analysis.costs.totalInvestment,
    holdingCosts: analysis.holding.total,
    resaleValue: {
      lowCzk: analysis.outcome.arv.arvLowCzk ?? 0,
      baseCzk: analysis.outcome.arv.arvBaseCzk ?? 0,
      highCzk: analysis.outcome.arv.arvHighCzk ?? 0,
    },
    holdMonths,
    sellingCostRatePct:
      options.sellingCostRatePct ?? defaults.sellingCostPp,
    loanPrincipalCzk: options.loanPrincipalCzk,
    nominalInterestRatePp: defaults.interestRatePp,
    termYears: defaults.termYears,
  };
}

export function buildMaxOfferCostContextFromAnalysis(
  analysis: RenovationEngineResult,
  options?: {
    monthlyRentAfterCzk?: number | null;
    annualOpexCzk?: number | null;
    vacancyRatePp?: number;
  },
): MaxOfferCostContext {
  const rentAfter =
    options?.monthlyRentAfterCzk ??
    analysis.outcome.arv.postRenovation.expectedRentAfter?.baseCzk ??
    null;

  let annualEgi: number | null = null;
  if (rentAfter != null && rentAfter > 0) {
    annualEgi = calculateGrossIncome({
      monthlyRent: Money.fromMajor(rentAfter, "CZK"),
      vacancyRate: Percentage.fromPercentPoints(
        options?.vacancyRatePp ?? defaults.vacancyRatePp,
      ),
    }).effectiveGrossIncome.value.toMajorNumber();
  }

  return {
    renovationCost: analysis.costs.totalInvestment,
    holdingCosts: analysis.holding.total,
    resaleValue: {
      lowCzk: analysis.outcome.arv.arvLowCzk ?? 0,
      baseCzk: analysis.outcome.arv.arvBaseCzk ?? 0,
      highCzk: analysis.outcome.arv.arvHighCzk ?? 0,
    },
    annualEgiCzk: annualEgi,
    annualOpexCzk: options?.annualOpexCzk ?? null,
    acquisitionCostRatePct: defaults.acquisitionCostsShareOfPrice * 100,
    feesRatePct: defaults.feesShareOfPrice * 100,
    sellingCostRatePct: defaults.sellingCostPp,
    loanLtvPct: (1 - defaults.defaultEquityShare) * 100,
    nominalInterestRatePp: defaults.interestRatePp,
    termYears: defaults.termYears,
    holdMonths: Math.round(analysis.timeline.base.months),
  };
}
