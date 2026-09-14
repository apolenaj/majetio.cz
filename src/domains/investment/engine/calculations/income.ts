/**
 * Potential / effective gross income and vacancy loss (pure).
 */

import { type Money, Percentage } from "@/domains/finance";

import {
  annualFromMonthly,
  bindFormula,
  type FormulaBound,
} from "./helpers";

export type GrossIncomeInput = {
  /** Prefer annual if both set — must be same currency. */
  monthlyRent?: Money | null;
  annualRent?: Money | null;
  /** Ratio, e.g. 0.05 = 5 % vacancy. Null → treat as 0 loss (full occupancy). */
  vacancyRate?: Percentage | null;
};

export type GrossIncomeResult = {
  potentialGrossIncome: FormulaBound<Money>;
  vacancyLoss: FormulaBound<Money>;
  effectiveGrossIncome: FormulaBound<Money>;
  vacancyRateApplied: Percentage;
};

function resolvePgi(input: GrossIncomeInput): Money {
  if (input.annualRent != null) {
    if (
      input.monthlyRent != null &&
      input.annualRent.currency !== input.monthlyRent.currency
    ) {
      throw new Error("monthlyRent and annualRent currency mismatch");
    }
    return input.annualRent.roundForDisplay();
  }
  if (input.monthlyRent != null) {
    return annualFromMonthly(input.monthlyRent);
  }
  throw new Error("PGI requires monthlyRent or annualRent");
}

/**
 * PGI → Vacancy Loss → EGI.
 * Missing vacancy rate ⇒ 0 % (no loss), not an error.
 */
export function calculateGrossIncome(input: GrossIncomeInput): GrossIncomeResult {
  const pgi = resolvePgi(input);
  const vacancy = input.vacancyRate ?? Percentage.zero();
  if (vacancy.toRatio().lt(0) || vacancy.toRatio().gt(1)) {
    throw new Error("vacancyRate must be between 0 and 1 (ratio)");
  }

  const loss = pgi.mulRatio(vacancy.toRatio()).roundForDisplay();
  const egi = pgi.sub(loss).roundForDisplay();

  return {
    potentialGrossIncome: bindFormula("potential_gross_income", pgi),
    vacancyLoss: bindFormula("vacancy_loss", loss),
    effectiveGrossIncome: bindFormula("effective_gross_income", egi),
    vacancyRateApplied: vacancy,
  };
}
