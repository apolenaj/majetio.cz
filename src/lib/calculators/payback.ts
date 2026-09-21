import { buildIncomeStatement } from "./income";
import { nonNegative, safeDivide } from "./common";
import { calculateMortgage, remainingBalanceAfterYears } from "./mortgage";
import { resolvedLoan } from "./common";
import type { PropertyInvestmentInput } from "./types";

export type PaybackResult = {
  simplePaybackYears: number | null;
  unavailableReason: string | null;
  cumulativeCashFlow: number | null;
  futurePropertyValue: number | null;
  saleCosts: number | null;
  remainingLoan: number | null;
  equityAtSale: number | null;
  totalModelResult: number | null;
};

export function calculatePayback(input: PropertyInvestmentInput): PaybackResult {
  const statement = buildIncomeStatement(input);
  const annual = statement.annualCashFlow;
  const invested = statement.initialCashInvested;

  let simplePaybackYears: number | null = null;
  let unavailableReason: string | null = null;
  if (annual == null) {
    unavailableReason = "Cash flow nelze spočítat — zkontrolujte financování.";
  } else if (annual <= 0) {
    unavailableReason =
      "Při současném cash flow se investice pouze z provozního cash flow nevrací.";
  } else if (invested <= 0) {
    unavailableReason = "Vložený kapitál je nulový — návratnost v letech není definovaná.";
  } else {
    simplePaybackYears = invested / annual;
  }

  const years = Math.max(0, Math.round(input.holdingPeriodYears));
  const hold = projectHold(input, years);

  return {
    simplePaybackYears,
    unavailableReason,
    ...hold,
  };
}

function projectHold(input: PropertyInvestmentInput, years: number) {
  if (years <= 0) {
    return {
      cumulativeCashFlow: null,
      futurePropertyValue: null,
      saleCosts: null,
      remainingLoan: null,
      equityAtSale: null,
      totalModelResult: null,
    };
  }

  const base = buildIncomeStatement(input);
  if (base.annualCashFlow == null || base.monthlyDebtService == null) {
    return {
      cumulativeCashFlow: null,
      futurePropertyValue: null,
      saleCosts: null,
      remainingLoan: null,
      equityAtSale: null,
      totalModelResult: null,
    };
  }

  const rentGrowth = nonNegative(input.rentGrowthRate) / 100;
  const expenseGrowth = nonNegative(input.expenseGrowthRate) / 100;
  let cumulative = 0;
  for (let year = 1; year <= years; year += 1) {
    const income =
      (base.effectiveMonthlyRent + base.otherMonthlyIncome) *
      12 *
      (1 + rentGrowth) ** (year - 1);
    const opex = base.monthlyOperatingCosts * 12 * (1 + expenseGrowth) ** (year - 1);
    const debt = base.annualDebtService ?? 0;
    cumulative += income - opex - debt;
  }

  const futureValue =
    nonNegative(input.purchasePrice) *
    (1 + nonNegative(input.appreciationRate) / 100) ** years;
  const saleCosts = futureValue * (nonNegative(input.saleCostRate) / 100);
  const mortgage = calculateMortgage({
    principal: resolvedLoan(input),
    annualInterestRate: nonNegative(input.annualInterestRate),
    years: Math.max(1, Math.round(input.loanYears)),
  });
  const remaining =
    resolvedLoan(input) === 0
      ? 0
      : (remainingBalanceAfterYears(mortgage, Math.min(years, Math.round(input.loanYears))) ??
        0);
  const equityAtSale = futureValue - saleCosts - remaining;
  const totalModelResult = equityAtSale + cumulative - base.initialCashInvested;

  return {
    cumulativeCashFlow: cumulative,
    futurePropertyValue: futureValue,
    saleCosts,
    remainingLoan: remaining,
    equityAtSale,
    totalModelResult,
  };
}

export function paybackRatio(years: number | null): number | null {
  if (years == null || years <= 0) return null;
  return safeDivide(1, years);
}
