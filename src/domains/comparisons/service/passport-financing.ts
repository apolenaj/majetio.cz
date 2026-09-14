import { comparisonConfig } from "@/config/comparison";
import {
  Money,
  nominalInterestRateFromPercentPoints,
} from "@/domains/finance";
import { calculateAnnuityPayment } from "@/domains/investment/engine/calculations/financing";

export type PassportFinancingInput = {
  askingPriceCzk: number | null;
  availableEquityCzk: number | null;
  equityPercent: number | null;
  /** Override illustrative rate (pp). */
  interestRatePp?: number | null;
  termYears?: number | null;
};

export type PassportFinancingResult = {
  ltvPct: number | null;
  equityRequiredCzk: number | null;
  loanPrincipalCzk: number | null;
  monthlyPaymentCzk: number | null;
  /** Missing equity vs asking (when passport equity is set); null if unknown. */
  financingGapCzk: number | null;
  usedPassport: boolean;
  note: string;
};

/**
 * Illustrative LTV + annuity from Finanční pas equity (or default LTV).
 * Never invents 0 when asking price is missing.
 */
export function computePassportFinancing(
  input: PassportFinancingInput,
): PassportFinancingResult {
  const cfg = comparisonConfig.illustrativeMortgage;
  const noteBase =
    "Orientační výpočet — nejde o nabídku banky ani posouzení úvěruschopnosti.";

  if (input.askingPriceCzk == null || input.askingPriceCzk <= 0) {
    return {
      ltvPct: null,
      equityRequiredCzk: null,
      loanPrincipalCzk: null,
      monthlyPaymentCzk: null,
      financingGapCzk: null,
      usedPassport: false,
      note: noteBase,
    };
  }

  const price = input.askingPriceCzk;
  let equity: number | null = null;
  let usedPassport = false;
  let availableEquity: number | null = null;

  if (input.availableEquityCzk != null && input.availableEquityCzk >= 0) {
    availableEquity = input.availableEquityCzk;
    equity = Math.min(input.availableEquityCzk, price);
    usedPassport = true;
  } else if (input.equityPercent != null && input.equityPercent >= 0) {
    equity = Math.round((input.equityPercent / 100) * price);
    availableEquity = equity;
    usedPassport = true;
  } else {
    equity = Math.round(price * (1 - cfg.defaultLtvRatio));
  }

  const loan = Math.max(0, price - equity);
  const ltvPct = price > 0 ? (loan / price) * 100 : null;

  const ratePp = input.interestRatePp ?? cfg.interestRatePp;
  const termYears = input.termYears ?? cfg.termYears;

  let monthlyPaymentCzk: number | null = null;
  if (loan > 0) {
    try {
      const result = calculateAnnuityPayment({
        principal: Money.fromMajor(loan, "CZK"),
        nominalInterestRate: nominalInterestRateFromPercentPoints(ratePp),
        termYears,
      });
      monthlyPaymentCzk = Math.round(
        result.monthlyPayment.value.toMajorNumber(),
      );
    } catch {
      monthlyPaymentCzk = null;
    }
  } else {
    monthlyPaymentCzk = 0;
  }

  /** Gap = how much equity is missing for a target 20% equity (or passport target). */
  const targetEquity = Math.round(price * (1 - cfg.defaultLtvRatio));
  let financingGapCzk: number | null = null;
  if (availableEquity != null) {
    financingGapCzk = Math.max(0, targetEquity - availableEquity);
  }

  return {
    ltvPct: ltvPct != null ? Math.round(ltvPct * 10) / 10 : null,
    equityRequiredCzk: equity,
    loanPrincipalCzk: loan,
    monthlyPaymentCzk,
    financingGapCzk,
    usedPassport,
    note: usedPassport
      ? `${noteBase} Použity údaje z Finančního pasu.`
      : `${noteBase} Bez pasu: ilustrativní LTV ${Math.round(cfg.defaultLtvRatio * 100)} %.`,
  };
}
