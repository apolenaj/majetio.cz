import { buildIncomeStatement } from "./income";
import { annualOperatingCosts, nonNegative, vacancyRatio } from "./common";
import { calculateMortgage } from "./mortgage";
import type { CalculationIssue, PropertyInvestmentInput } from "./types";

export type MaxOfferYieldResult = {
  effectiveAnnualIncome: number;
  annualNoi: number;
  maximumTotalInvestment: number | null;
  maximumPurchasePrice: number | null;
  message: string | null;
  issues: CalculationIssue[];
};

export function calculateMaxOfferByYield(
  input: PropertyInvestmentInput,
  targetNetYieldPct: number,
): MaxOfferYieldResult {
  const issues: CalculationIssue[] = [];
  const vacancy = vacancyRatio(input);
  const effectiveAnnualIncome =
    nonNegative(input.monthlyRent) * 12 * (1 - vacancy) +
    nonNegative(input.otherMonthlyIncome) * 12;
  const noi = effectiveAnnualIncome - annualOperatingCosts(input);

  if (!Number.isFinite(targetNetYieldPct) || targetNetYieldPct <= 0) {
    issues.push({
      code: "target_yield",
      message: "Cílový čistý výnos musí být větší než 0 %.",
    });
    return {
      effectiveAnnualIncome,
      annualNoi: noi,
      maximumTotalInvestment: null,
      maximumPurchasePrice: null,
      message: "Cílový výnos musí být kladný, jinak maximální cenu nelze odvodit.",
      issues,
    };
  }

  if (noi <= 0) {
    return {
      effectiveAnnualIncome,
      annualNoi: noi,
      maximumTotalInvestment: null,
      maximumPurchasePrice: null,
      message:
        "NOI není kladné — při těchto nákladech a nájmu modelová kupní cena nevychází.",
      issues,
    };
  }

  const maximumTotalInvestment = noi / (targetNetYieldPct / 100);
  const maximumPurchasePrice =
    maximumTotalInvestment -
    nonNegative(input.renovationCost) -
    nonNegative(input.acquisitionCosts) -
    nonNegative(input.initialReserve);

  if (maximumPurchasePrice <= 0) {
    return {
      effectiveAnnualIncome,
      annualNoi: noi,
      maximumTotalInvestment,
      maximumPurchasePrice: null,
      message:
        "Vedlejší náklady (rekonstrukce, koupě, rezerva) převyšují investici, která splní cílový výnos.",
      issues,
    };
  }

  return {
    effectiveAnnualIncome,
    annualNoi: noi,
    maximumTotalInvestment,
    maximumPurchasePrice,
    message: null,
    issues,
  };
}

export type MaxOfferCashFlowResult = {
  maximumPurchasePrice: number | null;
  achievedMonthlyCashFlow: number | null;
  message: string | null;
};

/**
 * Binary search of purchase price so monthly cash flow meets the target.
 * Loan = max(0, price − ownCapital). Side costs stay fixed.
 */
export function calculateMaxOfferByCashFlow(
  input: PropertyInvestmentInput,
  targetMonthlyCashFlow: number,
): MaxOfferCashFlowResult {
  if (!Number.isFinite(targetMonthlyCashFlow)) {
    return {
      maximumPurchasePrice: null,
      achievedMonthlyCashFlow: null,
      message: "Zadejte požadované měsíční cash flow.",
    };
  }

  const lowBound = 0;
  const highBound = 250_000_000;
  const cashFlowAt = (price: number) => {
    const loan = Math.max(0, price - nonNegative(input.ownCapital));
    const statement = buildIncomeStatement({
      ...input,
      purchasePrice: price,
      loanAmount: loan,
    });
    return statement.monthlyCashFlow;
  };

  const atZero = cashFlowAt(0);
  if (atZero == null) {
    return {
      maximumPurchasePrice: null,
      achievedMonthlyCashFlow: null,
      message: "Cash flow nelze spočítat — zkontrolujte sazbu a splatnost.",
    };
  }
  if (atZero < targetMonthlyCashFlow) {
    return {
      maximumPurchasePrice: null,
      achievedMonthlyCashFlow: atZero,
      message:
        "Ani při nulové kupní ceně model nedosáhne požadované cash flow. Upravte nájem, náklady nebo financování.",
    };
  }

  let low = lowBound;
  let high = highBound;
  for (let i = 0; i < 60; i += 1) {
    const mid = (low + high) / 2;
    const cf = cashFlowAt(mid);
    if (cf == null) {
      high = mid;
      continue;
    }
    if (cf >= targetMonthlyCashFlow) low = mid;
    else high = mid;
  }

  const price = low;
  return {
    maximumPurchasePrice: price,
    achievedMonthlyCashFlow: cashFlowAt(price),
    message:
      highBound - price < 1
        ? "Hledání narazilo na horní limit modelu."
        : null,
  };
}

export function offerGap(askingPrice: number, modelPrice: number | null) {
  if (modelPrice == null || !Number.isFinite(askingPrice) || askingPrice <= 0) {
    return { delta: null as number | null, deltaPct: null as number | null };
  }
  const delta = modelPrice - askingPrice;
  return { delta, deltaPct: (delta / askingPrice) * 100 };
}

/** Kept so financing math stays referenced by the cash-flow search path. */
export function debtServiceForPrice(
  input: PropertyInvestmentInput,
  purchasePrice: number,
): number | null {
  const loan = Math.max(0, purchasePrice - nonNegative(input.ownCapital));
  return calculateMortgage({
    principal: loan,
    annualInterestRate: nonNegative(input.annualInterestRate),
    years: Math.max(1, Math.round(input.loanYears)),
  }).monthlyPayment;
}
