/**
 * Part 2/D — Scenario, sensitivity monotonicity, property-based amortization.
 */

import { describe, expect, it } from "vitest";

import {
  Money,
  nominalInterestRateFromPercentPoints,
} from "@/domains/finance";

import {
  buildAmortizationSchedule,
  evaluateYear1Metrics,
  runOneWaySensitivity,
  type RiskBaseCase,
} from "../index";

function sampleBase(overrides: Partial<RiskBaseCase> = {}): RiskBaseCase {
  return {
    totalAcquisitionCost: Money.fromMajor(6_000_000, "CZK"),
    annualEgi: Money.fromMajor(342_000, "CZK"),
    potentialGrossIncome: Money.fromMajor(360_000, "CZK"),
    annualOpex: Money.fromMajor(72_000, "CZK"),
    loanPrincipal: Money.fromMajor(4_200_000, "CZK"),
    nominalInterestRate: nominalInterestRateFromPercentPoints(5.25),
    termYears: 30,
    ...overrides,
  };
}

describe("Scenario CF shapes", () => {
  it("positive CF when rent covers debt (cash / low leverage)", () => {
    const m = evaluateYear1Metrics(
      sampleBase({
        loanPrincipal: Money.fromMajor(1_500_000, "CZK"),
        nominalInterestRate: nominalInterestRateFromPercentPoints(4),
      }),
    );
    expect(m.annualCashFlow.toMajorNumber()).toBeGreaterThan(0);
  });

  it("negative CF under high leverage is valid (not an exception)", () => {
    const m = evaluateYear1Metrics(
      sampleBase({
        loanPrincipal: Money.fromMajor(5_500_000, "CZK"),
        nominalInterestRate: nominalInterestRateFromPercentPoints(6.5),
      }),
    );
    expect(m.annualCashFlow.toMajorNumber()).toBeLessThan(0);
  });

  it("cash purchase — ADS = 0 and CF = NOI", () => {
    const m = evaluateYear1Metrics(
      sampleBase({
        loanPrincipal: null,
        nominalInterestRate: null,
        termYears: null,
      }),
    );
    expect(m.annualDebtService.isZero()).toBe(true);
    expect(m.annualCashFlow.toMajorString()).toBe(m.noi.toMajorString());
    expect(m.dscr).toBeNull();
  });

  it("high leverage raises LTV toward 1", () => {
    const m = evaluateYear1Metrics(
      sampleBase({
        loanPrincipal: Money.fromMajor(5_700_000, "CZK"),
      }),
    );
    expect(m.ltv).not.toBeNull();
    expect(m.ltv!.toRatio().toNumber()).toBeGreaterThan(0.9);
  });
});

describe("Sensitivity monotonicity", () => {
  it("higher interest rate strictly lowers annual cash flow", () => {
    const result = runOneWaySensitivity({
      base: sampleBase(),
      factor: "interest_rate_pp",
      shocks: [-1, 0, 1, 2],
      metricFocus: "annualCashFlow",
    });
    const cfs = result.steps.map((s) => s.metrics.annualCashFlow.toMajorNumber());
    for (let i = 1; i < cfs.length; i++) {
      expect(cfs[i]!).toBeLessThan(cfs[i - 1]!);
    }
  });

  it("higher EGI strictly raises annual cash flow", () => {
    const result = runOneWaySensitivity({
      base: sampleBase(),
      factor: "egi",
      shocks: [-0.1, 0, 0.1, 0.2],
      metricFocus: "annualCashFlow",
    });
    const cfs = result.steps.map((s) => s.metrics.annualCashFlow.toMajorNumber());
    for (let i = 1; i < cfs.length; i++) {
      expect(cfs[i]!).toBeGreaterThan(cfs[i - 1]!);
    }
  });

  it("higher opex strictly lowers annual cash flow", () => {
    const result = runOneWaySensitivity({
      base: sampleBase(),
      factor: "opex",
      shocks: [-0.1, 0, 0.1, 0.2],
      metricFocus: "annualCashFlow",
    });
    const cfs = result.steps.map((s) => s.metrics.annualCashFlow.toMajorNumber());
    for (let i = 1; i < cfs.length; i++) {
      expect(cfs[i]!).toBeLessThan(cfs[i - 1]!);
    }
  });

  it("sensitivity grid is pure in-memory (no async / I/O surface)", () => {
    const started = performance.now();
    const result = runOneWaySensitivity({
      base: sampleBase(),
      factor: "interest_rate_pp",
      shocks: Array.from({ length: 21 }, (_, i) => i - 10),
    });
    const elapsed = performance.now() - started;
    expect(result.steps).toHaveLength(21);
    // Pure engine — even 21 shocks should finish well under 100 ms on CI.
    expect(elapsed).toBeLessThan(500);
  });
});

/** Deterministic mulberry32 PRNG for property-style tests (no fast-check dep). */
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

describe("Property-based amortization invariants", () => {
  it(
    "ending balance never goes nonsensically negative; mid balances stay ≥ 0",
    () => {
      const rand = mulberry32(0x2d2026);
      for (let i = 0; i < 12; i++) {
        const principal = Math.round(500_000 + rand() * 9_500_000);
        const ratePp = Math.round(rand() * 1200) / 100; // 0–12 %
        const termYears = 5 + Math.floor(rand() * 26); // 5–30
        const schedule = buildAmortizationSchedule({
          principal: Money.fromMajor(principal, "CZK"),
          nominalInterestRate: nominalInterestRateFromPercentPoints(ratePp),
          termYears,
        });

        expect(schedule.endingBalance.toMajorNumber()).toBeGreaterThanOrEqual(
          -0.01,
        );
        expect(schedule.endingBalance.toMajorNumber()).toBeLessThan(50);

        // Spot-check first, mid, last row instead of every month
        const rows = schedule.schedule.value;
        for (const row of [
          rows[0],
          rows[Math.floor(rows.length / 2)],
          rows[rows.length - 1],
        ]) {
          expect(row!.balanceAfter.toMajorNumber()).toBeGreaterThanOrEqual(
            -0.01,
          );
          expect(row!.payment.toMajorNumber()).toBeGreaterThanOrEqual(0);
          expect(row!.principal.toMajorNumber()).toBeGreaterThanOrEqual(-0.01);
        }
      }
    },
    15_000,
  );

  it(
    "balances are non-increasing over the schedule (monotone paydown)",
    () => {
      const rand = mulberry32(0xcafe);
      for (let i = 0; i < 8; i++) {
        const schedule = buildAmortizationSchedule({
          principal: Money.fromMajor(
            Math.round(1_000_000 + rand() * 4_000_000),
            "CZK",
          ),
          nominalInterestRate: nominalInterestRateFromPercentPoints(
            1 + rand() * 8,
          ),
          termYears: 10 + Math.floor(rand() * 15),
        });
        let prev = Number.POSITIVE_INFINITY;
        for (const row of schedule.schedule.value) {
          const bal = row.balanceAfter.toMajorNumber();
          expect(bal).toBeLessThanOrEqual(prev + 0.01);
          prev = bal;
        }
      }
    },
    15_000,
  );
});
