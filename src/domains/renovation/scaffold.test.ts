/**
 * Prompt 1/5 smoke — RenovationAnalysis service scaffold (no CapEx math).
 */

import { describe, expect, it } from "vitest";

import {
  RENOVATION_ENGINE_VERSION,
  createRenovationAnalysisService,
  renovationEngine,
} from "./index";
import { assessCondition, createConditionService } from "./condition";
import { createScopeService } from "./scope";
import { createCostsService } from "./costs";
import { createArvService } from "./arv";
import {
  SYNTH_PRAHA_COMPS,
  SYNTH_PRAHA_SUBJECT,
} from "@/domains/valuation/fixtures/synthetic-comparables";

describe("RenovationAnalysis scaffold", () => {
  it("creates and reads a DRAFT analysis with version stamps", async () => {
    const service = createRenovationAnalysisService();
    const created = await service.create({
      propertyId: "prop-1",
      analysisId: null,
      scenarioId: null,
      type: "AUTOMATIC",
      scopeVersion: "scope.v2026.07",
      costModelVersion: "cost.v2026.07",
      locationCostVersion: "location-cost.v2026.07-demo",
    });

    expect(created.id).toBeTruthy();
    expect(created.status).toBe("DRAFT");
    expect(created.estimatedBase).toBeNull();
    expect(created.scopeVersion).toBe("scope.v2026.07");

    const loaded = await service.getById(created.id);
    expect(loaded?.propertyId).toBe("prop-1");
  });

  it("keeps A/B/C/D services independent — costs & ARV wired", async () => {
    const condition = await createConditionService().assess({
      condition: "NEEDS_RENOVATION",
    });
    const scope = await createScopeService().resolve({
      conditionAssessment: condition,
      usableArea: 60,
    });
    const costs = await createCostsService().estimate({
      scope,
      conditionAssessment: condition,
      propertyAreaSqm: 60,
      location: { publicCity: "Brno" },
    });
    const arv = await createArvService().estimate({
      subject: { ...SYNTH_PRAHA_SUBJECT, condition: "NEEDS_RENOVATION" },
      candidates: SYNTH_PRAHA_COMPS,
      scope,
      conditionBefore: "NEEDS_RENOVATION",
    });

    expect(condition.areas.structure.status).toBe("unknown");
    expect(scope.items.length).toBeGreaterThan(0);
    expect(costs.construction.baseCzk).toBeGreaterThan(0);
    expect(arv.arvBaseCzk).toBeGreaterThan(0);
    expect(arv.arvLowCzk!).toBeLessThan(arv.arvHighCzk!);
    expect(costs.costModelVersion).not.toBe(arv.arvModelVersion);
  });

  it("exposes engine version and full analyze pipeline", async () => {
    expect(RENOVATION_ENGINE_VERSION).toBe("0.5.0-flip-offer");
    const result = await renovationEngine.analyze({
      subject: { ...SYNTH_PRAHA_SUBJECT, condition: "NEEDS_RENOVATION" },
      comparables: SYNTH_PRAHA_COMPS,
      condition: "NEEDS_RENOVATION",
      purchasePriceCzk: 5_500_000,
      usableArea: 72,
      location: { publicCity: "Praha" },
      monthlyRentCzk: 20_000,
    });
    expect(result.status).toBe("calculated");
    expect(result.outcome.arv.arvBaseCzk).toBeGreaterThan(0);
  });

  it("assessCondition is pure and synchronous-friendly", () => {
    const result = assessCondition({ condition: "GOOD" });
    expect(result.conditionModelVersion).toMatch(/^condition\./);
  });
});
