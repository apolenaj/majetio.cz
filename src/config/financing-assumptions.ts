/**
 * Central financing assumptions for public Majetio UI.
 * Prefer ASSUMPTION_CONFIG; never hardcode rates inside components.
 */

import { ASSUMPTION_CONFIG_V2026_07 } from "@/config/investment-assumptions";

export const FINANCING_ASSUMPTIONS = {
  referenceMortgageRatePp: ASSUMPTION_CONFIG_V2026_07.defaults.interestRatePp,
  defaultEquityShare: 0.2,
  defaultTermYears: ASSUMPTION_CONFIG_V2026_07.defaults.termYears,
  lastUpdated: ASSUMPTION_CONFIG_V2026_07.effectiveFrom.slice(0, 10),
  sourceLabel: "Referenční sazba Majetio (assumption config)",
  disclaimerCs:
    "Výpočet je orientační. Konkrétní sazba, výše úvěru a schválení financování závisí na podmínkách poskytovatele a situaci žadatele.",
  foreignDisclaimerCs:
    "Financování zahraniční nemovitosti se může lišit podle země, typu nemovitosti, rezidence kupujícího a způsobu zajištění. Nejde o příslib české hypotéky.",
} as const;

export type FinancingScenarioInput = {
  propertyPriceCzk: number;
  ownFundsCzk?: number | null;
  annualInterestRatePp?: number | null;
  termYears?: number | null;
};

export function resolveFinancingInputs(input: FinancingScenarioInput) {
  const price = Number.isFinite(input.propertyPriceCzk)
    ? Math.max(0, input.propertyPriceCzk)
    : 0;
  const equityShare = FINANCING_ASSUMPTIONS.defaultEquityShare;
  const ownFunds =
    input.ownFundsCzk != null && Number.isFinite(input.ownFundsCzk)
      ? Math.max(0, input.ownFundsCzk)
      : Math.round(price * equityShare);
  const rate =
    input.annualInterestRatePp != null && Number.isFinite(input.annualInterestRatePp)
      ? Math.max(0, input.annualInterestRatePp)
      : FINANCING_ASSUMPTIONS.referenceMortgageRatePp;
  const years =
    input.termYears != null && Number.isFinite(input.termYears) && input.termYears > 0
      ? Math.round(input.termYears)
      : FINANCING_ASSUMPTIONS.defaultTermYears;
  const loanAmount = Math.max(0, price - ownFunds);
  const ltvPct = price > 0 ? (loanAmount / price) * 100 : null;

  return {
    propertyPriceCzk: price,
    ownFundsCzk: ownFunds,
    loanAmountCzk: loanAmount,
    annualInterestRatePp: rate,
    termYears: years,
    ltvPct,
  };
}
