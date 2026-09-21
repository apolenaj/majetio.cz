import { describe, expect, it } from "vitest";

import {
  DEMO_INVESTMENT,
  applyScenario,
  buildIncomeStatement,
  calculateMaxOfferByCashFlow,
  calculateMaxOfferByYield,
  calculateMortgage,
  calculatePayback,
  defaultRenovationSelection,
  estimateRenovation,
} from "./index";

describe("mortgage", () => {
  it("computes a standard annuity", () => {
    const result = calculateMortgage({
      principal: 4_000_000,
      annualInterestRate: 5.25,
      years: 30,
    });
    expect(result.monthlyPayment).toBeCloseTo(22_088.148, 2);
    expect(result.termMonths).toBe(360);
    expect(result.totalInterest).toBeGreaterThan(0);
    expect(result.schedule).toHaveLength(30);
    expect(result.schedule[29]?.balance).toBeCloseTo(0, 0);
  });

  it("uses principal / n at 0 %", () => {
    const result = calculateMortgage({
      principal: 3_600_000,
      annualInterestRate: 0,
      years: 30,
    });
    expect(result.monthlyPayment).toBe(10_000);
    expect(result.totalInterest).toBeCloseTo(0, 6);
  });

  it("returns zero payment for zero principal", () => {
    const result = calculateMortgage({
      principal: 0,
      annualInterestRate: 4.5,
      years: 20,
    });
    expect(result.monthlyPayment).toBe(0);
    expect(result.issues).toHaveLength(0);
  });

  it("rejects invalid years when principal is positive", () => {
    const result = calculateMortgage({
      principal: 1_000_000,
      annualInterestRate: 4,
      years: 0,
    });
    expect(result.monthlyPayment).toBeNull();
    expect(result.issues.some((issue) => issue.code === "years")).toBe(true);
  });
});

describe("yields and cash flow", () => {
  it("locks the demo control case", () => {
    const statement = buildIncomeStatement(DEMO_INVESTMENT);
    expect(statement.annualNoi).toBeCloseTo(219_600, 6);
    expect(statement.grossYieldPct).toBeCloseTo(4.8813559322, 6);
    expect(statement.netYieldPct).toBeCloseTo(3.5136, 6);
    expect(statement.monthlyDebtService).toBeCloseTo(23_593.2678, 3);
    expect(statement.monthlyCashFlow).toBeCloseTo(-5_293.2678, 3);
    expect(statement.cashOnCashPct).toBeCloseTo(-3.433471, 4);
    expect(statement.effectiveAnnualIncome).toBeCloseTo(273_600, 6);
  });

  it("handles positive cash flow with zero debt", () => {
    const statement = buildIncomeStatement({
      ...DEMO_INVESTMENT,
      loanAmount: 0,
      ownCapital: 5_900_000,
    });
    expect(statement.monthlyDebtService).toBe(0);
    expect(statement.monthlyCashFlow).toBeCloseTo(18_300, 6);
  });

  it("zeroes effective rent at 100 % vacancy", () => {
    const statement = buildIncomeStatement({
      ...DEMO_INVESTMENT,
      vacancyRate: 100,
      loanAmount: 0,
    });
    expect(statement.effectiveMonthlyRent).toBe(0);
    expect(statement.monthlyNoi).toBeCloseTo(-4_500, 6);
  });

  it("returns null yields when purchase price is zero", () => {
    const statement = buildIncomeStatement({
      ...DEMO_INVESTMENT,
      purchasePrice: 0,
      loanAmount: 0,
    });
    expect(statement.grossYieldPct).toBeNull();
    expect(statement.netYieldPct).not.toBeNull();
    const empty = buildIncomeStatement({
      ...DEMO_INVESTMENT,
      purchasePrice: 0,
      renovationCost: 0,
      acquisitionCosts: 0,
      initialReserve: 0,
      loanAmount: 0,
    });
    expect(empty.netYieldPct).toBeNull();
  });

  it("does not emit NaN for invalid vacancy", () => {
    const statement = buildIncomeStatement({
      ...DEMO_INVESTMENT,
      vacancyRate: 140,
    });
    expect(statement.issues.some((issue) => issue.code === "vacancy")).toBe(true);
    expect(Number.isFinite(statement.monthlyNoi)).toBe(true);
  });
});

