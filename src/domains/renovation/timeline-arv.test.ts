/**
 * Prompt 4/5 — Timeline, holding costs, ARV & renovation economics.
 */

import { describe, expect, it } from "vitest";

import {
  SYNTH_PRAHA_COMPS,
  SYNTH_PRAHA_SUBJECT,
} from "@/domains/valuation/fixtures/synthetic-comparables";

import { assessCondition } from "./condition";
import { estimateRenovationCosts } from "./costs";
import { inferScopeFromCondition } from "./scope";
import { estimateRenovationTimeline } from "./timeline";
import { estimateHoldingCosts } from "./holding";
import { computeRenovationOutcome, estimateArv } from "./arv";
import { analyzeRenovation } from "./engine";

describe("RenovationTimelineEstimate", () => {
  it("returns optimistic, base and delayed durations", () => {
    const condition = assessCondition({ condition: "NEEDS_RENOVATION" });
    const scope = inferScopeFromCondition({
      conditionAssessment: condition,
      usableArea: 72,
    });
    const timeline = estimateRenovationTimeline({
      scope,
      structureUnknown: true,
    });

    expect(timeline.optimistic.weeks).toBeLessThan(timeline.base.weeks);
    expect(timeline.base.weeks).toBeLessThan(timeline.delayed.weeks);
    expect(timeline.base.months).toBeGreaterThan(0);
    expect(timeline.dependencyNotes.length).toBeGreaterThan(0);
    expect(timeline.modelIsDemo).toBe(true);
  });
});

describe("Holding costs", () => {
  it("includes debt service, carrying costs and lost rent", () => {
    const condition = assessCondition({ condition: "NEEDS_RENOVATION" });
    const scope = inferScopeFromCondition({ conditionAssessment: condition });
    const timeline = estimateRenovationTimeline({ scope });

    const holding = estimateHoldingCosts({
      timeline,
      purchasePriceCzk: 5_500_000,
      loanPrincipalCzk: 4_000_000,
      nominalInterestRatePp: 5.5,
      monthlyHoaCzk: 2500,
      monthlyEnergyCzk: 800,
      monthlyRentCzk: 22_000,
    });

    expect(holding.durationMonths).toBeGreaterThan(0);
    expect(holding.debtService.baseCzk).toBeGreaterThan(0);
    expect(holding.lostRent.baseCzk).toBeGreaterThan(0);
    expect(holding.total.lowCzk).toBeLessThan(holding.total.highCzk);
  });
});

describe("ARV via Valuation Engine", () => {
  const subject = {
    ...SYNTH_PRAHA_SUBJECT,
    condition: "NEEDS_RENOVATION" as const,
  };

  it("returns lower/base/upper ARV with confidence", () => {
    const condition = assessCondition({ condition: "NEEDS_RENOVATION" });
    const scope = inferScopeFromCondition({
      conditionAssessment: condition,
      usableArea: 72,
    });

    const arv = estimateArv({
      subject,
      candidates: SYNTH_PRAHA_COMPS,
      scope,
      conditionBefore: "NEEDS_RENOVATION",
      monthlyRentBeforeCzk: 22_000,
    });

    expect(arv.arvBaseCzk).not.toBeNull();
    expect(arv.arvLowCzk!).toBeLessThanOrEqual(arv.arvBaseCzk!);
    expect(arv.arvHighCzk!).toBeGreaterThanOrEqual(arv.arvBaseCzk!);
    expect(arv.confidenceLevel).not.toBe("insufficient");
    expect(arv.postRenovation.conditionAfter).toBe("GOOD");
    expect(arv.valueBefore).not.toBeNull();
    expect(arv.arvBaseCzk!).toBeGreaterThan(arv.valueBefore!.baseCzk);
  });

  it("builds PostRenovationPropertyScenario with rent uplift", () => {
    const condition = assessCondition({ condition: "NEEDS_RENOVATION" });
    const scope = inferScopeFromCondition({ conditionAssessment: condition });

    const arv = estimateArv({
      subject,
      candidates: SYNTH_PRAHA_COMPS,
      scope,
      conditionBefore: "NEEDS_RENOVATION",
      monthlyRentBeforeCzk: 20_000,
    });

    expect(arv.postRenovation.expectedRentAfter).not.toBeNull();
    expect(arv.postRenovation.expectedRentAfter!.baseCzk).toBeGreaterThan(
      20_000,
    );
    expect(arv.postRenovation.improvements.length).toBeGreaterThan(0);
  });
});

