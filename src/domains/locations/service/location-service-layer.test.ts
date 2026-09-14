/**
 * Location Intelligence service layer — DTOs, cache keys, job idempotency.
 */

import { describe, expect, it } from "vitest";

import type {
  InternalLocationMetricDto,
  PublicLocationDto,
  PublicMetricPointDto,
} from "@/domains/locations/dto";
import {
  buildComparisonCacheKey,
  buildLocationCacheKey,
  buildMarketSummaryCacheKey,
  getCached,
  invalidateLocationCachePrefix,
  setCached,
} from "@/domains/locations/cache/location-cache";
import { buildLocationJobIdempotencyKey } from "@/domains/locations/jobs/idempotency";
import { toPublicLocationDto } from "@/domains/locations/service/dto-mappers";

describe("Location DTOs — public safety", () => {
  it("PublicLocationDto rounds centroid (~100m) and never keeps raw street coords", () => {
    const dto = toPublicLocationDto({
      id: "loc1",
      slug: "praha-2",
      name: "Praha 2",
      publicLabel: "Praha 2",
      type: "CITY_DISTRICT",
      countryCode: "CZ",
      centroidLat: 50.07512345,
      centroidLon: 14.43798765,
      latitude: 50.07512345,
      longitude: 14.43798765,
    });

    expect(dto.kind).toBe("public");
    expect(dto.centroid).toEqual({
      latitude: 50.075,
      longitude: 14.438,
    });
    expect(dto.mapPrecision).toBe("DISTRICT");
    // Public shape must not include private address fields
    expect(dto).not.toHaveProperty("street");
    expect(dto).not.toHaveProperty("houseNumber");
    expect(dto).not.toHaveProperty("rawPayload");
  });

  it("PublicMetricPointDto shape excludes source payloads", () => {
    const publicPoint: PublicMetricPointDto = {
      metricKey: "median_asking_price_sqm",
      label: "Medián nabídkové ceny",
      value: 120000,
      unit: "CZK/m2",
      period: "2026-Q1",
      sampleCount: 40,
      confidence: 0.8,
      freshness: "FRESH",
      priceKind: "ASKING",
      segmentKey: "APARTMENT",
      methodologyVersion: "v1",
      fallbackMessage: null,
    };
    expect(publicPoint).not.toHaveProperty("source");
    expect(publicPoint).not.toHaveProperty("dataSourceId");
    expect(publicPoint).not.toHaveProperty("diagnostics");
    expect(publicPoint).not.toHaveProperty("reviewRequired");
  });

  it("InternalLocationMetricDto may include diagnostics (internal only)", () => {
    const internal: InternalLocationMetricDto = {
      kind: "internal",
      id: "m1",
      locationId: "loc1",
      metricKey: "median_asking_price_sqm",
      category: "PRICE",
      value: 120000,
      unit: "CZK/m2",
      period: "2026-Q1",
      source: "provider_x",
      sourceType: "LISTING",
      sourceQuality: "MEDIUM",
      dataSourceId: "ds1",
      priceKind: "ASKING",
      segmentKey: "APARTMENT",
      segment: { propertyType: "APARTMENT" },
      sampleCount: 40,
      meanValue: 125000,
      lowerQuartile: 110000,
      upperQuartile: 135000,
      confidence: 0.8,
      freshness: "FRESH",
      reviewRequired: false,
      fallbackFromLocationId: null,
      methodologyVersion: "v1",
      calculatedAt: new Date().toISOString(),
      validFrom: new Date().toISOString(),
      validTo: null,
      publishedAt: new Date().toISOString(),
      diagnostics: { outliersRemoved: 2, anomalyCodes: [] },
    };
    expect(internal.kind).toBe("internal");
    expect(internal.diagnostics?.outliersRemoved).toBe(2);
  });
});

describe("Location cache keys", () => {
  it("builds stable keys by location + segment + period + methodology", () => {
    const dims = {
      locationIdOrSlug: "praha",
      segmentKey: "APARTMENT",
      period: "2026-Q1",
      methodologyVersion: "loc-ingest-1",
    };
    const a = buildMarketSummaryCacheKey(dims);
    const b = buildMarketSummaryCacheKey(dims);
    expect(a).toBe(b);
    expect(a.startsWith("loc:market-summary:")).toBe(true);

    const other = buildMarketSummaryCacheKey({
      ...dims,
      period: "2026-Q2",
    });
    expect(other).not.toBe(a);
  });

  it("comparison key is order-independent for slugs", () => {
    const a = buildComparisonCacheKey({
      slugs: ["brno", "praha"],
      segmentKey: "_all",
      period: "trailing_12m",
      methodologyVersion: "v1",
    });
    const b = buildComparisonCacheKey({
      slugs: ["praha", "brno"],
      segmentKey: "_all",
      period: "trailing_12m",
      methodologyVersion: "v1",
    });
    expect(a).toBe(b);
  });

  it("TTL cache get/set/invalidate works", () => {
    const key = buildLocationCacheKey("test", {
      locationIdOrSlug: "x",
      segmentKey: "_all",
      period: "p",
      methodologyVersion: "v",
    });
    setCached(key, { ok: true }, 60_000);
    expect(getCached<{ ok: boolean }>(key)).toEqual({ ok: true });
    expect(invalidateLocationCachePrefix("loc:")).toBeGreaterThanOrEqual(1);
    expect(getCached(key)).toBeNull();
  });
});

describe("Job idempotency", () => {
  it("same period + methodology → same key", () => {
    const a = buildLocationJobIdempotencyKey({
      job: "metric_aggregation",
      period: "2026-Q1",
      methodologyVersion: "loc-ingest-1",
    });
    const b = buildLocationJobIdempotencyKey({
      job: "metric_aggregation",
      period: "2026-Q1",
      methodologyVersion: "loc-ingest-1",
    });
    expect(a).toBe(b);
  });

  it("different jobs / periods do not collide", () => {
    const agg = buildLocationJobIdempotencyKey({
      job: "metric_aggregation",
      period: "2026-Q1",
      methodologyVersion: "v1",
    });
    const refresh = buildLocationJobIdempotencyKey({
      job: "data_refresh",
      period: "2026-Q1",
      methodologyVersion: "v1",
    });
    const otherPeriod = buildLocationJobIdempotencyKey({
      job: "metric_aggregation",
      period: "2026-Q2",
      methodologyVersion: "v1",
    });
    expect(agg).not.toBe(refresh);
    expect(agg).not.toBe(otherPeriod);
  });
});

describe("PublicLocationDto type brand", () => {
  it("kind discriminates public vs internal", () => {
    const pub: PublicLocationDto = {
      kind: "public",
      id: "1",
      slug: "praha",
      name: "Praha",
      publicLabel: "Praha",
      type: "CITY",
      hierarchyLabel: "Město",
      countryCode: "CZ",
      centroid: null,
      mapPrecision: "CITY",
    };
    expect(pub.kind).toBe("public");
  });
});
