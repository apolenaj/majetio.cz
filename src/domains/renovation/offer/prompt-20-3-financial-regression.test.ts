/**
 * Prompt 20.3 — Domain logic & financial engines regression.
 * Golden / invariant checks: max offer, ARV ≠ cost sum, RPSN vs nominal, higher costs → lower offer.
 */

import { describe, expect, it } from "vitest";

import { resolveAssumptionDefaults } from "@/config/investment-assumptions";
import { Money, nominalInterestRateFromPercentPoints } from "@/domains/finance";
import { calculatePropertyFinancing } from "@/domains/financing/property-financing";
import { calculateAnnuityPayment } from "@/domains/investment/engine/calculations/financing";
import { assessCondition } from "@/domains/renovation/condition";
import { estimateArv } from "@/domains/renovation/arv";
import { calculateMaximumOffer } from "@/domains/renovation/offer";
import { maxPurchaseRental } from "@/domains/renovation/offer/reverse-rental";
import { inferScopeFromCondition } from "@/domains/renovation/scope";
import {
  SYNTH_PRAHA_COMPS,
  SYNTH_PRAHA_SUBJECT,
} from "@/domains/valuation/fixtures/synthetic-comparables";
import { runValuationEstimate } from "@/domains/valuation/service";

const RENTAL_COSTS = {
  renovationCost: {
    lowCzk: 400_000,
    baseCzk: 600_000,
    highCzk: 900_000,
  },
  holdingCosts: {
    lowCzk: 50_000,
    baseCzk: 80_000,
    highCzk: 120_000,
  },
  resaleValue: {
    lowCzk: 7_000_000,
    baseCzk: 7_500_000,
    highCzk: 8_000_000,
  },
  annualEgiCzk: 360_000,
  annualOpexCzk: 72_000,
  loanLtvPct: 70,
  nominalInterestRatePp: 5.25,
  termYears: 30,
};

describe("Prompt 20.3 — Valuation regression", () => {
  it("dense comps: deterministic estimate with confidence score", () => {
    const a = runValuationEstimate(SYNTH_PRAHA_SUBJECT, SYNTH_PRAHA_COMPS);
    const b = runValuationEstimate(SYNTH_PRAHA_SUBJECT, SYNTH_PRAHA_COMPS);
    expect(a.status).toBe("CALCULATED");
    expect(a.adjustedValueCzk).toBe(b.adjustedValueCzk);
    expect(a.confidenceScore).toBe(b.confidenceScore);
    expect(a.confidenceScore).toBeGreaterThan(0);
    expect(["HIGH", "MEDIUM", "LOW"]).toContain(a.confidenceLevel);
    expect(a.status).not.toBe("INSUFFICIENT_DATA");
  });

  it("no comps: insufficient confidence, no invented mid-market price", () => {
    const result = runValuationEstimate(SYNTH_PRAHA_SUBJECT, []);
    expect(result.confidenceLevel).toBe("INSUFFICIENT");
    expect(result.confidenceScore).toBe(0);
  });
});

describe("Prompt 20.3 — Mortgage nominal vs RPSN", () => {
  it("annuity uses nominal rate; APR/RPSN does not change payment", () => {
    const nominal = calculatePropertyFinancing({
      askingPriceCzk: 4_000_000,
      valuationCzk: 4_000_000,
      userEquityCzk: 1_600_000,
      requestedLoanCzk: null,
      termYears: 30,
      nominalInterestRatePp: 5.25,
      aprPp: 5.25,
      offerLtvMaxPct: 80,
      defaultEquityShareOfPrice: 0.4,
    });
    const highApr = calculatePropertyFinancing({
      askingPriceCzk: 4_000_000,
      valuationCzk: 4_000_000,
      userEquityCzk: 1_600_000,
      requestedLoanCzk: null,
      termYears: 30,
      nominalInterestRatePp: 5.25,
      aprPp: 9.99,
      offerLtvMaxPct: 80,
      defaultEquityShareOfPrice: 0.4,
    });

    expect(nominal.estimatedMonthlyPaymentCzk).toBe(
      highApr.estimatedMonthlyPaymentCzk,
    );
    expect(nominal.aprPp).toBe(5.25);
    expect(highApr.aprPp).toBe(9.99);
    expect(nominal.nominalInterestRatePp).toBe(5.25);

    const engine = calculateAnnuityPayment({
      principal: Money.fromMajor(nominal.requestedLoanCzk, "CZK"),
      nominalInterestRate: nominalInterestRateFromPercentPoints(5.25),
      termYears: 30,
    });
    expect(nominal.estimatedMonthlyPaymentCzk).toBeCloseTo(
      engine.monthlyPayment.value.toMajorNumber(),
      0,
    );
  });

  it("post-fixation spread comes from assumption config (not magic +1)", () => {
    const spread =
      resolveAssumptionDefaults().spreads.interestRatePp.conservative;
    const r = calculatePropertyFinancing({
      askingPriceCzk: 4_000_000,
      valuationCzk: null,
      userEquityCzk: 1_600_000,
      requestedLoanCzk: null,
      termYears: 30,
      nominalInterestRatePp: 5.25,
      aprPp: null,
      offerLtvMaxPct: 80,
      defaultEquityShareOfPrice: 0.4,
    });
    expect(r.postFixationRateAssumptionPp).toBeCloseTo(5.25 + spread, 5);
  });
});

