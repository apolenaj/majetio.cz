/**
 * Domain validation + calculation error taxonomy (Part 2/C).
 * Distinguishes invalid_input vs insufficient_data vs numerical_failure vs unsupported_scenario.
 */

import { z } from "zod";

export const CALCULATION_ERROR_CATEGORIES = [
  "invalid_input",
  "insufficient_data",
  "numerical_failure",
  "unsupported_scenario",
] as const;

export type CalculationErrorCategory =
  (typeof CALCULATION_ERROR_CATEGORIES)[number];

export type CalculationIssue = {
  category: CalculationErrorCategory;
  code: string;
  message: string;
  field?: string;
};

export const RESULT_WARNING_CODES = [
  "negative_interest_rate",
  "full_vacancy_stress",
  "ltv_over_100",
  "negative_cash_flow",
  "negative_growth_rate",
  "low_data_confidence",
  "irr_negative",
  "irr_undefined",
  "irr_multiple_roots",
  "pre_tax_only",
] as const;

export type ResultWarningCode = (typeof RESULT_WARNING_CODES)[number];

export type ResultWarning = {
  code: ResultWarningCode;
  severity: "info" | "warning" | "critical";
  message: string;
};

/** UI/engine intent — drives N/A vs insufficient for missing rent. */
export const calculationIntentSchema = z.enum([
  "rental_investment",
  "own_use",
  "flip",
]);

export type CalculationIntent = z.infer<typeof calculationIntentSchema>;

/**
 * Validate core domain constraints before running formulas.
 * Allows negative growth; rejects invalid purchase/term/vacancy/opex signs.
 */
export function validateDomainInputs(input: {
  purchasePriceMajor: number | null | undefined;
  termYears: number | null | undefined;
  vacancyRatio: number | null | undefined;
  /** Annual opex major — null = missing, 0 = explicit zero. */
  annualOpexMajor: number | null | undefined;
  interestRateRatio: number | null | undefined;
  appreciationRatio: number | null | undefined;
  rentGrowthRatio: number | null | undefined;
  loanAmountMajor: number | null | undefined;
}): { ok: true; warnings: ResultWarning[] } | { ok: false; issues: CalculationIssue[] } {
  const issues: CalculationIssue[] = [];
  const warnings: ResultWarning[] = [];

  if (input.purchasePriceMajor == null) {
    issues.push({
      category: "insufficient_data",
      code: "missing_purchase_price",
      message: "Chybí kupní cena",
      field: "purchasePrice",
    });
  } else if (!(input.purchasePriceMajor > 0)) {
    issues.push({
      category: "invalid_input",
      code: "purchase_price_not_positive",
      message: "Kupní cena musí být > 0",
      field: "purchasePrice",
    });
  }

  if (input.termYears != null) {
    if (!Number.isFinite(input.termYears) || input.termYears < 1) {
      issues.push({
        category: "invalid_input",
        code: "term_below_one",
        message: "Splatnost musí být ≥ 1 rok",
        field: "termYears",
      });
    }
  }

  if (input.vacancyRatio != null) {
    if (input.vacancyRatio < 0 || input.vacancyRatio > 1) {
      issues.push({
        category: "invalid_input",
        code: "vacancy_out_of_range",
        message: "Neobsazenost musí být 0–100 %",
        field: "vacancyRate",
      });
    } else if (input.vacancyRatio === 1) {
      warnings.push({
        code: "full_vacancy_stress",
        severity: "warning",
        message:
          "100% neobsazenost — platný stress test; příjem z nájmu je nulový.",
      });
    }
  }

  if (input.annualOpexMajor != null && input.annualOpexMajor < 0) {
    issues.push({
      category: "invalid_input",
      code: "opex_negative",
      message: "Provozní náklady nesmí být záporné",
      field: "annualOperatingCosts",
    });
  }

  if (input.interestRateRatio != null && input.interestRateRatio < 0) {
    warnings.push({
      code: "negative_interest_rate",
      severity: "warning",
      message:
        "Záporná nominální sazba — engine výpočet provede, ověřte vstup.",
    });
  }

  if (
    input.appreciationRatio != null &&
    input.appreciationRatio < 0
  ) {
    warnings.push({
      code: "negative_growth_rate",
      severity: "info",
      message: "Záporný růst hodnoty (pokles cen) je povolený předpoklad.",
    });
  }

  if (input.rentGrowthRatio != null && input.rentGrowthRatio < 0) {
    warnings.push({
      code: "negative_growth_rate",
      severity: "info",
      message: "Záporný růst nájmu je povolený předpoklad.",
    });
  }

  if (input.loanAmountMajor != null && input.loanAmountMajor < 0) {
    issues.push({
      category: "invalid_input",
      code: "loan_negative",
      message: "Výše úvěru nesmí být záporná (0 = cash purchase)",
      field: "loanAmount",
    });
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }
  return { ok: true, warnings };
}

/**
 * Classify loan presence: null = unknown/missing, 0 = explicit cash, >0 = financed.
 */
export function classifyLoanAmount(
  loanMajor: number | null | undefined,
): "missing" | "cash" | "financed" {
  if (loanMajor == null) return "missing";
  if (loanMajor === 0) return "cash";
  return "financed";
}
