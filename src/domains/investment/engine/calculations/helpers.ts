/**
 * Shared helpers for pure investment calculations (no I/O).
 */

import { type Money, Percentage, toDecimal } from "@/domains/finance";

import { requireFormula, type FormulaKey } from "../formulas/registry";

export type FormulaBound<T> = {
  formulaKey: FormulaKey;
  formulaVersion: string;
  value: T;
};

export function bindFormula<T>(
  key: FormulaKey,
  value: T,
): FormulaBound<T> {
  const def = requireFormula(key);
  return {
    formulaKey: key,
    formulaVersion: def.formulaVersion,
    value,
  };
}

/** Money ÷ Money → ratio Percentage. */
export function moneyOverMoney(
  numerator: Money,
  denominator: Money,
): Percentage {
  if (denominator.isZero()) {
    throw new Error("Division by zero money denominator");
  }
  return Percentage.fromRatio(numerator.major.div(denominator.major));
}

export function annualFromMonthly(monthly: Money): Money {
  return monthly.mul(12).roundForDisplay();
}

export function monthlyFromAnnual(annual: Money): Money {
  return annual.mul(toDecimal(1).div(12)).roundForDisplay();
}
