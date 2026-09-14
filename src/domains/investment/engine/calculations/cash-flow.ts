/**
 * Cash flow, equity, LTV, cash-on-cash (pure).
 */

import { Money, type Percentage } from "@/domains/finance";

import {
  bindFormula,
  moneyOverMoney,
  monthlyFromAnnual,
  type FormulaBound,
} from "./helpers";

export type CashFlowInput = {
  noi: Money;
  /** Null / omitted → unlevered only (debt service = 0). */
  monthlyDebtService?: Money | null;
};

export type CashFlowResult = {
  monthlyUnlevered: FormulaBound<Money>;
  annualUnlevered: FormulaBound<Money>;
  monthlyLeveraged: FormulaBound<Money>;
  annualLeveraged: FormulaBound<Money>;
};

export function calculateCashFlows(input: CashFlowInput): CashFlowResult {
  const annualUnlevered = input.noi.roundForDisplay();
  const monthlyUnlevered = monthlyFromAnnual(annualUnlevered);

  const monthlyDs =
    input.monthlyDebtService ?? Money.zero(input.noi.currency);
  if (monthlyDs.currency !== input.noi.currency) {
    throw new Error("debt service currency mismatch");
  }

  const monthlyLeveraged = monthlyUnlevered.sub(monthlyDs).roundForDisplay();
  const annualLeveraged = monthlyLeveraged.mul(12).roundForDisplay();

  return {
    monthlyUnlevered: bindFormula(
      "monthly_cash_flow_unlevered",
      monthlyUnlevered,
    ),
    annualUnlevered: bindFormula(
      "annual_cash_flow_unlevered",
      annualUnlevered,
    ),
    monthlyLeveraged: bindFormula("monthly_cash_flow", monthlyLeveraged),
    annualLeveraged: bindFormula(
      "annual_cash_flow_leveraged",
      annualLeveraged,
    ),
  };
}

export type EquityRequiredInput = {
  totalAcquisitionCost: Money;
  loanPrincipal?: Money | null;
};

export function calculateEquityRequired(
  input: EquityRequiredInput,
): FormulaBound<Money> {
  const loan = input.loanPrincipal ?? Money.zero(input.totalAcquisitionCost.currency);
  if (loan.currency !== input.totalAcquisitionCost.currency) {
    throw new Error("loan and TAC currency mismatch");
  }
  const equity = input.totalAcquisitionCost.sub(loan).roundForDisplay();
  return bindFormula("equity_required", equity);
}

export type LtvInput = {
  loanPrincipal: Money;
  propertyValue: Money;
};

export function calculateLtv(input: LtvInput): FormulaBound<Percentage> {
  if (input.propertyValue.isZero()) {
    throw new Error("propertyValue must be > 0 for LTV");
  }
  return bindFormula(
    "ltv",
    moneyOverMoney(input.loanPrincipal, input.propertyValue),
  );
}

export type CashOnCashInput = {
  annualLeveragedCashFlow: Money;
  equityRequired: Money;
};

export function calculateCashOnCash(
  input: CashOnCashInput,
): FormulaBound<Percentage | null> & { undefinedReason: string | null } {
  if (input.equityRequired.isZero()) {
    return {
      ...bindFormula("cash_on_cash", null),
      undefinedReason: "Equity required je 0 — CoC není definován",
    };
  }
  return {
    ...bindFormula(
      "cash_on_cash",
      moneyOverMoney(input.annualLeveragedCashFlow, input.equityRequired),
    ),
    undefinedReason: null,
  };
}
