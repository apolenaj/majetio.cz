/**
 * Reverse max purchase price for flip target profit.
 */

import { resolveAssumptionDefaults } from "@/config/investment-assumptions";

import type { MaxOfferBandSet, MaxOfferCostContext } from "./types";

function roundCzk(n: number): number {
  return Math.max(0, Math.round(n));
}

function arvNet(resale: number, sellingRatePct: number): number {
  return resale * (1 - sellingRatePct / 100);
}

export function maxPurchaseFlip(input: {
  costs: MaxOfferCostContext;
  targetProfitCzk: number;
  scenario: "conservative" | "base" | "optimistic";
}): number {
  const c = input.costs;
  const { defaults } = resolveAssumptionDefaults({ strategy: "flip" });
  const acq =
    c.acquisitionCostRatePct != null
      ? c.acquisitionCostRatePct / 100
      : defaults.acquisitionCostsShareOfPrice;
  const fees =
    c.feesRatePct != null ? c.feesRatePct / 100 : defaults.feesShareOfPrice;
  const selling = c.sellingCostRatePct ?? defaults.sellingCostPp;

  let resale: number;
  let reno: number;
  let holding: number;
  let profit = input.targetProfitCzk;

  switch (input.scenario) {
    case "conservative":
      resale = c.resaleValue.lowCzk;
      reno = c.renovationCost.highCzk;
      holding = c.holdingCosts.highCzk;
      profit = Math.round(profit * 1.1);
      break;
    case "optimistic":
      resale = c.resaleValue.highCzk;
      reno = c.renovationCost.lowCzk;
      holding = c.holdingCosts.lowCzk;
      break;
    default:
      resale = c.resaleValue.baseCzk;
      reno = c.renovationCost.baseCzk;
      holding = c.holdingCosts.baseCzk;
  }

  const net = arvNet(resale, selling);
  const fixed = reno + holding + profit;
  const purchaseMultiplier = 1 + acq + fees;

  return roundCzk((net - fixed) / purchaseMultiplier);
}

export function maxPurchaseFlipBands(
  costs: MaxOfferCostContext,
  targetProfitCzk: number,
): MaxOfferBandSet {
  return {
    conservative: maxPurchaseFlip({
      costs,
      targetProfitCzk,
      scenario: "conservative",
    }),
    base: maxPurchaseFlip({ costs, targetProfitCzk, scenario: "base" }),
    optimistic: maxPurchaseFlip({
      costs,
      targetProfitCzk,
      scenario: "optimistic",
    }),
  };
}
