/**
 * Mortgage annuity + debt service + DSCR (pure, no DB).
 * Payment uses **nominal** interest only — APR/RPSN is disclosure, not an input to the annuity.
 */

import {
  Money,
  type NominalInterestRate,
  type AprRate,
  type CurrencyCode,
} from "@/domains/finance";

import { bindFormula, type FormulaBound } from "./helpers";

export type AnnuityPaymentInput = {
  principal: Money;
  /** Nominal annual interest rate (ratio inside TypedRate). */
  nominalInterestRate: NominalInterestRate;
  termYears: number;
  /**
   * Optional APR / RPSN — never used for payment math; echoed for transparency.
   */
  apr?: AprRate | null;
};

export type AnnuityPaymentResult = {
  monthlyPayment: FormulaBound<Money>;
  monthlyDebtService: FormulaBound<Money>;
  annualDebtService: FormulaBound<Money>;
  /** Echoed APR for UI — null if not provided. */
  apr: AprRate | null;
  /** Nominal rate used for the annuity. */
  nominalInterestRate: NominalInterestRate;
  termMonths: number;
  zeroInterest: boolean;
};

/**
 * Standard annuity (constant payment) mortgage installment.
 * r = 0 → principal / n (no floating-point loop).
 */
export function calculateAnnuityPayment(
  input: AnnuityPaymentInput,
): AnnuityPaymentResult {
  const { principal, nominalInterestRate, termYears } = input;
  if (termYears <= 0 || !Number.isFinite(termYears)) {
    throw new Error("termYears must be a positive finite number");
  }
  if (principal.isNegative()) {
    throw new Error("loan principal must not be negative");
  }

  const termMonths = Math.round(termYears * 12);
  if (termMonths <= 0) {
    throw new Error("term must resolve to at least 1 month");
  }

  const annualRatio = nominalInterestRate.toRatio();
  // Negative nominal rates are mathematically supported (Part 2/C);
  // UI should surface a ResultWarning — do not throw here.
  const monthlyRate = annualRatio.div(12);
  const zeroInterest = monthlyRate.isZero();

  let monthly: Money;
  if (zeroInterest) {
    monthly = Money.fromMajor(
      principal.major.div(termMonths),
      principal.currency,
    ).roundForDisplay();
  } else if (monthlyRate.lt(0)) {
    // Same annuity formula with negative r (payment < principal/n).
    const onePlus = monthlyRate.plus(1);
    if (onePlus.lte(0)) {
      throw new Error(
        "nominal interest rate too negative for annuity formula (1+r/12 ≤ 0)",
      );
    }
    const factor = onePlus.pow(termMonths);
    const paymentMajor = principal.major
      .mul(monthlyRate)
      .mul(factor)
      .div(factor.minus(1));
    monthly = Money.fromMajor(paymentMajor, principal.currency).roundForDisplay();
  } else {
    // M = P * r(1+r)^n / ((1+r)^n - 1)
    const onePlus = monthlyRate.plus(1);
    const factor = onePlus.pow(termMonths);
    const paymentMajor = principal.major
      .mul(monthlyRate)
      .mul(factor)
      .div(factor.minus(1));
    monthly = Money.fromMajor(paymentMajor, principal.currency).roundForDisplay();
  }

  const monthlyBound = bindFormula("annuity_payment", monthly);
  const monthlyDs = bindFormula("monthly_debt_service", monthly);
  const annual = monthly.mul(12).roundForDisplay();
  const annualDs = bindFormula("annual_debt_service", annual);

  return {
    monthlyPayment: monthlyBound,
    monthlyDebtService: monthlyDs,
    annualDebtService: annualDs,
    apr: input.apr ?? null,
    nominalInterestRate,
    termMonths,
    zeroInterest,
  };
}

export type DscrInput = {
  noi: Money;
  annualDebtService: Money;
};

export type DscrResult = FormulaBound<number | null> & {
  /** True when ADS is zero — DSCR undefined. */
  undefinedReason: string | null;
};

/**
 * DSCR = NOI / Annual Debt Service.
 * Returns null value when debt service is zero (undefined ratio).
 */
export function calculateDscr(input: DscrInput): DscrResult {
  if (input.noi.currency !== input.annualDebtService.currency) {
    throw new Error("NOI and debt service currency mismatch");
  }
  if (input.annualDebtService.isZero()) {
    return {
      ...bindFormula("dscr", null),
      undefinedReason: "Roční debt service je 0 — DSCR není definován",
    };
  }
  const ratio = input.noi.major
    .div(input.annualDebtService.major)
    .toDecimalPlaces(6)
    .toNumber();
  return {
    ...bindFormula("dscr", ratio),
    undefinedReason: null,
  };
}

/** Convenience: annual debt service from monthly payment money. */
export function annualDebtServiceFromMonthly(
  monthly: Money,
): FormulaBound<Money> {
  return bindFormula(
    "annual_debt_service",
    monthly.mul(12).roundForDisplay(),
  );
}

export type { CurrencyCode };
