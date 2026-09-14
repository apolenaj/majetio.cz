/**
 * Prompt 3/5 — Cost Engine, catalog, contingency, project & furnishing costs.
 */

import { describe, expect, it } from "vitest";

import { assessCondition } from "./condition";
import { inferScopeFromCondition } from "./scope";
import {
  estimateRenovationCosts,
  getCostCatalog,
  resolveLocationCostRegion,
  regionalCoefficient,
  DEMO_LOCATION_COST_V2026_07,
} from "./costs";
import { calculateContingency } from "./contingency";

describe("RenovationCostCatalog", () => {
  it("loads demo catalog with isDemo flag", () => {
    const catalog = getCostCatalog();
    expect(catalog.isDemo).toBe(true);
    expect(catalog.entries.length).toBeGreaterThan(20);
    expect(catalog.entries.every((e: { lowCost: number; baseCost: number }) => e.lowCost <= e.baseCost)).toBe(true);
    expect(catalog.entries.every((e: { baseCost: number; highCost: number }) => e.baseCost <= e.highCost)).toBe(true);
  });
});

describe("Regional coefficients", () => {
  it("applies higher coefficient for Praha", () => {
    expect(resolveLocationCostRegion({ publicCity: "Praha" })).toBe("praha");
    expect(resolveLocationCostRegion({ publicCity: "Brno" })).toBe("cz_other");

    const praha = regionalCoefficient(
      DEMO_LOCATION_COST_V2026_07,
      "praha",
    );
    const other = regionalCoefficient(
      DEMO_LOCATION_COST_V2026_07,
      "cz_other",
    );
    expect(praha).toBeGreaterThan(other);
  });
});

describe("Cost Engine", () => {
  it("returns low/base/high bands — never a single figure", () => {
    const condition = assessCondition({
      condition: "NEEDS_RENOVATION",
    });
    const scope = inferScopeFromCondition({
      conditionAssessment: condition,
      usableArea: 65,
      bathroomsCount: 1,
    });

    const estimate = estimateRenovationCosts({
      scope,
      conditionAssessment: condition,
      propertyAreaSqm: 65,
      location: { publicCity: "Brno" },
    });

    expect(estimate.construction.lowCzk).toBeLessThanOrEqual(
      estimate.construction.baseCzk,
    );
    expect(estimate.construction.baseCzk).toBeLessThanOrEqual(
      estimate.construction.highCzk,
    );
    expect(estimate.totalInvestment.lowCzk).toBeLessThan(
      estimate.totalInvestment.highCzk,
    );
    expect(estimate.catalogIsDemo).toBe(true);
  });

  it("prices more in Praha than elsewhere for same scope", () => {
    const condition = assessCondition({ condition: "AVERAGE" });
    const scope = inferScopeFromCondition({
      conditionAssessment: condition,
      usableArea: 70,
    });

    const brno = estimateRenovationCosts({
      scope,
      conditionAssessment: condition,
      propertyAreaSqm: 70,
      location: { publicCity: "Brno" },
    });
    const praha = estimateRenovationCosts({
      scope,
      conditionAssessment: condition,
      propertyAreaSqm: 70,
      location: { publicCity: "Praha" },
    });

    expect(praha.construction.baseCzk).toBeGreaterThan(brno.construction.baseCzk);
  });

  it("separates project costs and furnishing from construction", () => {
    const condition = assessCondition({ condition: "NEEDS_RENOVATION" });
    const scope = inferScopeFromCondition({
      conditionAssessment: condition,
      usableArea: 80,
      bathroomsCount: 1,
    });

    const estimate = estimateRenovationCosts({
      scope,
      conditionAssessment: condition,
      propertyAreaSqm: 80,
    });

    expect(estimate.projectCosts.lines).toHaveLength(3);
    expect(estimate.projectCosts.total.baseCzk).toBeGreaterThan(0);
    expect(estimate.projectCosts.lines.map((l) => l.code)).toEqual([
      "architect",
      "permits",
      "supervision",
    ]);

    const constructionPlusProject =
      estimate.construction.baseCzk + estimate.projectCosts.total.baseCzk;
    expect(estimate.subtotalBeforeContingency.baseCzk).toBe(
      constructionPlusProject,
    );
  });

  it("assigns confidence level from data quality", () => {
    const good = assessCondition({ condition: "GOOD" });
    const goodScope = inferScopeFromCondition({
      conditionAssessment: good,
      usableArea: 55,
    });
    const goodEstimate = estimateRenovationCosts({
      scope: goodScope,
      conditionAssessment: good,
      propertyAreaSqm: 55,
    });
    expect(["high", "medium"]).toContain(goodEstimate.confidence);

    const unknown = assessCondition({ condition: "UNKNOWN" });
    const emptyScope = inferScopeFromCondition({
      conditionAssessment: unknown,
    });
    const lowEstimate = estimateRenovationCosts({
      scope: { ...emptyScope, items: [] },
      conditionAssessment: unknown,
    });
    expect(lowEstimate.confidence).toBe("insufficient");
  });

  it("populates priced items with catalog references", () => {
    const condition = assessCondition({ condition: "NEEDS_RENOVATION" });
    const scope = inferScopeFromCondition({
      conditionAssessment: condition,
      usableArea: 60,
      bathroomsCount: 1,
    });

    const estimate = estimateRenovationCosts({
      scope,
      conditionAssessment: condition,
      propertyAreaSqm: 60,
    });

    const priced = estimate.pricedItems.filter((i) => i.costBase !== null);
    expect(priced.length).toBeGreaterThan(0);
    expect(priced.every((i) => i.catalogEntryId !== null)).toBe(true);
    expect(priced.every((i) => i.costLow! <= i.costBase!)).toBe(true);
  });
});

describe("Contingency", () => {
  it("increases reserve for unknown structure and NEEDS_RENOVATION", () => {
    const condition = assessCondition({ condition: "NEEDS_RENOVATION" });
    const scope = inferScopeFromCondition({ conditionAssessment: condition });

    const baseBand = { lowCzk: 500000, baseCzk: 700000, highCzk: 950000 };

    const lowRisk = calculateContingency({
      constructionBase: baseBand,
      conditionAssessment: assessCondition({ condition: "GOOD" }),
      scope: { ...scope, standard: "cosmetic" },
    });

    const highRisk = calculateContingency({
      constructionBase: baseBand,
      conditionAssessment: condition,
      scope,
    });

    expect(highRisk.rateRatio).toBeGreaterThan(lowRisk.rateRatio);
    expect(highRisk.warnings.some((w) => w.code === "hidden_defects_risk")).toBe(
      true,
    );
    expect(highRisk.band.baseCzk).toBeGreaterThan(lowRisk.band.baseCzk);
  });

  it("contingency band is an interval", () => {
    const result = calculateContingency({
      constructionBase: { lowCzk: 400000, baseCzk: 600000, highCzk: 800000 },
      scope: inferScopeFromCondition({
        conditionAssessment: assessCondition({ condition: "AVERAGE" }),
      }),
    });

    expect(result.band.lowCzk).toBeLessThanOrEqual(result.band.baseCzk);
    expect(result.band.baseCzk).toBeLessThanOrEqual(result.band.highCzk);
  });
});
