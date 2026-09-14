/**
 * Flip scenario — short hold, gross profit and cost margin.
 */

import { Money, Percentage } from "@/domains/finance";

import { requireFormula } from "../formulas/registry";
import { calculateNetSaleProceeds } from "../calculations/exit";
import {
  buildEquityCashFlowSeries,
  calculateEquityMultiple,
  calculateIrr,
  calculatePaybackPeriod,
} from "../calculations/returns";
import { bindFormula } from "../calculations/helpers";
import type { FlipScenarioResult } from "./types";

export type FlipScenarioInput = {
  /** Holding period in months (typically 3–24). */
  holdMonths: number;
  purchasePrice: Money;
  acquisitionCosts?: Money | null;
  renovationCapex: Money;
  /** Holding costs during flip (interest, utilities, taxes) — total for period. */
  holdingCosts?: Money | null;
  sellingCosts?: Money | null;
  sellingCostRate?: Percentage | null;
  salePrice: Money;
  /** Outstanding loan at sale (0 for cash flip). */
  outstandingLoanBalance?: Money | null;
};

export function calculateFlipScenario(
  input: FlipScenarioInput,
): FlipScenarioResult {
  if (!Number.isInteger(input.holdMonths) || input.holdMonths < 1) {
    throw new Error("holdMonths must be a positive integer");
  }

  const currency = input.purchasePrice.currency;
  const acquisitionCosts = input.acquisitionCosts ?? Money.zero(currency);
  const holdingCosts = input.holdingCosts ?? Money.zero(currency);
  const loanBal = input.outstandingLoanBalance ?? Money.zero(currency);

  const totalFlipCost = input.purchasePrice
    .add(acquisitionCosts)
    .add(input.renovationCapex)
    .add(holdingCosts)
    .roundForDisplay();

  const exit = calculateNetSaleProceeds({
    salePrice: input.salePrice,
    sellingCosts: input.sellingCosts,
    sellingCostRate: input.sellingCostRate ?? Percentage.fromPercentPoints(3),
    outstandingLoanBalance: loanBal,
  });

  // Gross profit vs all-in cost (before financing): sale − selling costs − totalFlipCost
  // Using sale price net of selling costs but before loan paydown for "gross" deal profit,
  // then equity CF uses net sale proceeds.
  const saleNetOfSelling = input.salePrice.sub(exit.sellingCosts).roundForDisplay();
  const grossProfit = saleNetOfSelling.sub(totalFlipCost).roundForDisplay();
  void requireFormula("flip_gross_profit");
  void bindFormula("flip_gross_profit", grossProfit);

  if (totalFlipCost.isZero()) {
    throw new Error("totalFlipCost must be > 0");
  }
  const costMargin = Percentage.fromRatio(
    grossProfit.major.div(totalFlipCost.major),
  );
  void bindFormula("flip_cost_margin", costMargin);

  // Equity outlay ≈ totalFlipCost − loan used at purchase; for simplicity
  // equity = totalFlipCost − (sale loan balance is exit; assume purchase was cash+capex)
  // If loan outstanding at exit equals purchase financing still owed:
  const equityOutlay = totalFlipCost.sub(
    // Approximate: if loan remains at exit, initial equity was cost − that loan's original
    // For flip we treat equity = totalFlipCost − outstandingLoanBalance as residual equity in deal
    // Better: equity = totalFlipCost when cash; when financed, caller passes loan and we use
    // equity = totalFlipCost - loanBal only if loan funded purchase (same balance if interest-only).
    loanBal.isZero() ? Money.zero(currency) : loanBal,
  );
  // If loanBal > totalFlipCost this goes negative — clamp by using max(cost - loan, 0) semantics via Money
  const equityRequired = equityOutlay.isNegative()
    ? Money.zero(currency)
    : equityOutlay.roundForDisplay();

  // Single-period CF: t=0 −equity, t=1 (holdYears≈ holdMonths/12) net proceeds
  // Use fractional year as 1 period for short flips for IRR stability
  const series = buildEquityCashFlowSeries(equityRequired, [
    exit.netSaleProceeds.value,
  ]);

  return {
    kind: "flip",
    holdMonths: input.holdMonths,
    equityRequired,
    totalFlipCost,
    salePrice: input.salePrice.roundForDisplay(),
    grossProfit,
    costMargin,
    netSaleProceeds: exit.netSaleProceeds.value,
    returns: {
      irr: calculateIrr(series),
      equityMultiple: calculateEquityMultiple(series),
      payback: calculatePaybackPeriod(series),
    },
  };
}
