/**
 * Metric status helpers — never invent 0 for N/A or missing.
 */

import type { FormulaKey } from "../formulas/registry";
import type { CalculationMetric } from "../schemas/result";

export function notApplicableMoneyMetric(
  formulaKey: FormulaKey,
  reason: string,
): CalculationMetric {
  return {
    kind: "money",
    formulaKey,
    status: "not_applicable",
    value: null,
    statusReason: reason,
  };
}

export function notApplicableRatioMetric(
  formulaKey: FormulaKey,
  reason: string,
): CalculationMetric {
  return {
    kind: "ratio",
    formulaKey,
    status: "not_applicable",
    value: null,
    statusReason: reason,
  };
}

export function errorMoneyMetric(
  formulaKey: FormulaKey,
  reason: string,
): CalculationMetric {
  return {
    kind: "money",
    formulaKey,
    status: "error",
    value: null,
    statusReason: reason,
  };
}

export function errorRatioMetric(
  formulaKey: FormulaKey,
  reason: string,
): CalculationMetric {
  return {
    kind: "ratio",
    formulaKey,
    status: "error",
    value: null,
    statusReason: reason,
  };
}
