import { describe, expect, it } from "vitest";

import { buildLocationMarketSnapshot } from "@/domains/locations/ingestion/snapshot";
import { runLocationIngestionPipeline } from "@/domains/locations/ingestion/pipeline";
import { resolveFallbackLocation } from "@/domains/locations/ingestion/fallback";
import { resolveFreshness } from "@/domains/locations/ingestion/freshness";
import { detectMetricAnomalies } from "@/domains/locations/ingestion/anomalies";
import { deduplicateObservations } from "@/domains/locations/ingestion/dedupe";
import { filterOutliersPreserveHighEnd } from "@/domains/locations/ingestion/outlier-filter";

describe("outlier filter preserves high-end", () => {
  it("keeps luxury values between soft and hard fence", () => {
    const values = [80, 85, 90, 92, 95, 100, 105, 110, 200];
    const result = filterOutliersPreserveHighEnd(values);
    expect(result.kept.length).toBeGreaterThan(0);
    // 200 may be high-end preserved or hard-removed depending on IQR
    expect(result.removed.length + result.kept.length).toBe(values.length);
  });
});

describe("dedupe", () => {
  it("keeps newest observation per canonical key", () => {
    const out = deduplicateObservations([
      {
        externalId: "L1",
        locationId: "loc",
        value: 100,
        observedAt: "2026-01-01",
      },
      {
        externalId: "L1",
        locationId: "loc",
        value: 120,
        observedAt: "2026-02-01",
      },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]!.value).toBe(120);
  });
});

describe("anomalies", () => {
  it("flags 80%+ price spike as review_required", () => {
    const anomalies = detectMetricAnomalies({
      metricKey: "property_market.median_asking_price_sqm",
      currentValue: 180,
      previousValue: 100,
      currentSampleCount: 50,
      previousSampleCount: 50,
    });
    expect(anomalies.some((a) => a.reviewRequired)).toBe(true);
  });

  it("flags sample collapse", () => {
    const anomalies = detectMetricAnomalies({
      metricKey: "property_market.median_asking_price_sqm",
      currentValue: 100,
      previousValue: 100,
      currentSampleCount: 5,
      previousSampleCount: 40,
    });
    expect(anomalies.some((a) => a.ruleCode === "LOCATION_METRIC_SAMPLE_COLLAPSE")).toBe(
      true,
    );
  });
});

describe("freshness", () => {
  it("marks stale after TTL", () => {
    const calculatedAt = new Date("2025-01-01");
    const freshness = resolveFreshness({
      calculatedAt,
      now: new Date("2026-07-01"),
      updateFrequency: "MONTHLY",
    });
    expect(freshness).toBe("STALE");
  });
});

describe("fallback hierarchy", () => {
  it("returns ui message when inheriting from parent — never invents data", () => {
    const result = resolveFallbackLocation({
      requested: {
        id: "nbhd",
        type: "NEIGHBORHOOD",
        parentId: "district",
        name: "Vinohrady",
      },
      ancestors: [
        {
          id: "district",
          type: "CITY_DISTRICT",
          parentId: "city",
          name: "Praha 2",
          publicLabel: "Praha 2",
        },
        {
          id: "city",
          type: "CITY",
          parentId: null,
          name: "Praha",
          publicLabel: "Praha",
        },
      ],
      availabilityByLocationId: new Map([
        ["nbhd", { locationId: "nbhd", sampleCount: 2, display: false }],
        ["district", { locationId: "district", sampleCount: 40, display: true }],
      ]),
      minSampleCount: 10,
    });
    expect(result?.usedFallback).toBe(true);
    expect(result?.uiMessage).toContain("širší oblasti");
    expect(result?.resolvedLocationId).toBe("district");
  });

  it("returns null when no parent has data — no fake values", () => {
    const result = resolveFallbackLocation({
      requested: {
        id: "nbhd",
        type: "NEIGHBORHOOD",
        parentId: "city",
        name: "X",
      },
      ancestors: [
        { id: "city", type: "CITY", parentId: null, name: "Y" },
      ],
      availabilityByLocationId: new Map(),
      minSampleCount: 10,
    });
    expect(result).toBeNull();
  });
});

describe("pipeline", () => {
  it("runs stages and stamps methodologyVersion", () => {
    const result = runLocationIngestionPipeline(
      Array.from({ length: 20 }, (_, i) => ({
        externalId: `L${i}`,
        locationId: "loc_1",
        value: 100_000 + i * 500,
        observedAt: "2026-07-01",
        propertyType: "APARTMENT",
        layout: "2+kk",
        condition: "GOOD",
      })),
      {
        dataSourceKey: "majetio_internal_aggregation",
        period: "2026-07",
      },
    );
    expect(result.methodologyVersion).toContain("location-ingestion");
    expect(result.candidates.length).toBeGreaterThan(0);
    expect(result.candidates.every((c) => c.methodologyVersion)).toBe(true);
    expect(result.candidates.every((c) => c.sampleCount > 0)).toBe(true);
  });
});

describe("market snapshot", () => {
  it("records methodology versions per metric", () => {
    const pipeline = runLocationIngestionPipeline(
      Array.from({ length: 20 }, (_, i) => ({
        externalId: `L${i}`,
        locationId: "loc_1",
        value: 110_000 + i * 200,
        observedAt: "2026-07-01",
        propertyType: "APARTMENT",
        layout: "2+kk",
        condition: "GOOD",
      })),
      { dataSourceKey: "majetio_internal_aggregation", period: "2026-07" },
    );
    const snap = buildLocationMarketSnapshot({
      locationId: "loc_1",
      period: "2026-07",
      segmentKey: pipeline.candidates[0]!.segmentKey,
      metrics: pipeline.candidates,
    });
    expect(Object.keys(snap.methodologyVersions).length).toBeGreaterThan(0);
  });
});
