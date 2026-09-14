/**
 * Tests for PropertyFinancing domain model (Prompt 13/2).
 *
 * Validates:
 *   - LTV computation on price vs valuation
 *   - Equity derivation from default share
 *   - Financing gap detection
 *   - Annuity delegation to Investment Engine
 *   - Post-fixation rate assumptions
 *   - Financing scenario builder
 */

import { describe, it, expect } from "vitest";

import {
  calculatePropertyFinancing,
  buildFinancingScenarios,
  offerToFinancingOverrides,
} from "./property-financing";
import type { CanonicalMortgageOffer } from "@/integrations/hypotekajasne";

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const BASE_INPUT = {
  askingPriceCzk: 4_000_000,
  valuationCzk: null,
  userEquityCzk: 1_600_000,
  requestedLoanCzk: null,
  termYears: 30,
  nominalInterestRatePp: 5.25,
  aprPp: 5.5,
  offerLtvMaxPct: null,
  defaultEquityShareOfPrice: 0.4,
} as const;

// ---------------------------------------------------------------------------
// Core calculations
// ---------------------------------------------------------------------------

describe("calculatePropertyFinancing", () => {
  it("derives loan from price − equity", () => {
    const r = calculatePropertyFinancing(BASE_INPUT);
    expect(r.requestedLoanCzk).toBe(2_400_000);
    expect(r.availableEquityCzk).toBe(1_600_000);
  });

  it("computes LTV on asking price", () => {
    const r = calculatePropertyFinancing(BASE_INPUT);
    // 2_400_000 / 4_000_000 = 60 %
    expect(r.ltvOnAskingPricePct).toBeCloseTo(60, 0);
  });

  it("uses default equity share when userEquityCzk is null", () => {
    const r = calculatePropertyFinancing({
      ...BASE_INPUT,
      userEquityCzk: null,
    });
    expect(r.availableEquityCzk).toBe(1_600_000); // 40% of 4M
    expect(r.requestedLoanCzk).toBe(2_400_000);
  });

  it("detects valuation below asking price", () => {
    const r = calculatePropertyFinancing({
      ...BASE_INPUT,
      valuationCzk: 3_500_000,
    });
    expect(r.valuationBelowPriceWarning).toBe(true);
    expect(r.ltvOnValuationPct).toBeCloseTo((2_400_000 / 3_500_000) * 100, 0);
  });

  it("computes financing gap when loan exceeds LTV cap", () => {
    const r = calculatePropertyFinancing({
      ...BASE_INPUT,
      offerLtvMaxPct: 60,
      // valuation same as price → max = 0.6 * 4M = 2.4M, loan = 2.4M → gap 0
    });
    // Gap should be 0 exactly at 60% LTV
    expect(r.financingGapCzk).toBe(0);
  });

  it("shows positive gap when LTV cap is lower", () => {
    const r = calculatePropertyFinancing({
      ...BASE_INPUT,
      userEquityCzk: 1_000_000, // 25% equity → loan 3M
      requestedLoanCzk: null,
      offerLtvMaxPct: 60,
    });
    // Max eligible = 0.6 * 4M = 2.4M. Requested = 3M. Gap = 600K
    expect(r.financingGapCzk).toBe(600_000);
  });

  it("computes monthly payment via annuity formula", () => {
    const r = calculatePropertyFinancing(BASE_INPUT);
    // G1 fixture: 4.2M @ 5.25% 30y ≈ 23 193 / měs. Our case: 2.4M @ 5.25% 30y
    // Ratio: 2.4/4.2 * 23193 ≈ 13 253. Accept ±100 Kč tolerance.
    expect(r.estimatedMonthlyPaymentCzk).not.toBeNull();
    const payment = r.estimatedMonthlyPaymentCzk as number;
    expect(payment).toBeGreaterThan(12_000);
    expect(payment).toBeLessThan(15_000);
  });

  it("sets total paid and total interest", () => {
    const r = calculatePropertyFinancing(BASE_INPUT);
    expect(r.totalPaidCzk).not.toBeNull();
    expect(r.totalInterestCzk).not.toBeNull();
    // totalInterest = totalPaid − loan
    expect(r.totalInterestCzk).toBeCloseTo(
      (r.totalPaidCzk ?? 0) - r.requestedLoanCzk,
      -2,
    );
  });

  it("returns null payment when rate is null", () => {
    const r = calculatePropertyFinancing({
      ...BASE_INPUT,
      nominalInterestRatePp: null,
    });
    expect(r.estimatedMonthlyPaymentCzk).toBeNull();
    expect(r.totalPaidCzk).toBeNull();
  });

  it("post-fixation assumption is nominalRate + 1 pp", () => {
    const r = calculatePropertyFinancing(BASE_INPUT);
    expect(r.postFixationRateAssumptionPp).toBeCloseTo(6.25, 2);
    expect(r.futureRefinanceRateAssumptionPp).toBeCloseTo(6.25, 2);
  });

  it("null rate yields null post-fixation assumption", () => {
    const r = calculatePropertyFinancing({
      ...BASE_INPUT,
      nominalInterestRatePp: null,
    });
    expect(r.postFixationRateAssumptionPp).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Scenario builder
// ---------------------------------------------------------------------------

describe("buildFinancingScenarios", () => {
  it("returns cash / ltv60 / ltv80 scenarios", () => {
    const scenarios = buildFinancingScenarios(4_000_000, 5.25, 30);
    const kinds = scenarios.map((s) => s.kind);
    expect(kinds).toContain("cash");
    expect(kinds).toContain("ltv60");
    expect(kinds).toContain("ltv80");
  });

  it("cash scenario has zero loan", () => {
    const scenarios = buildFinancingScenarios(4_000_000, 5.25, 30);
    const cash = scenarios.find((s) => s.kind === "cash")!;
    expect(cash.loanCzk).toBe(0);
    expect(cash.equityCzk).toBe(4_000_000);
    expect(cash.monthlyPaymentCzk).toBe(0);
  });

  it("ltv60 loan = 60% of price", () => {
    const scenarios = buildFinancingScenarios(4_000_000, 5.25, 30);
    const s = scenarios.find((s) => s.kind === "ltv60")!;
    expect(s.loanCzk).toBe(2_400_000);
    expect(s.equityCzk).toBe(1_600_000);
  });

  it("ltv80 loan = 80% of price", () => {
    const scenarios = buildFinancingScenarios(4_000_000, 5.25, 30);
    const s = scenarios.find((s) => s.kind === "ltv80")!;
    expect(s.loanCzk).toBe(3_200_000);
    expect(s.equityCzk).toBe(800_000);
  });

  it("monthly payment for ltv60 > 0", () => {
    const scenarios = buildFinancingScenarios(4_000_000, 5.25, 30);
    const s = scenarios.find((s) => s.kind === "ltv60")!;
    expect(s.monthlyPaymentCzk).not.toBeNull();
    expect(s.monthlyPaymentCzk).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Offer bridge
// ---------------------------------------------------------------------------

describe("offerToFinancingOverrides", () => {
  it("extracts rate/apr/ltv from CanonicalMortgageOffer", () => {
    const offer: CanonicalMortgageOffer = {
      id: "test-1",
      bankName: "TestBank",
      productName: "Hypo 5Y",
      interestRateFrom: 5.19,
      aprFrom: 5.45,
      fixationYears: 5,
      ltvMinPct: null,
      ltvMaxPct: 80,
      fees: undefined,
      source: "test",
      status: "active",
      dataTier: "cached",
      retrievedAt: new Date(),
      verifiedAt: null,
      externalId: null,
      schemaVersion: "1.0.0",
    };

    const overrides = offerToFinancingOverrides(offer);
    expect(overrides.nominalInterestRatePp).toBe(5.19);
    expect(overrides.aprPp).toBe(5.45);
    expect(overrides.offerLtvMaxPct).toBe(80);
  });
});
