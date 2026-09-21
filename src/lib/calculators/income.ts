import {
  annualOperatingCosts,
  collectInputIssues,
  initialCashInvested,
  monthlyOperatingCosts,
  nonNegative,
  resolvedLoan,
  safeDivide,
  totalAcquisitionCost,
  vacancyRatio,
} from "./common";
import { calculateMortgage } from "./mortgage";
import type { CalculationIssue, PropertyInvestmentInput } from "./types";

export type IncomeStatement = {
  potentialMonthlyRent: number;
  effectiveMonthlyRent: number;
  vacancyLossMonthly: number;
  otherMonthlyIncome: number;
  monthlyOperatingCosts: number;
  monthlyNoi: number;
  monthlyDebtService: number | null;
  monthlyCashFlow: number | null;
  potentialAnnualRent: number;
  effectiveAnnualIncome: number;
  annualOperatingCosts: number;
  annualNoi: number;
  annualDebtService: number | null;
  annualCashFlow: number | null;
  totalAcquisitionCost: number;
  initialCashInvested: number;
  loanAmount: number;
  grossYieldPct: number | null;
  effectiveGrossYieldPct: number | null;
  netYieldPct: number | null;
  cashOnCashPct: number | null;
  issues: CalculationIssue[];
};

/**
 * Canonical income → opex → NOI → debt service path.
 * All public calculators derive metrics from this statement.
 */
export function buildIncomeStatement(input: PropertyInvestmentInput): IncomeStatement {
  const issues = collectInputIssues(input);
  const potentialMonthlyRent = nonNegative(input.monthlyRent);
  const vacancy = vacancyRatio(input);
  const vacancyLossMonthly = potentialMonthlyRent * vacancy;
  const effectiveMonthlyRent = potentialMonthlyRent - vacancyLossMonthly;
  const otherMonthlyIncome = nonNegative(input.otherMonthlyIncome);
  const opexMonthly = monthlyOperatingCosts(input);
  const monthlyNoi = effectiveMonthlyRent + otherMonthlyIncome - opexMonthly;

  const potentialAnnualRent = potentialMonthlyRent * 12;
  const effectiveAnnualIncome =
    potentialAnnualRent * (1 - vacancy) + otherMonthlyIncome * 12;
  const opexAnnual = annualOperatingCosts(input);
  const annualNoi = effectiveAnnualIncome - opexAnnual;

  const loanAmount = resolvedLoan(input);
  const mortgage = calculateMortgage({
    principal: loanAmount,
    annualInterestRate: nonNegative(input.annualInterestRate),
    years: loanAmount === 0 ? 1 : Math.round(input.loanYears),
  });
  if (loanAmount > 0) issues.push(...mortgage.issues);

  const monthlyDebt = loanAmount === 0 ? 0 : mortgage.monthlyPayment;
  const annualDebt = loanAmount === 0 ? 0 : mortgage.annualDebtService;
  const monthlyCashFlow =
    monthlyDebt == null ? null : monthlyNoi - monthlyDebt;
  const annualCashFlow = annualDebt == null ? null : annualNoi - annualDebt;

  const purchase = nonNegative(input.purchasePrice);
  const tac = totalAcquisitionCost(input);
  const invested = initialCashInvested(input);

  return {
    potentialMonthlyRent,
    effectiveMonthlyRent,
    vacancyLossMonthly,
    otherMonthlyIncome,
    monthlyOperatingCosts: opexMonthly,
    monthlyNoi,
    monthlyDebtService: monthlyDebt,
    monthlyCashFlow,
    potentialAnnualRent,
    effectiveAnnualIncome,
    annualOperatingCosts: opexAnnual,
    annualNoi,
    annualDebtService: annualDebt,
    annualCashFlow,
    totalAcquisitionCost: tac,
    initialCashInvested: invested,
    loanAmount,
    grossYieldPct:
      purchase > 0 ? safeDivide(potentialAnnualRent, purchase)! * 100 : null,
    effectiveGrossYieldPct:
      purchase > 0 ? safeDivide(effectiveAnnualIncome, purchase)! * 100 : null,
    netYieldPct: tac > 0 ? safeDivide(annualNoi, tac)! * 100 : null,
    cashOnCashPct:
      invested > 0 && annualCashFlow != null
        ? safeDivide(annualCashFlow, invested)! * 100
        : null,
    issues,
  };
}
