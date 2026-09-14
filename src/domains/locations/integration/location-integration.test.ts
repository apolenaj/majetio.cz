import { describe, expect, it } from "vitest";

import {
  buildPropertySegmentBenchmark,
  formatBenchmarkHeadline,
  validateOpportunitySlug,
  resolveMarketPercentile,
  buildMarketOpportunityInsight,
  buildLocationRiskFacts,
  MIN_PERCENTILE_SAMPLE,
} from "@/domains/locations/integration";
import { LOCATION_DEMO_PROFILES } from "@/domains/locations/content/demo-profiles";

describe("property segment benchmark", () => {
  it("compares property to segment median with diff pct", () => {
    const result = buildPropertySegmentBenchmark({
      propertyPricePerSqm: 112_000,
      propertyType: "APARTMENT",
      condition: "GOOD",
      layout: "2+kk",
      profile: LOCATION_DEMO_PROFILES.praha!,
    });
    expect(result.available).toBe(true);
    expect(result.localMedianPricePerSqm).not.toBeNull();
    expect(result.diffPct).not.toBeNull();
    expect(formatBenchmarkHeadline(result)).toContain("112");
  });

  it("exposes purchase percentile when sample is valid", () => {
    const result = buildPropertySegmentBenchmark({
      propertyPricePerSqm: 160_000,
      propertyType: "APARTMENT",
      condition: "GOOD",
      layout: "2+kk",
      profile: LOCATION_DEMO_PROFILES.praha!,
    });
    expect(result.percentilesStatisticallyValid).toBe(true);
    expect(result.purchasePricePercentile).not.toBeNull();
    expect(result.purchasePricePercentile!).toBeGreaterThan(50);
  });

  it("hides percentile when sample too small", () => {
    const thin = {
      ...LOCATION_DEMO_PROFILES.praha!,
      segmentDistributions: {
        "pt:APARTMENT|age:secondary|lay:2+kk": {
          askingPriceSqm: {
            p25: 100_000,
            p50: 120_000,
            p75: 140_000,
            sampleCount: MIN_PERCENTILE_SAMPLE - 1,
            confidence: 0.9,
          },
        },
      },
    };
    const result = buildPropertySegmentBenchmark({
      propertyPricePerSqm: 130_000,
      propertyType: "APARTMENT",
      condition: "GOOD",
      layout: "2+kk",
      profile: thin,
    });
    expect(result.purchasePricePercentile).toBeNull();
  });

  it("suppresses when profile missing — not zero", () => {
    const result = buildPropertySegmentBenchmark({
      propertyPricePerSqm: 112_000,
      propertyType: "APARTMENT",
      profile: null,
    });
    expect(result.available).toBe(false);
    expect(result.localMedianPricePerSqm).toBeNull();
  });
});

describe("market opportunity insight", () => {
  it("builds upper-quartile insight from percentile", () => {
    const purchase = resolveMarketPercentile(160_000, {
      p25: 128_000,
      p50: 142_000,
      p75: 158_000,
      sampleCount: 142,
      confidence: 0.88,
    });
    const insight = buildMarketOpportunityInsight({
      purchase,
      rent: resolveMarketPercentile(null, null),
      segmentLabel: "Byt 2+kk",
      locationLabel: "Praha",
    });
    expect(insight.available).toBe(true);
    expect(insight.text).toMatch(/horn/i);
    expect(insight.sampleCount).toBe(142);
  });
});

describe("location risk facts", () => {
  it("emits high supply fact for Praha demo", () => {
    const bench = buildPropertySegmentBenchmark({
      propertyPricePerSqm: 142_000,
      propertyType: "APARTMENT",
      condition: "GOOD",
      layout: "2+kk",
      profile: LOCATION_DEMO_PROFILES.praha!,
    });
    const { facts } = buildLocationRiskFacts({
      profile: LOCATION_DEMO_PROFILES.praha!,
      segmentBenchmark: bench,
      marketContext: {
        developmentUnits: 4200,
        strRegulatoryLevel: "limited",
      },
    });
    expect(facts.some((f) => f.code === "high_supply_growth")).toBe(true);
    expect(facts.some((f) => f.code === "development_pipeline_pressure")).toBe(true);
    expect(facts.some((f) => f.code === "str_regulatory_restriction")).toBe(true);
  });
});

describe("market opportunity guardrails", () => {
  it("rejects clickbait slugs", () => {
    expect(validateOpportunitySlug("10-nejlepsich-lokalit").allowed).toBe(false);
  });

  it("allows registered opportunities", () => {
    expect(validateOpportunitySlug("vyssi-najemni-vynos").allowed).toBe(true);
  });
});
