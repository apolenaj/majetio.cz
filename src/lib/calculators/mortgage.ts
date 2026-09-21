import { isFiniteNumber, nonNegative } from "./common";
import type { CalculationIssue } from "./types";

export type MortgageYearRow = {
  year: number;
  principalPaid: number;
  interestPaid: number;
  balance: number;
};

export type MortgageResult = {
  monthlyPayment: number | null;
  annualDebtService: number | null;
  totalPaid: number | null;
  totalInterest: number | null;
  termMonths: number;
  schedule: MortgageYearRow[];
  issues: CalculationIssue[];
};

/**
 * Standard annuity. Zero rate → principal / n.
 * No intermediate rounding — display layer rounds.
 */
export function calculateMortgage(input: {
  principal: number;
  annualInterestRate: number;
  years: number;
}): MortgageResult {
  const issues: CalculationIssue[] = [];
  const principal = input.principal;
  const years = input.years;
  const rate = input.annualInterestRate;

  if (!isFiniteNumber(principal) || principal < 0) {
    issues.push({ code: "principal", message: "Jistina musí být nezáporné číslo." });
    return emptyMortgage(issues);
  }
  if (!isFiniteNumber(rate) || rate < 0) {
    issues.push({ code: "rate", message: "Úroková sazba nemůže být záporná." });
    return emptyMortgage(issues);
  }
  if (!isFiniteNumber(years) || years <= 0 || !Number.isInteger(years)) {
    if (principal === 0) {
      return {
        monthlyPayment: 0,
        annualDebtService: 0,
        totalPaid: 0,
        totalInterest: 0,
        termMonths: 0,
        schedule: [],
        issues,
      };
    }
    issues.push({
      code: "years",
      message: "Doba splatnosti musí být celé číslo alespoň 1.",
    });
    return emptyMortgage(issues);
  }

  if (principal === 0) {
    return {
      monthlyPayment: 0,
      annualDebtService: 0,
      totalPaid: 0,
      totalInterest: 0,
      termMonths: years * 12,
      schedule: [],
      issues,
    };
  }

  const n = years * 12;
  const monthlyRate = rate / 100 / 12;
  const payment =
    monthlyRate === 0
      ? principal / n
      : (principal * monthlyRate * (1 + monthlyRate) ** n) /
        ((1 + monthlyRate) ** n - 1);

  if (!Number.isFinite(payment)) {
    issues.push({ code: "payment", message: "Splátku se nepodařilo spočítat." });
    return emptyMortgage(issues);
  }

  const schedule = buildYearlySchedule(principal, monthlyRate, payment, years);
  const totalPaid = payment * n;
  return {
    monthlyPayment: payment,
    annualDebtService: payment * 12,
    totalPaid,
    totalInterest: totalPaid - principal,
    termMonths: n,
    schedule,
    issues,
  };
}

function buildYearlySchedule(
  principal: number,
  monthlyRate: number,
  payment: number,
  years: number,
): MortgageYearRow[] {
  let balance = principal;
  const rows: MortgageYearRow[] = [];
  for (let year = 1; year <= years; year += 1) {
    let principalPaid = 0;
    let interestPaid = 0;
    for (let month = 0; month < 12; month += 1) {
      if (balance <= 0) break;
      const interest = balance * monthlyRate;
      const principalPart = Math.min(balance, payment - interest);
      interestPaid += interest;
      principalPaid += principalPart;
      balance = Math.max(0, balance - principalPart);
    }
    rows.push({ year, principalPaid, interestPaid, balance });
  }
  return rows;
}

function emptyMortgage(issues: CalculationIssue[]): MortgageResult {
  return {
    monthlyPayment: null,
    annualDebtService: null,
    totalPaid: null,
    totalInterest: null,
    termMonths: 0,
    schedule: [],
    issues,
  };
}

export function remainingBalanceAfterYears(
  mortgage: MortgageResult,
  years: number,
): number | null {
  if (mortgage.monthlyPayment == null) return null;
  const capped = Math.max(0, Math.floor(years));
  if (capped === 0) return nonNegative(mortgage.schedule[0]?.balance ?? 0);
  const row = mortgage.schedule.find((item) => item.year === capped);
  if (row) return row.balance;
  const last = mortgage.schedule[mortgage.schedule.length - 1];
  return last ? last.balance : 0;
}