describe("Prompt 20.3 — ARV is valuation-based", () => {
  it("ARV is never current value + renovation costs", () => {
    const subject = {
      ...SYNTH_PRAHA_SUBJECT,
      condition: "NEEDS_RENOVATION" as const,
    };
    const condition = assessCondition({ condition: "NEEDS_RENOVATION" });
    const cosmetic = inferScopeFromCondition({
      conditionAssessment: condition,
      usableArea: 72,
    });
    const arv = estimateArv({
      subject,
      candidates: SYNTH_PRAHA_COMPS,
      scope: cosmetic,
      conditionBefore: "NEEDS_RENOVATION",
      monthlyRentBeforeCzk: 22_000,
    });

    expect(arv.arvBaseCzk).not.toBeNull();
    expect(arv.valueBefore).not.toBeNull();
    const renoCost = 1_000_000;
    const naiveSum = arv.valueBefore!.baseCzk + renoCost;
    expect(arv.arvBaseCzk).not.toBe(naiveSum);
    // ARV must come from after-renovation valuation band, not cost stacking
    expect(arv.arvBaseCzk).toBe(arv.postRenovation.expectedValueAfter.baseCzk);
  });

  it("full renovation yields higher condition / ARV than cosmetic when comps allow", () => {
    const subject = {
      ...SYNTH_PRAHA_SUBJECT,
      condition: "NEEDS_RENOVATION" as const,
    };
    const condition = assessCondition({ condition: "NEEDS_RENOVATION" });
    const cosmeticScope = inferScopeFromCondition({
      conditionAssessment: condition,
      usableArea: 72,
      standardOverride: "cosmetic",
    });
    const fullScope = inferScopeFromCondition({
      conditionAssessment: condition,
      usableArea: 72,
      standardOverride: "full",
    });

    const cosmetic = estimateArv({
      subject,
      candidates: SYNTH_PRAHA_COMPS,
      scope: cosmeticScope,
      conditionBefore: "NEEDS_RENOVATION",
    });
    const full = estimateArv({
      subject,
      candidates: SYNTH_PRAHA_COMPS,
      scope: fullScope,
      conditionBefore: "NEEDS_RENOVATION",
    });

    expect(cosmetic.postRenovation.conditionAfter).toBe("GOOD");
    expect(full.postRenovation.conditionAfter).toBe("EXCELLENT");
    expect(full.arvBaseCzk!).toBeGreaterThanOrEqual(cosmetic.arvBaseCzk!);
  });
});

describe("Prompt 20.3 — Maximum offer invariants", () => {
  it("higher renovation costs lower flip max offer", () => {
    const baseCosts = {
      renovationCost: {
        lowCzk: 800_000,
        baseCzk: 1_000_000,
        highCzk: 1_200_000,
      },
      holdingCosts: {
        lowCzk: 100_000,
        baseCzk: 140_000,
        highCzk: 200_000,
      },
      resaleValue: {
        lowCzk: 7_000_000,
        baseCzk: 7_500_000,
        highCzk: 8_000_000,
      },
      acquisitionCostRatePct: 1.28,
      feesRatePct: 0.4,
      sellingCostRatePct: 3,
    };

    const lowCost = calculateMaximumOffer({
      target: { strategy: "flip", targetProfitCzk: 500_000 },
      costs: baseCosts,
      askingPriceCzk: 6_000_000,
    });
    const highCost = calculateMaximumOffer({
      target: { strategy: "flip", targetProfitCzk: 500_000 },
      costs: {
        ...baseCosts,
        renovationCost: {
          lowCzk: 1_500_000,
          baseCzk: 1_800_000,
          highCzk: 2_200_000,
        },
      },
      askingPriceCzk: 6_000_000,
    });

    expect(highCost.maximumOffer.base).toBeLessThan(lowCost.maximumOffer.base);
    expect(highCost.maximumOffer.conservative).toBeLessThan(
      lowCost.maximumOffer.conservative,
    );
  });

  it("higher renovation costs lower rental yield max offer", () => {
    const low = calculateMaximumOffer({
      target: { strategy: "rental", targetNetYieldPct: 5 },
      costs: { ...RENTAL_COSTS },
      askingPriceCzk: 6_000_000,
    });
    const high = calculateMaximumOffer({
      target: { strategy: "rental", targetNetYieldPct: 5 },
      costs: {
        ...RENTAL_COSTS,
        renovationCost: {
          lowCzk: 1_200_000,
          baseCzk: 1_500_000,
          highCzk: 1_900_000,
        },
      },
      askingPriceCzk: 6_000_000,
    });

    expect(high.maximumOffer.base).toBeLessThan(low.maximumOffer.base);
  });

  it("cash-flow max offer returns highest purchase meeting target (not first/min)", () => {
    const result = maxPurchaseRental({
      costs: RENTAL_COSTS,
      targetMonthlyCashFlowCzk: 5_000,
      scenario: "base",
    });

    expect(result.purchase).toBeGreaterThan(500_000);
    // Sanity: at 500k LTV debt service is tiny → CF easily meets 5k;
    // a correct max should be well above the grid floor.
    expect(result.purchase).toBeGreaterThan(2_000_000);
    expect(result.bindingTarget).toMatch(/cash flow/i);
  });

  it("CoC max offer uses leveraged CF path and returns a finite band", () => {
    const result = maxPurchaseRental({
      costs: RENTAL_COSTS,
      targetCashOnCashPct: 6,
      scenario: "base",
    });
    expect(result.purchase).toBeGreaterThan(0);
    expect(result.bindingTarget).toMatch(/CoC/i);
  });
});

describe("Prompt 20.3 — Decimal / assumption config", () => {
  it("assumption defaults are the single source for rate/term/acq shares", () => {
    const { defaults } = resolveAssumptionDefaults();
    expect(defaults.interestRatePp).toBe(5.25);
    expect(defaults.termYears).toBe(30);
    expect(defaults.acquisitionCostsShareOfPrice).toBeCloseTo(0.0128, 6);
    expect(defaults.feesShareOfPrice).toBeCloseTo(0.004, 6);
  });
});
