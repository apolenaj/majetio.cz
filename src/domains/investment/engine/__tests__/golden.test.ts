/**
 * Part 2/D — Golden financial unit tests (per-metric + mortgage + IRR).
 */

import { describe, expect, it } from "vitest";

import {
  Money,
  Percentage,
  nominalInterestRateFromPercentPoints,
} from "@/domains/finance";

import {
  buildAmortizationSchedule,
  buildEquityCashFlowSeries,
  calculateAnnuityPayment,
  calculateBreakEvenOccupancy,
  calculateCapRate,
  calculateCashFlows,
  calculateCashOnCash,
  calculateDscr,
  calculateEquityMultiple,
  calculateEquityRequired,
  calculateGrossIncome,
  calculateIrr,
  calculateLtv,
  calculateNoi,
  calculatePaybackPeriod,
  calculateYields,
} from "../index";
import type { RiskBaseCase } from "../risk/base-case";

import {
  GOLDEN_BREAK_EVEN_OCC,
  GOLDEN_CASE_G1,
  GOLDEN_CASE_G1_CASH,
  GOLDEN_CASE_HIGH_LTV,
  GOLDEN_EQUITY_MULTIPLE,
  GOLDEN_IRR_NEGATIVE,
  GOLDEN_IRR_POSITIVE,
  GOLDEN_MORTGAGE,
} from "../__fixtures__/golden-cases";

function g1Income() {
  const g = GOLDEN_CASE_G1.inputs;
  return calculateGrossIncome({
    monthlyRent: Money.fromMajor(g.monthlyRentMajor, "CZK"),
    vacancyRate: Percentage.fromPercentPoints(g.vacancyPercentPoints),
  });
}

function g1Noi() {
  const income = g1Income();
  return {
    income,
    noi: calculateNoi({
      effectiveGrossIncome: income.effectiveGrossIncome.value,
      annualOperatingExpenses: Money.fromMajor(
        GOLDEN_CASE_G1.inputs.annualOpexMajor,
        "CZK",
      ),
    }),
    tac: Money.fromMajor(GOLDEN_CASE_G1.inputs.purchasePriceMajor, "CZK"),
  };
}

describe("Golden G1 — income & yields", () => {
  it("computes PGI / vacancy / EGI", () => {
    const income = g1Income();
    const e = GOLDEN_CASE_G1.expected;
    expect(income.potentialGrossIncome.value.toMajorString()).toBe(e.pgiMajor);
    expect(income.vacancyLoss.value.toMajorString()).toBe(e.vacancyLossMajor);
    expect(income.effectiveGrossIncome.value.toMajorString()).toBe(e.egiMajor);
  });

  it("computes NOI", () => {
    const { noi } = g1Noi();
    expect(noi.value.toMajorString()).toBe(GOLDEN_CASE_G1.expected.noiMajor);
  });

  it("computes gross yield", () => {
    const { income, noi, tac } = g1Noi();
    const yields = calculateYields({
      effectiveGrossIncome: income.effectiveGrossIncome.value,
      noi: noi.value,
      totalAcquisitionCost: tac,
    });
    expect(yields.grossYield.value.toRatio().toNumber()).toBeCloseTo(
      GOLDEN_CASE_G1.expected.grossYieldRatio,
      10,
    );
  });

  it("computes net yield", () => {
    const { income, noi, tac } = g1Noi();
    const yields = calculateYields({
      effectiveGrossIncome: income.effectiveGrossIncome.value,
      noi: noi.value,
      totalAcquisitionCost: tac,
    });
    expect(yields.netYield.value.toRatio().toNumber()).toBeCloseTo(
      GOLDEN_CASE_G1.expected.netYieldRatio,
      10,
    );
  });

  it("computes cap rate", () => {
    const { noi, tac } = g1Noi();
    const cap = calculateCapRate({ noi: noi.value, propertyValue: tac });
    expect(cap.value.toRatio().toNumber()).toBeCloseTo(
      GOLDEN_CASE_G1.expected.capRateRatio,
      10,
    );
  });
});

