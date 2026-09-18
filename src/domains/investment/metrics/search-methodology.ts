/**
 * Search UI copy for investment metrics.
 * Formulas live only in the engine registry — this module does not reimplement them.
 */

import { getFormula } from "@/domains/investment/engine/formulas/registry";

export const SEARCH_FORMULA_KEYS = {
  grossYield: "gross_yield",
  netYield: "net_yield",
  cashflow: "monthly_cash_flow",
  cashOnCash: "cash_on_cash",
  payback: "payback_period",
  allIn: "total_acquisition_cost",
} as const;

export function formulaTooltip(key: string): string {
  const formula = getFormula(key);
  if (!formula) return "Metodika této metriky není v registru.";
  return `${formula.name}: ${formula.formulaText}. ${formula.description}`;
}