describe("payback", () => {
  it("returns years for positive annual cash flow", () => {
    const result = calculatePayback({
      ...DEMO_INVESTMENT,
      loanAmount: 0,
      ownCapital: 1_850_000,
      renovationCost: 0,
      purchasePrice: 1_850_000,
    });
    expect(result.simplePaybackYears).not.toBeNull();
    expect(result.simplePaybackYears!).toBeGreaterThan(0);
    expect(result.unavailableReason).toBeNull();
  });

  it("explains zero and negative cash flow instead of negative years", () => {
    const zero = calculatePayback({
      ...DEMO_INVESTMENT,
      monthlyRent: 4_500,
      vacancyRate: 0,
      loanAmount: 0,
    });
    expect(zero.simplePaybackYears).toBeNull();
    expect(zero.unavailableReason).toMatch(/nevrací/);

    const negative = calculatePayback(DEMO_INVESTMENT);
    expect(negative.simplePaybackYears).toBeNull();
    expect(negative.unavailableReason).toMatch(/nevrací/);
  });
});

describe("max offer", () => {
  it("locks the demo target-yield price", () => {
    const result = calculateMaxOfferByYield(DEMO_INVESTMENT, 5.5);
    expect(result.annualNoi).toBeCloseTo(219_600, 6);
    expect(result.maximumPurchasePrice).toBeCloseTo(3_642_727.2727, 2);
  });

  it("returns no price when renovation consumes the budget", () => {
    const result = calculateMaxOfferByYield(
      { ...DEMO_INVESTMENT, renovationCost: 20_000_000 },
      5,
    );
    expect(result.maximumPurchasePrice).toBeNull();
    expect(result.message).toBeTruthy();
  });

  it("rejects a non-positive target yield", () => {
    const result = calculateMaxOfferByYield(DEMO_INVESTMENT, 0);
    expect(result.maximumPurchasePrice).toBeNull();
    expect(result.issues.some((issue) => issue.code === "target_yield")).toBe(true);
  });

  it("finds a purchase price for a cash-flow target", () => {
    const result = calculateMaxOfferByCashFlow(
      { ...DEMO_INVESTMENT, ownCapital: 2_000_000, loanAmount: null },
      0,
    );
    expect(result.maximumPurchasePrice).not.toBeNull();
    expect(result.achievedMonthlyCashFlow).toBeCloseTo(0, 0);
  });
});

describe("renovation", () => {
  it("aggregates selected lines and reserve", () => {
    const selected = defaultRenovationSelection("light", "byt");
    const estimate = estimateRenovation({
      areaSqm: 50,
      kind: "byt",
      selected,
      reservePct: 15,
    });
    const floors = 1_600 * 50;
    const paint = 280 * 50;
    expect(estimate.mid).toBe(floors + paint);
    expect(estimate.reserveOnMid).toBeCloseTo(estimate.mid * 0.15, 6);
    expect(estimate.totalWithReserve).toBeCloseTo(estimate.mid * 1.15, 6);
  });

  it("skips house-only items for apartments", () => {
    const estimate = estimateRenovation({
      areaSqm: 80,
      kind: "byt",
      selected: ["roof", "floors"],
      reservePct: 10,
    });
    expect(estimate.lines.map((line) => line.id)).toEqual(["floors"]);
  });
});

describe("scenarios", () => {
  it("applies explicit adverse shifts", () => {
    const next = applyScenario(DEMO_INVESTMENT, "adverse");
    expect(next.monthlyRent).toBeCloseTo(24_000 * 0.92, 6);
    expect(next.vacancyRate).toBe(8);
    expect(next.annualInterestRate).toBeCloseTo(DEMO_INVESTMENT.annualInterestRate + 0.5, 6);
  });
});