describe("Golden G1 — financing, CF, CoC, DSCR", () => {
  it("computes equity and LTV", () => {
    const { tac } = g1Noi();
    const loan = Money.fromMajor(GOLDEN_CASE_G1.inputs.loanAmountMajor, "CZK");
    const equity = calculateEquityRequired({
      totalAcquisitionCost: tac,
      loanPrincipal: loan,
    });
    expect(equity.value.toMajorString()).toBe(
      GOLDEN_CASE_G1.expected.equityMajor,
    );
    const ltv = calculateLtv({ loanPrincipal: loan, propertyValue: tac });
    expect(ltv.value.toRatio().toNumber()).toBeCloseTo(
      GOLDEN_CASE_G1.expected.ltvRatio,
      10,
    );
  });

  it("computes annuity debt service within Excel tolerance", () => {
    const ann = calculateAnnuityPayment({
      principal: Money.fromMajor(GOLDEN_CASE_G1.inputs.loanAmountMajor, "CZK"),
      nominalInterestRate: nominalInterestRateFromPercentPoints(
        GOLDEN_CASE_G1.inputs.interestRatePercentPoints,
      ),
      termYears: GOLDEN_CASE_G1.inputs.termYears,
    });
    expect(ann.monthlyDebtService.value.toMajorNumber()).toBeCloseTo(
      GOLDEN_CASE_G1.expected.monthlyDebtServiceMajorApprox,
      1,
    );
  });

  it("computes leveraged cash flow (may be negative — not an error)", () => {
    const { noi } = g1Noi();
    const ann = calculateAnnuityPayment({
      principal: Money.fromMajor(GOLDEN_CASE_G1.inputs.loanAmountMajor, "CZK"),
      nominalInterestRate: nominalInterestRateFromPercentPoints(
        GOLDEN_CASE_G1.inputs.interestRatePercentPoints,
      ),
      termYears: GOLDEN_CASE_G1.inputs.termYears,
    });
    const cfs = calculateCashFlows({
      noi: noi.value,
      monthlyDebtService: ann.monthlyDebtService.value,
    });
    expect(cfs.annualLeveraged.value.toMajorNumber()).toBeCloseTo(
      GOLDEN_CASE_G1.expected.annualCashFlowMajorApprox,
      0,
    );
  });

  it("computes cash-on-cash (ROI family)", () => {
    const { noi, tac } = g1Noi();
    const loan = Money.fromMajor(GOLDEN_CASE_G1.inputs.loanAmountMajor, "CZK");
    const ann = calculateAnnuityPayment({
      principal: loan,
      nominalInterestRate: nominalInterestRateFromPercentPoints(
        GOLDEN_CASE_G1.inputs.interestRatePercentPoints,
      ),
      termYears: GOLDEN_CASE_G1.inputs.termYears,
    });
    const equity = calculateEquityRequired({
      totalAcquisitionCost: tac,
      loanPrincipal: loan,
    });
    const cfs = calculateCashFlows({
      noi: noi.value,
      monthlyDebtService: ann.monthlyDebtService.value,
    });
    const coc = calculateCashOnCash({
      annualLeveragedCashFlow: cfs.annualLeveraged.value,
      equityRequired: equity.value,
    });
    expect(coc.value).not.toBeNull();
    expect(coc.value!.toRatio().toNumber()).toBeCloseTo(
      GOLDEN_CASE_G1.expected.cashOnCashRatioApprox,
      4,
    );
  });

  it("computes DSCR", () => {
    const { noi } = g1Noi();
    const ann = calculateAnnuityPayment({
      principal: Money.fromMajor(GOLDEN_CASE_G1.inputs.loanAmountMajor, "CZK"),
      nominalInterestRate: nominalInterestRateFromPercentPoints(
        GOLDEN_CASE_G1.inputs.interestRatePercentPoints,
      ),
      termYears: GOLDEN_CASE_G1.inputs.termYears,
    });
    const dscr = calculateDscr({
      noi: noi.value,
      annualDebtService: ann.annualDebtService.value,
    });
    expect(dscr.value).not.toBeNull();
    expect(dscr.value!).toBeCloseTo(GOLDEN_CASE_G1.expected.dscrApprox, 2);
  });
});

describe("Golden G1 cash purchase", () => {
  it("CF equals NOI and DSCR is undefined at formula layer", () => {
    const { noi } = g1Noi();
    const cfs = calculateCashFlows({
      noi: noi.value,
      monthlyDebtService: null,
    });
    expect(cfs.annualLeveraged.value.toMajorString()).toBe(
      GOLDEN_CASE_G1_CASH.expected.annualCashFlowMajor,
    );
    expect(cfs.monthlyLeveraged.value.toMajorString()).toBe(
      GOLDEN_CASE_G1_CASH.expected.monthlyCashFlowMajor,
    );
    const dscr = calculateDscr({
      noi: noi.value,
      annualDebtService: Money.zero("CZK"),
    });
    expect(dscr.value).toBeNull();
  });
});

describe("Golden high leverage", () => {
  it("LTV matches 95 %", () => {
    const g = GOLDEN_CASE_HIGH_LTV;
    const ltv = calculateLtv({
      loanPrincipal: Money.fromMajor(g.inputs.loanAmountMajor, "CZK"),
      propertyValue: Money.fromMajor(g.inputs.purchasePriceMajor, "CZK"),
    });
    expect(ltv.value.toRatio().toNumber()).toBeCloseTo(g.expected.ltvRatio, 10);
  });
});