describe("Renovation economics", () => {
  it("computes uplift, ROI and detects over-improvement risk", () => {
    const condition = assessCondition({ condition: "NEEDS_RENOVATION" });
    const scope = inferScopeFromCondition({
      conditionAssessment: condition,
      usableArea: 72,
      bathroomsCount: 1,
    });
    const costs = estimateRenovationCosts({
      scope,
      conditionAssessment: condition,
      propertyAreaSqm: 72,
      location: { publicCity: "Praha" },
    });
    const timeline = estimateRenovationTimeline({ scope });
    const holding = estimateHoldingCosts({
      timeline,
      purchasePriceCzk: 5_500_000,
      loanPrincipalCzk: 3_500_000,
      monthlyRentCzk: 22_000,
    });

    const outcome = computeRenovationOutcome({
      subject: { ...SYNTH_PRAHA_SUBJECT, condition: "NEEDS_RENOVATION" },
      candidates: SYNTH_PRAHA_COMPS,
      scope,
      conditionBefore: "NEEDS_RENOVATION",
      purchasePriceCzk: 5_500_000,
      renovationCost: costs.totalInvestment,
      holdingCosts: holding.total,
      monthlyRentBeforeCzk: 22_000,
      annualOpexCzk: 48_000,
    });

    expect(outcome.economics.valueUplift.baseCzk).toBeGreaterThan(0);
    expect(outcome.economics.roi).not.toBeNull();
    expect(outcome.economics.yieldAfter.grossYieldPct).not.toBeNull();
    expect(typeof outcome.economics.overImprovementRisk.detected).toBe(
      "boolean",
    );
  });

  it("flags over-improvement when renovation exceeds value uplift", () => {
    const condition = assessCondition({ condition: "GOOD" });
    const scope = inferScopeFromCondition({ conditionAssessment: condition });

    const outcome = computeRenovationOutcome({
      subject: { ...SYNTH_PRAHA_SUBJECT, condition: "GOOD" },
      candidates: SYNTH_PRAHA_COMPS,
      scope,
      conditionBefore: "GOOD",
      purchasePriceCzk: 6_500_000,
      renovationCost: {
        lowCzk: 3_000_000,
        baseCzk: 3_500_000,
        highCzk: 4_000_000,
      },
      holdingCosts: { lowCzk: 100_000, baseCzk: 150_000, highCzk: 200_000 },
      monthlyRentBeforeCzk: 22_000,
    });

    expect(outcome.economics.overImprovementRisk.detected).toBe(true);
  });
});

describe("Full renovation engine orchestration", () => {
  it("runs A→B→C→timeline→holding→D pipeline", () => {
    const result = analyzeRenovation({
      subject: { ...SYNTH_PRAHA_SUBJECT, condition: "NEEDS_RENOVATION" },
      comparables: SYNTH_PRAHA_COMPS,
      condition: "NEEDS_RENOVATION",
      purchasePriceCzk: 5_800_000,
      usableArea: 72,
      bathroomsCount: 1,
      location: { publicCity: "Praha" },
      monthlyRentCzk: 22_000,
      loanPrincipalCzk: 4_000_000,
      monthlyHoaCzk: 3000,
    });

    expect(result.status).toBe("calculated");
    expect(result.engineVersion).toBe("0.5.0-flip-offer");
    expect(result.outcome.arv.arvBaseCzk).toBeGreaterThan(0);
    expect(result.holding.total.baseCzk).toBeGreaterThan(0);
    expect(result.timeline.base.weeks).toBeGreaterThan(0);
  });
});
