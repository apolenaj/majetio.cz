import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";

import { calculateRentalDecision } from "@/domains/investment/engine/calculations/rental-decision";

const control = () =>
  calculateRentalDecision({
    purchasePrice: new Decimal(4_000_000),
    acquisitionCosts: new Decimal(100_000),
    renovation: new Decimal(200_000),
    furnishing: new Decimal(0),
    loanAmount: new Decimal(3_000_000),
    annualInterestRate: new Decimal("0.05"),
    termYears: 30,
    monthlyNetRent: new Decimal(20_000),
    occupancy: new Decimal("0.95"),
    annualOwnerOpex: new Decimal(36_000),
    annualCapexReserve: new Decimal(12_000),
  });

describe("calculateRentalDecision control case", () => {
  it("matches the published haléř figures for the synthetic example", () => {
    const result = control();
    expect(result.totalInvestment.toFixed(2)).toBe("4300000.00");
    expect(result.equity.toFixed(2)).toBe("1300000.00");
    expect(result.monthlyPayment?.toFixed(2)).toBe("16104.65");
    expect(result.effectiveAnnualRent.toFixed(2)).toBe("228000.00");
    expect(result.noi.toFixed(2)).toBe("192000.00");
    expect(result.cashFlowBeforeReserve.toFixed(2)).toBe("-1255.78");
    expect(result.disposableAnnualCashFlow.toFixed(2)).toBe("-13255.78");
    expect(result.disposableMonthlyCashFlow.toFixed(2)).toBe("-1104.65");
    expect(result.grossYieldOnPurchase?.mul(100).toFixed(2)).toBe("6.00");
    expect(result.netOperatingYield?.mul(100).toFixed(4)).toBe("4.4651");
    expect(result.cashOnCash?.mul(100).toFixed(4)).toBe("-1.0197");
    expect(result.dscr?.toFixed(4)).toBe("0.9935");
    expect(result.breakEvenMonthlyRent?.toFixed(2)).toBe("21162.79");
  });

  it("treats a zero rate as principal divided by months", () => {
    const result = calculateRentalDecision({
      purchasePrice: new Decimal(1_200_000),
      acquisitionCosts: new Decimal(0),
      renovation: new Decimal(0),
      furnishing: new Decimal(0),
      loanAmount: new Decimal(1_200_000),
      annualInterestRate: new Decimal(0),
      termYears: 10,
      monthlyNetRent: new Decimal(10_000),
      occupancy: new Decimal(1),
      annualOwnerOpex: new Decimal(0),
      annualCapexReserve: new Decimal(0),
    });
    expect(result.monthlyPayment?.toFixed(2)).toBe("10000.00");
    expect(result.dscr?.toFixed(2)).toBe("1.00");
    expect(result.cashOnCash).toBeNull();
  });

  it("matches the Vysočany model checked in the browser", () => {
    const result = calculateRentalDecision({
      purchasePrice: new Decimal(6_500_000),
      acquisitionCosts: new Decimal(100_000),
      renovation: new Decimal(0),
      furnishing: new Decimal(0),
      loanAmount: new Decimal(4_550_000),
      annualInterestRate: new Decimal("0.05"),
      termYears: 30,
      monthlyNetRent: new Decimal(25_000),
      occupancy: new Decimal("0.95"),
      annualOwnerOpex: new Decimal(36_000),
      annualCapexReserve: new Decimal(12_000),
    });
    expect(result.totalInvestment.toFixed(2)).toBe("6600000.00");
    expect(result.equity.toFixed(2)).toBe("2050000.00");
    expect(result.monthlyPayment?.toFixed(2)).toBe("24425.38");
    expect(result.noi.toFixed(2)).toBe("249000.00");
    expect(result.disposableMonthlyCashFlow.toFixed(2)).toBe("-4675.38");
    expect(result.cashOnCash?.mul(100).toFixed(4)).toBe("-2.7368");
  });

  it("does not invent infinity when there is no loan", () => {
    const result = calculateRentalDecision({
      purchasePrice: new Decimal(1_000_000),
      acquisitionCosts: new Decimal(0),
      renovation: new Decimal(0),
      furnishing: new Decimal(0),
      loanAmount: new Decimal(0),
      annualInterestRate: new Decimal("0.05"),
      termYears: 30,
      monthlyNetRent: new Decimal(8_000),
      occupancy: new Decimal(1),
      annualOwnerOpex: new Decimal(12_000),
      annualCapexReserve: new Decimal(0),
    });
    expect(result.monthlyPayment).toBeNull();
    expect(result.dscr).toBeNull();
    expect(result.disposableAnnualCashFlow.toFixed(2)).toBe("84000.00");
  });
});