describe("Golden mortgage amortization", () => {
  it("0 % interest — payment = P/n and ending balance ≈ 0", () => {
    const m = GOLDEN_MORTGAGE.zeroRate;
    const schedule = buildAmortizationSchedule({
      principal: Money.fromMajor(m.principalMajor, "CZK"),
      nominalInterestRate: nominalInterestRateFromPercentPoints(m.ratePp),
      termYears: m.termYears,
    });
    expect(schedule.monthlyPayment.toMajorString()).toBe(m.expectedMonthlyMajor);
    expect(schedule.endingBalance.toMajorNumber()).toBeLessThanOrEqual(
      m.expectedEndingBalanceMax,
    );
  });

  it("5 % / 30y — payment matches Excel PMT and balance ≈ 0", () => {
    const m = GOLDEN_MORTGAGE.fivePercent30y;
    const schedule = buildAmortizationSchedule({
      principal: Money.fromMajor(m.principalMajor, "CZK"),
      nominalInterestRate: nominalInterestRateFromPercentPoints(m.ratePp),
      termYears: m.termYears,
    });
    expect(schedule.monthlyPayment.toMajorNumber()).toBeCloseTo(
      m.expectedMonthlyApprox,
      1,
    );
    expect(schedule.endingBalance.toMajorNumber()).toBeLessThanOrEqual(
      m.expectedEndingBalanceMax,
    );
    expect(schedule.schedule.value).toHaveLength(360);
  });

  it("5 % / 5y short term — balance ≈ 0", () => {
    const m = GOLDEN_MORTGAGE.fivePercent5y;
    const schedule = buildAmortizationSchedule({
      principal: Money.fromMajor(m.principalMajor, "CZK"),
      nominalInterestRate: nominalInterestRateFromPercentPoints(m.ratePp),
      termYears: m.termYears,
    });
    expect(schedule.monthlyPayment.toMajorNumber()).toBeCloseTo(
      m.expectedMonthlyApprox,
      1,
    );
    expect(schedule.endingBalance.toMajorNumber()).toBeLessThanOrEqual(
      m.expectedEndingBalanceMax,
    );
    expect(schedule.schedule.value).toHaveLength(60);
  });
});

describe("Golden IRR / equity multiple / payback (ROI family)", () => {
  it("solves known positive IRR series", () => {
    const g = GOLDEN_IRR_POSITIVE;
    const series = buildEquityCashFlowSeries(
      Money.fromMajor(g.equityMajor, "CZK"),
      g.annualFlowsMajor.map((v) => Money.fromMajor(v, "CZK")),
    );
    const irr = calculateIrr(series);
    expect(irr.converged).toBe(true);
    expect(irr.value!.toRatio().toNumber()).toBeCloseTo(
      g.expectedIrrRatioApprox,
      2,
    );
  });

  it("returns negative IRR for loss series", () => {
    const g = GOLDEN_IRR_NEGATIVE;
    const series = buildEquityCashFlowSeries(
      Money.fromMajor(g.equityMajor, "CZK"),
      g.annualFlowsMajor.map((v) => Money.fromMajor(v, "CZK")),
    );
    const irr = calculateIrr(series);
    expect(irr.converged).toBe(true);
    expect(irr.value).not.toBeNull();
    expect(irr.value!.toRatio().lt(0)).toBe(true);
  });

  it("computes equity multiple (total return / equity)", () => {
    const g = GOLDEN_EQUITY_MULTIPLE;
    const series = buildEquityCashFlowSeries(
      Money.fromMajor(g.equityMajor, "CZK"),
      g.annualFlowsMajor.map((v) => Money.fromMajor(v, "CZK")),
    );
    const em = calculateEquityMultiple(series);
    expect(em.value).toBeCloseTo(g.expectedMultiple, 5);
    // ROI ≈ multiple − 1
    expect(em.value! - 1).toBeCloseTo(0.2, 5);
    const pb = calculatePaybackPeriod(series);
    expect(pb.value).not.toBeNull();
  });
});

describe("Golden break-even occupancy", () => {
  it("matches opex / PGI for cash case", () => {
    const g = GOLDEN_BREAK_EVEN_OCC;
    const base: RiskBaseCase = {
      totalAcquisitionCost: Money.fromMajor(6_000_000, "CZK"),
      annualEgi: Money.fromMajor(g.pgiMajor, "CZK"),
      potentialGrossIncome: Money.fromMajor(g.pgiMajor, "CZK"),
      annualOpex: Money.fromMajor(g.opexMajor, "CZK"),
      loanPrincipal: null,
    };
    const be = calculateBreakEvenOccupancy(base);
    expect(be.value).not.toBeNull();
    expect(be.value!.toRatio().toNumber()).toBeCloseTo(
      g.expectedOccupancyRatio,
      6,
    );
  });
});
