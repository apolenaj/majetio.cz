/**
 * Flip calculation — purchase through resale with banded outputs.
 */

import { Money, Percentage } from "@/domains/finance";
import { calculateNetSaleProceeds } from "@/domains/investment/engine/calculations/exit";
import {
  buildEquityCashFlowSeries,
  calculateIrr,
} from "@/domains/investment/engine/calculations/returns";

import type { CostBand } from "../costs/bands";
import {
  FLIP_ENGINE_VERSION,
  type RenovationFlipInput,
  type RenovationFlipMetrics,
  type RenovationFlipResult,
} from "./types";

function roundCzk(n: number): number {
  return Math.round(n);
}

function band(low: number, base: number, high: number): CostBand {
  return {
    lowCzk: roundCzk(Math.min(low, base, high)),
    baseCzk: roundCzk(base),
    highCzk: roundCzk(Math.max(low, base, high)),
  };
}

function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 0;
  }
  return Math.round((numerator / denominator) * 10000) / 100;
}

export function breakEvenSalePrice(
  totalProjectCostCzk: number,
  sellingCostRatePct: number,
): number {
  const rate = sellingCostRatePct / 100;
  if (rate >= 1) {
    throw new Error("sellingCostRatePct must be < 100");
  }
  return roundCzk(totalProjectCostCzk / (1 - rate));
}

function flipMetricsAtScenario(input: {
  purchase: number;
  acquisition: number;
  fees: number;
  renovation: number;
  holding: number;
  resale: number;
  holdMonths: number;
  sellingRatePct: number;
  loanPrincipal: number;
}): {
  grossProfit: number;
  profitBeforeTax: number;
  marginOnCost: number;
  marginOnSale: number;
  annualizedReturn: number;
  irrPct: number | null;
  totalCost: number;
  equityRequired: number;
  netProceeds: number;
} {
  const totalCost =
    input.purchase +
    input.acquisition +
    input.fees +
    input.renovation +
    input.holding;

  const sale = Money.fromMajor(input.resale, "CZK");
  const sellingRate = Percentage.fromPercentPoints(input.sellingRatePct);
  const exit = calculateNetSaleProceeds({
    salePrice: sale,
    sellingCostRate: sellingRate,
    outstandingLoanBalance: Money.fromMajor(input.loanPrincipal, "CZK"),
  });

  const saleNetOfSelling = input.resale - exit.sellingCosts.toMajorNumber();
  const grossProfit = saleNetOfSelling - totalCost;

  const equityRequired = Math.max(0, totalCost - input.loanPrincipal);
  const netProceeds = exit.netSaleProceeds.value.toMajorNumber();
  const profitBeforeTax = netProceeds - equityRequired;

  const marginOnCost = pct(grossProfit, totalCost);
  const marginOnSale = pct(grossProfit, input.resale);

  let annualizedReturn = 0;
  if (equityRequired > 0 && input.holdMonths > 0) {
    const multiple = netProceeds / equityRequired;
    annualizedReturn =
      Math.round(
        (Math.pow(multiple, 12 / input.holdMonths) - 1) * 10000,
      ) / 100;
  }

  let irrPct: number | null = null;
  if (equityRequired > 0) {
    const series = buildEquityCashFlowSeries(
      Money.fromMajor(equityRequired, "CZK"),
      [exit.netSaleProceeds.value],
    );
    const irr = calculateIrr(series);
    irrPct =
      irr.value != null ? irr.value.toPercentPointsNumber() : null;
  }

  return {
    grossProfit,
    profitBeforeTax,
    marginOnCost,
    marginOnSale,
    annualizedReturn,
    irrPct,
    totalCost,
    equityRequired,
    netProceeds,
  };
}

/**
 * Compute flip metrics across low/base/high bands.
 */
export function calculateRenovationFlip(
  input: RenovationFlipInput,
): RenovationFlipResult {
  const holdMonths = Math.max(1, Math.round(input.holdMonths));
  const sellingRatePct = input.sellingCostRatePct ?? 3;
  const loan = input.loanPrincipalCzk ?? 0;

  const acquisition = input.acquisitionCostsCzk ?? 0;
  const fees = input.feesCzk ?? 0;

  const low = flipMetricsAtScenario({
    purchase: input.purchasePriceCzk,
    acquisition,
    fees,
    renovation: input.renovationCost.highCzk,
    holding: input.holdingCosts.highCzk,
    resale: input.resaleValue.lowCzk,
    holdMonths,
    sellingRatePct,
    loanPrincipal: loan,
  });

  const base = flipMetricsAtScenario({
    purchase: input.purchasePriceCzk,
    acquisition,
    fees,
    renovation: input.renovationCost.baseCzk,
    holding: input.holdingCosts.baseCzk,
    resale: input.resaleValue.baseCzk,
    holdMonths,
    sellingRatePct,
    loanPrincipal: loan,
  });

  const high = flipMetricsAtScenario({
    purchase: input.purchasePriceCzk,
    acquisition,
    fees,
    renovation: input.renovationCost.lowCzk,
    holding: input.holdingCosts.lowCzk,
    resale: input.resaleValue.highCzk,
    holdMonths,
    sellingRatePct,
    loanPrincipal: loan,
  });

  const metrics: RenovationFlipMetrics = {
    grossProfit: band(low.grossProfit, base.grossProfit, high.grossProfit),
    profitBeforeTax: band(
      low.profitBeforeTax,
      base.profitBeforeTax,
      high.profitBeforeTax,
    ),
    marginOnTotalCostPct: band(
      low.marginOnCost,
      base.marginOnCost,
      high.marginOnCost,
    ),
    marginOnSalePct: band(
      low.marginOnSale,
      base.marginOnSale,
      high.marginOnSale,
    ),
    annualizedReturnPct: band(
      low.annualizedReturn,
      base.annualizedReturn,
      high.annualizedReturn,
    ),
    irrPct:
      low.irrPct != null && base.irrPct != null && high.irrPct != null
        ? band(low.irrPct, base.irrPct, high.irrPct)
        : null,
    breakEvenSalePriceCzk: breakEvenSalePrice(base.totalCost, sellingRatePct),
    totalProjectCost: band(low.totalCost, base.totalCost, high.totalCost),
    equityRequiredCzk: base.equityRequired,
    netSaleProceeds: band(low.netProceeds, base.netProceeds, high.netProceeds),
  };

  return {
    metrics,
    holdMonths,
    flipEngineVersion: FLIP_ENGINE_VERSION,
  };
}
