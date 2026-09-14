import { describe, expect, it } from "vitest";

import {
  Money,
  Percentage,
  nominalInterestRateFromPercentPoints,
} from "@/domains/finance";

import {
  calculateBreakEvenInterestRate,
  calculateBreakEvenOccupancy,
  calculateBreakEvenPurchasePrice,
  calculateConfidenceScore,
  DEFAULT_CANONICAL_SPREADS,
  deriveCanonicalScenarios,
  evaluateRiskFlags,
  evaluateYear1Metrics,
  FORMULA_REGISTRY_VERSION,
  INVESTMENT_ENGINE_VERSION,
  runOneWaySensitivity,
  runStressTests,
  runTwoWaySensitivity,
  type RiskBaseCase,
} from "../index";

function sampleBase(overrides: Partial<RiskBaseCase> = {}): RiskBaseCase {
  return {
    totalAcquisitionCost: Money.fromMajor(6_250_000, "CZK"),
    // NOI ≈ 288k; DS on 3.5M @ 5.25%/30y ≈ 232k → positive CF headroom for BE rate
    annualEgi: Money.fromMajor(360_000, "CZK"),
    potentialGrossIncome: Money.fromMajor(384_000, "CZK"),
    annualOpex: Money.fromMajor(72_000, "CZK"),
    loanPrincipal: Money.fromMajor(3_500_000, "CZK"),
    nominalInterestRate: nominalInterestRateFromPercentPoints(5.25),
    termYears: 30,
    ...overrides,
  };
}

describe("investment engine risk module", () => {
  it("bumps engine and formula registry for risk", () => {
    expect(INVESTMENT_ENGINE_VERSION).toBe("0.4.0-risk");
    expect(FORMULA_REGISTRY_VERSION).toBe("1.3.0");
  });

  it("derives conservative worse CF and optimistic better CF from base", () => {
    const triplet = deriveCanonicalScenarios({
      base: sampleBase(),
      spreads: DEFAULT_CANONICAL_SPREADS,
    });

    expect(triplet.formulaKey).toBe("canonical_scenarios");
    const { base, conservative, optimistic } = triplet.year1;

    expect(conservative.annualCashFlow.toMajorNumber()).toBeLessThan(
      base.annualCashFlow.toMajorNumber(),
    );
    expect(optimistic.annualCashFlow.toMajorNumber()).toBeGreaterThan(
      base.annualCashFlow.toMajorNumber(),
    );
    expect(triplet.spreads.egiFactor.conservative).toBe(0.9);
  });

  it("runs 1-way interest sensitivity affecting cash flow", () => {
    const result = runOneWaySensitivity({
      base: sampleBase(),
      factor: "interest_rate_pp",
      shocks: [-1, 0, 1, 2],
      metricFocus: "annualCashFlow",
    });

    expect(result.steps).toHaveLength(4);
    const cfs = result.steps.map((s) => s.metrics.annualCashFlow.toMajorNumber());
    // Higher rate → lower CF
    expect(cfs[0]).toBeGreaterThan(cfs[1]!);
    expect(cfs[1]).toBeGreaterThan(cfs[2]!);
    expect(cfs[2]).toBeGreaterThan(cfs[3]!);
  });

  it("runs 2-way interest × egi sensitivity grid", () => {
    const result = runTwoWaySensitivity({
      base: sampleBase(),
      factorA: "interest_rate_pp",
      factorB: "egi",
      shocksA: [0, 2],
      shocksB: [-0.1, 0],
    });

    expect(result.grid).toHaveLength(4);
    const baseCell = result.grid.find((c) => c.shockA === 0 && c.shockB === 0)!;
    const stressed = result.grid.find((c) => c.shockA === 2 && c.shockB === -0.1)!;
    expect(stressed.annualCashFlowMajor).toBeLessThan(baseCell.annualCashFlowMajor);
  });

  it("computes break-even occupancy between 0 and 1 for viable deal", () => {
    const be = calculateBreakEvenOccupancy(sampleBase());
    expect(be.value).not.toBeNull();
    const occ = be.value!.toRatio().toNumber();
    expect(occ).toBeGreaterThan(0);
    expect(occ).toBeLessThanOrEqual(1);
    expect(be.reason).toBeNull();
  });

  it("finds break-even interest rate above base when CF is positive", () => {
    const base = sampleBase();
    const metrics = evaluateYear1Metrics(base);
    expect(metrics.annualCashFlow.isPositive()).toBe(true);

    const be = calculateBreakEvenInterestRate(base);
    expect(be.value).not.toBeNull();
    expect(be.value!.toPercentPoints().toNumber()).toBeGreaterThan(5.25);
  });

  it("computes break-even purchase price for target net yield", () => {
    const be = calculateBreakEvenPurchasePrice({
      base: sampleBase(),
      targetNetYield: Percentage.fromPercentPoints(4),
    });
    expect(be.value).not.toBeNull();
    // NOI ≈ 264_300 → / 0.04 ≈ 6_607_500
    expect(be.value!.toMajorNumber()).toBeGreaterThan(6_000_000);
    expect(be.value!.toMajorNumber()).toBeLessThan(7_500_000);
  });

  it("applies named stress shocks including combined", () => {
    const suite = runStressTests(sampleBase());
    expect(suite.shocks).toHaveLength(4);

    const interest = suite.shocks.find((s) => s.id === "interest_plus_2pp")!;
    const rent = suite.shocks.find((s) => s.id === "rent_minus_10pct")!;
    const combined = suite.shocks.find((s) => s.id === "combined_shock")!;

    expect(interest.metrics.annualCashFlow.toMajorNumber()).toBeLessThan(
      suite.base.annualCashFlow.toMajorNumber(),
    );
    expect(rent.metrics.noi.toMajorNumber()).toBeLessThan(
      suite.base.noi.toMajorNumber(),
    );
    expect(combined.metrics.annualCashFlow.toMajorNumber()).toBeLessThan(
      interest.metrics.annualCashFlow.toMajorNumber(),
    );
  });

  it("emits negative_cash_flow and high_equity_requirement flags", () => {
    const stressed = sampleBase({
      annualEgi: Money.fromMajor(100_000, "CZK"),
      loanPrincipal: Money.fromMajor(2_000_000, "CZK"),
    });
    const result = evaluateRiskFlags(stressed);
    const codes = result.flags.map((f) => f.code);
    expect(codes).toContain("negative_cash_flow");
    expect(codes).toContain("high_equity_requirement");
  });

  it("scores confidence higher for market data than user estimates", () => {
    const market = calculateConfidenceScore([
      { field: "rent", provenance: "market_data", weight: 2 },
      { field: "opex", provenance: "verified_listing" },
      { field: "rate", provenance: "market_data" },
    ]);
    const estimates = calculateConfidenceScore([
      { field: "rent", provenance: "user_estimate", weight: 2 },
      { field: "opex", provenance: "default_assumption" },
      { field: "rate", provenance: "user_estimate" },
    ]);

    expect(market.value).toBeGreaterThan(estimates.value);
    expect(market.level).toBe("high");
    expect(estimates.level === "low" || estimates.level === "medium").toBe(
      true,
    );
  });
});
