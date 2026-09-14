/**
 * NOI, yields, and cap rate (pure).
 * Net Yield denominator is always Total Acquisition Cost.
 */

import { type Money, type Percentage } from "@/domains/finance";

import {
  bindFormula,
  moneyOverMoney,
  type FormulaBound,
} from "./helpers";

export type NoiInput = {
  effectiveGrossIncome: Money;
  annualOperatingExpenses: Money;
};

export type NoiResult = FormulaBound<Money>;

/** NOI = EGI − Opex */
export function calculateNoi(input: NoiInput): NoiResult {
  if (input.effectiveGrossIncome.currency !== input.annualOperatingExpenses.currency) {
    throw new Error("EGI and opex currency mismatch");
  }
  const noi = input.effectiveGrossIncome
    .sub(input.annualOperatingExpenses)
    .roundForDisplay();
  return bindFormula("noi", noi);
}

export type YieldInput = {
  /** EGI for gross yield (or PGI if you intentionally skip vacancy). */
  effectiveGrossIncome: Money;
  noi: Money;
  /** Required denominator for Majetio net/gross yield. */
  totalAcquisitionCost: Money;
};

export type YieldResult = {
  grossYield: FormulaBound<Percentage>;
  netYield: FormulaBound<Percentage>;
};

/**
 * Gross Yield = EGI / TAC
 * Net Yield = NOI / TAC  (denominator fixed to Total Acquisition Cost)
 */
export function calculateYields(input: YieldInput): YieldResult {
  if (input.totalAcquisitionCost.isZero()) {
    throw new Error("totalAcquisitionCost must be > 0 for yields");
  }
  return {
    grossYield: bindFormula(
      "gross_yield",
      moneyOverMoney(input.effectiveGrossIncome, input.totalAcquisitionCost),
    ),
    netYield: bindFormula(
      "net_yield",
      moneyOverMoney(input.noi, input.totalAcquisitionCost),
    ),
  };
}

export type CapRateInput = {
  noi: Money;
  /** Market value; default callers should pass TAC when unknown. */
  propertyValue: Money;
};

/** Cap Rate = NOI / Property Value */
export function calculateCapRate(input: CapRateInput): FormulaBound<Percentage> {
  if (input.propertyValue.isZero()) {
    throw new Error("propertyValue must be > 0 for cap rate");
  }
  return bindFormula(
    "cap_rate",
    moneyOverMoney(input.noi, input.propertyValue),
  );
}
