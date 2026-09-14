import { describe, expect, it } from "vitest";

import {
  canTransitionModelLifecycle,
  computeMaeMape,
  detectPerformanceRegression,
  assertModelCanGoLive,
} from "@/domains/valuation/admin/metrics";
import { detectCatalogPriceAnomalies } from "@/domains/renovation/admin/catalog-governance";
import type { RenovationCostCatalogEntry } from "@/domains/renovation/costs/catalog";

describe("valuation model lifecycle", () => {
  it("requires APPROVED before ACTIVE", () => {
    expect(assertModelCanGoLive("DRAFT").ok).toBe(false);
    expect(assertModelCanGoLive("APPROVED").ok).toBe(true);
    expect(canTransitionModelLifecycle("DRAFT", "REVIEW_REQUESTED")).toBe(
      true,
    );
    expect(canTransitionModelLifecycle("DRAFT", "TESTING")).toBe(true);
    expect(canTransitionModelLifecycle("DRAFT", "ACTIVE")).toBe(false);
    expect(canTransitionModelLifecycle("REVIEW_REQUESTED", "APPROVED")).toBe(
      true,
    );
    expect(canTransitionModelLifecycle("APPROVED", "ACTIVE")).toBe(true);
  });
});

describe("MAE MAPE regression", () => {
  it("computes MAE/MAPE", () => {
    const m = computeMaeMape([
      { predicted: 100, actual: 90 },
      { predicted: 200, actual: 200 },
    ]);
    expect(m?.sampleSize).toBe(2);
    expect(m?.mae).toBeCloseTo(5);
    expect(m?.mape).toBeGreaterThan(0);
  });

  it("alerts on MAE regression", () => {
    const r = detectPerformanceRegression({
      mae: 120,
      previousMae: 100,
      threshold: 0.15,
    });
    expect(r.alert).toBe(true);
    expect(r.note).toMatch(/regressed/);
  });
});

describe("renovation catalog anomalies", () => {
  it("flags 300% price jumps", () => {
    const prev: RenovationCostCatalogEntry[] = [
      {
        id: "1",
        category: "bathroom",
        item: "obklady",
        unit: "m2",
        qualityLevel: "standard",
        lowCost: 800,
        baseCost: 1000,
        highCost: 1200,
        currency: "CZK",
        market: "CZ",
        region: "national",
        validFrom: "2026-01-01",
        validTo: null,
        source: "test",
        version: "v1",
      },
    ];
    const next: RenovationCostCatalogEntry[] = [
      { ...prev[0]!, id: "1", baseCost: 4000, version: "v2" },
    ];
    const anomalies = detectCatalogPriceAnomalies(prev, next);
    expect(anomalies).toHaveLength(1);
    expect(anomalies[0]?.jumpRatio).toBe(4);
  });
});
