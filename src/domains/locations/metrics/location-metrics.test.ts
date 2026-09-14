import { describe, expect, it } from "vitest";

import { resolveMetricConfidence } from "@/domains/locations/metrics/confidence";
import { LOCATION_METRIC_REGISTRY } from "@/domains/locations/metrics/registry";
import {
  decodeSegmentKey,
  encodeSegmentKey,
} from "@/domains/locations/metrics/segment";
import { aggregateNumeric, trimmedValues } from "@/domains/locations/metrics/statistics";
import {
  computePeriodTrend,
  computeTrailingTrends,
} from "@/domains/locations/metrics/trends";
import { aggregateLiquidityMetrics } from "@/domains/locations/metrics/liquidity";
import {
  createLocationMetricAggregationService,
} from "@/domains/locations/service/location-metric-aggregation-service";

const askingDef = LOCATION_METRIC_REGISTRY["property_market.median_asking_price_sqm"];

describe("segment encoding", () => {
  it("round-trips property type, age and layout", () => {
    const key = encodeSegmentKey({
      propertyType: "APARTMENT",
      marketAge: "secondary",
      layout: "2+kk",
    });
    expect(key).toBe("pt:APARTMENT|age:secondary|lay:2+kk");
    expect(decodeSegmentKey(key).propertyType).toBe("APARTMENT");
  });
});

describe("confidence thresholds", () => {
  it("suppresses below suppressBelowSampleCount", () => {
    const result = resolveMetricConfidence(5, askingDef);
    expect(result.display).toBe(false);
    expect(result.confidence).toBe(0);
  });

  it("lowers confidence between suppress and min thresholds", () => {
    const result = resolveMetricConfidence(10, askingDef);
    expect(result.display).toBe(true);
    expect(result.confidence).toBeLessThan(0.7);
  });
});

describe("price aggregation", () => {
  const service = createLocationMetricAggregationService();
  const context = {
    locationId: "loc_1",
    period: "2026-07",
    source: "test",
    sourceType: "INTERNAL_AGGREGATION" as const,
    calculatedAt: new Date("2026-07-01"),
    validFrom: new Date("2026-07-01"),
  };

  it("keeps asking and transaction metrics separate", () => {
    const observations = Array.from({ length: 20 }, (_, i) => ({
      pricePerSqm: 100_000 + i * 1_000,
      propertyType: "APARTMENT" as const,
      condition: "GOOD" as const,
      layout: "2+kk",
    }));

    const asking = service.aggregateAskingPrices(observations, context);
    const transaction = service.aggregateTransactionPrices(observations, context);

    expect(asking.every((m) => m.priceKind === "ASKING")).toBe(true);
    expect(transaction.every((m) => m.priceKind === "TRANSACTION")).toBe(true);
    expect(asking.some((m) => m.metricKey.includes("asking"))).toBe(true);
    expect(transaction.some((m) => m.metricKey.includes("transaction"))).toBe(true);
  });

  it("does not merge segments", () => {
    const observations = [
      ...Array.from({ length: 20 }, () => ({
        pricePerSqm: 120_000,
        propertyType: "APARTMENT" as const,
        condition: "GOOD" as const,
        layout: "2+kk",
      })),
      ...Array.from({ length: 20 }, () => ({
        pricePerSqm: 80_000,
        propertyType: "HOUSE" as const,
        condition: "GOOD" as const,
        layout: "ALL",
      })),
    ];

    const metrics = service.aggregateAskingPrices(observations, context);
    const segmentKeys = new Set(metrics.map((m) => m.segmentKey));
    expect(segmentKeys.size).toBeGreaterThan(1);
  });

  it("uses median as primary value for price metrics", () => {
    const values = [90_000, 100_000, 110_000, 500_000];
    const stats = aggregateNumeric(values);
    expect(stats.median).toBe(105_000);
    expect(stats.mean).toBeGreaterThan(stats.median!);
  });
});

describe("liquidity proxies", () => {
  it("trims extreme DOM outliers before median", () => {
    const dom = [10, 12, 15, 18, 20, 400];
    const trimmed = trimmedValues(dom, 0.05, 0.95);
    const stats = aggregateNumeric(trimmed);
    expect(trimmed).not.toContain(400);
    expect(stats.median).toBeLessThan(100);
  });

  it("aggregates listing liquidity metrics", () => {
    const result = aggregateLiquidityMetrics([
      { listingId: "1", daysOnMarket: 10, hadPriceReduction: false },
      { listingId: "2", daysOnMarket: 20, hadPriceReduction: true },
      { listingId: "3", daysOnMarket: 600, hadPriceReduction: false },
    ]);
    expect(result.activeListingsCount).toBe(3);
    expect(result.priceReductionRate).toBeCloseTo(1 / 3);
    expect(result.domOutliersTrimmed).toBeGreaterThanOrEqual(0);
  });
});

describe("trends", () => {
  it("computes MoM change for stable segment", () => {
    const trend = computePeriodTrend({
      metricKey: "property_market.median_asking_price_sqm",
      segmentKey: "pt:APARTMENT|age:secondary|lay:2+kk",
      current: {
        period: "2026-07",
        calculatedAt: new Date("2026-07-01"),
        value: 110,
        sampleCount: 20,
        segmentKey: "pt:APARTMENT|age:secondary|lay:2+kk",
      },
      previous: {
        period: "2026-06",
        calculatedAt: new Date("2026-06-01"),
        value: 100,
        sampleCount: 20,
        segmentKey: "pt:APARTMENT|age:secondary|lay:2+kk",
      },
    });
    expect(trend.changePct).toBe(10);
    expect(trend.direction).toBe("up");
    expect(trend.compositionStable).toBe(true);
  });

  it("nullifies trend when segment composition changes", () => {
    const trend = computePeriodTrend({
      metricKey: "property_market.median_asking_price_sqm",
      segmentKey: "pt:APARTMENT|age:secondary|lay:2+kk",
      current: {
        period: "2026-06",
        calculatedAt: new Date("2026-06-01"),
        value: 105,
        sampleCount: 20,
        segmentKey: "pt:APARTMENT|age:secondary|lay:2+kk",
      },
      previous: {
        period: "2026-05",
        calculatedAt: new Date("2026-05-01"),
        value: 100,
        sampleCount: 20,
        segmentKey: "pt:HOUSE|age:secondary|lay:ALL",
      },
    });
    expect(trend.compositionStable).toBe(false);
    expect(trend.changePct).toBeNull();
  });
});
