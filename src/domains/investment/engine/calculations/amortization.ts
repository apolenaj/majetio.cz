/**
 * Mortgage amortization schedule (pure).
 */

import {
  Money,
  type Percentage,
  type NominalInterestRate,
} from "@/domains/finance";

import { calculateAnnuityPayment } from "./financing";
import { bindFormula, type FormulaBound } from "./helpers";

export type AmortizationRow = {
  month: number;
  payment: Money;
  interest: Money;
  principal: Money;
  balanceAfter: Money;
};

export type AmortizationScheduleInput = {
  principal: Money;
  nominalInterestRate: NominalInterestRate;
  termYears: number;
  /** Optional: stop early (e.g. hold horizon in months). */
  maxMonths?: number;
};

export type AmortizationScheduleResult = {
  schedule: FormulaBound<AmortizationRow[]>;
  monthlyPayment: Money;
  termMonths: number;
  /** Balance after last generated row (0 if fully amortized). */
  endingBalance: Money;
};

/**
 * Build month-by-month amortization using the same annuity payment rule
 * (nominal rate; zero-interest = P / n).
 */
export function buildAmortizationSchedule(
  input: AmortizationScheduleInput,
): AmortizationScheduleResult {
  const annuity = calculateAnnuityPayment({
    principal: input.principal,
    nominalInterestRate: input.nominalInterestRate,
    termYears: input.termYears,
  });

  const payment = annuity.monthlyPayment.value;
  const monthlyRate = input.nominalInterestRate.toRatio().div(12);
  const termMonths = annuity.termMonths;
  const limit = Math.min(termMonths, input.maxMonths ?? termMonths);

  const rows: AmortizationRow[] = [];
  let balance = input.principal;

  for (let month = 1; month <= limit; month++) {
    const interest = Money.fromMajor(
      balance.major.mul(monthlyRate),
      balance.currency,
    );
    let principalPart = payment.sub(interest);
    let actualPayment = payment;

    if (principalPart.major.gte(balance.major) || month === termMonths) {
      principalPart = balance;
      actualPayment = interest.add(principalPart).roundForDisplay();
    }

    if (principalPart.isNegative()) {
      principalPart = Money.zero(balance.currency);
    }

    balance = balance.sub(principalPart);
    if (balance.isNegative()) {
      balance = Money.zero(balance.currency);
    }

    rows.push({
      month,
      payment: actualPayment.roundForDisplay(),
      interest: interest.roundForDisplay(),
      principal: principalPart.roundForDisplay(),
      balanceAfter: balance.roundForDisplay(),
    });

    if (balance.isZero()) break;
  }

  return {
    schedule: bindFormula("amortization_schedule", rows),
    monthlyPayment: payment,
    termMonths,
    endingBalance: balance.roundForDisplay(),
  };
}

/** Outstanding balance after `afterMonths` payments (0 = original principal). */
export function outstandingLoanBalance(
  input: AmortizationScheduleInput & { afterMonths: number },
): Money {
  if (input.afterMonths <= 0) return input.principal.roundForDisplay();
  const schedule = buildAmortizationSchedule({
    ...input,
    maxMonths: input.afterMonths,
  });
  return schedule.endingBalance;
}

/** Compound money by annual growth: V × (1+g)^years */
export function growMoneyAnnual(
  value: Money,
  annualGrowth: Percentage,
  years: number,
): Money {
  if (years <= 0) return value.roundForDisplay();
  const factor = annualGrowth.toRatio().plus(1).pow(years);
  return Money.fromMajor(value.major.mul(factor), value.currency).roundForDisplay();
}
