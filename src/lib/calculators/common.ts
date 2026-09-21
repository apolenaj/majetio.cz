import type { CalculationIssue, PropertyInvestmentInput } from "./types";

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function nonNegative(value: number): number {
  if (!isFiniteNumber(value) || value < 0) return 0;
  return value;
}

export function clamp(value: number, min: number, max: number): number {
  if (!isFiniteNumber(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function safeDivide(numerator: number, denominator: number): number | null {
  if (!isFiniteNumber(numerator) || !isFiniteNumber(denominator) || denominator === 0) {
    return null;
  }
  const result = numerator / denominator;
  return Number.isFinite(result) ? result : null;
}

export function resolvedLoan(input: PropertyInvestmentInput): number {
  if (input.loanAmount != null && isFiniteNumber(input.loanAmount)) {
    return nonNegative(input.loanAmount);
  }
  return Math.max(0, nonNegative(input.purchasePrice) - nonNegative(input.ownCapital));
}

/** Monthly owner operating costs. Itemized mode replaces the lump sum. */
export function monthlyOperatingCosts(input: PropertyInvestmentInput): number {
  if (!input.useItemizedOpex) {
    return nonNegative(input.monthlyOperatingLump);
  }
  const monthlyLines =
    nonNegative(input.monthlyHOA) +
    nonNegative(input.maintenanceMonthly) +
    nonNegative(input.insuranceMonthly) +
    nonNegative(input.managementMonthly) +
    nonNegative(input.otherOperatingMonthly);
  const annualSpread =
    (nonNegative(input.annualPropertyTax) + nonNegative(input.annualOtherCosts)) / 12;
  return monthlyLines + annualSpread;
}

export function annualOperatingCosts(input: PropertyInvestmentInput): number {
  return monthlyOperatingCosts(input) * 12;
}

export function vacancyRatio(input: PropertyInvestmentInput): number {
  return clamp(input.vacancyRate, 0, 100) / 100;
}

export function collectInputIssues(input: PropertyInvestmentInput): CalculationIssue[] {
  const issues: CalculationIssue[] = [];
  if (!isFiniteNumber(input.purchasePrice) || input.purchasePrice < 0) {
    issues.push({ code: "purchase_price", message: "Kupní cena musí být nezáporné číslo." });
  }
  if (!isFiniteNumber(input.vacancyRate) || input.vacancyRate < 0 || input.vacancyRate > 100) {
    issues.push({ code: "vacancy", message: "Vacancy musí být mezi 0 a 100 %." });
  }
  if (!isFiniteNumber(input.annualInterestRate) || input.annualInterestRate < 0) {
    issues.push({ code: "rate", message: "Úroková sazba nemůže být záporná." });
  }
  if (!isFiniteNumber(input.loanYears) || input.loanYears < 0) {
    issues.push({ code: "years", message: "Doba splatnosti nemůže být záporná." });
  }
  if (resolvedLoan(input) > 0 && input.loanYears <= 0) {
    issues.push({
      code: "loan_years",
      message: "U úvěru zadejte dobu splatnosti alespoň 1 rok.",
    });
  }
  return issues;
}

export function totalAcquisitionCost(input: PropertyInvestmentInput): number {
  return (
    nonNegative(input.purchasePrice) +
    nonNegative(input.acquisitionCosts) +
    nonNegative(input.renovationCost) +
    nonNegative(input.initialReserve)
  );
}

export function initialCashInvested(input: PropertyInvestmentInput): number {
  return (
    nonNegative(input.ownCapital) +
    nonNegative(input.acquisitionCosts) +
    nonNegative(input.renovationCost) +
    nonNegative(input.initialReserve)
  );
}
