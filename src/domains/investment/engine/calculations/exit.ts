/**
 * Exit / net sale proceeds (pure).
 */

import { Money, type Percentage } from "@/domains/finance";

import { bindFormula, type FormulaBound } from "./helpers";
import { growMoneyAnnual } from "./amortization";

export type NetSaleProceedsInput = {
  salePrice: Money;
  /** Absolute selling costs, or null to derive from salePrice × sellingCostRate. */
  sellingCosts?: Money | null;
  /** Ratio of sale price (e.g. 0.03 = 3 % commission). Used if sellingCosts omitted. */
  sellingCostRate?: Percentage | null;
  outstandingLoanBalance: Money;
};

export type NetSaleProceedsResult = {
  salePrice: Money;
  sellingCosts: Money;
  outstandingLoanBalance: Money;
  netSaleProceeds: FormulaBound<Money>;
};

export function calculateNetSaleProceeds(
  input: NetSaleProceedsInput,
): NetSaleProceedsResult {
  const currency = input.salePrice.currency;
  if (input.outstandingLoanBalance.currency !== currency) {
    throw new Error("loan balance currency mismatch");
  }

  let sellingCosts: Money;
  if (input.sellingCosts != null) {
    sellingCosts = input.sellingCosts;
  } else if (input.sellingCostRate != null) {
    sellingCosts = input.salePrice
      .mulRatio(input.sellingCostRate.toRatio())
      .roundForDisplay();
  } else {
    sellingCosts = Money.zero(currency);
  }

  const net = input.salePrice
    .sub(sellingCosts)
    .sub(input.outstandingLoanBalance)
    .roundForDisplay();

  return {
    salePrice: input.salePrice.roundForDisplay(),
    sellingCosts,
    outstandingLoanBalance: input.outstandingLoanBalance.roundForDisplay(),
    netSaleProceeds: bindFormula("net_sale_proceeds", net),
  };
}

/** Sale price from initial value × (1+appreciation)^holdYears */
export function projectSalePrice(input: {
  initialPropertyValue: Money;
  appreciationRate: Percentage;
  holdYears: number;
}): Money {
  return growMoneyAnnual(
    input.initialPropertyValue,
    input.appreciationRate,
    input.holdYears,
  );
}
