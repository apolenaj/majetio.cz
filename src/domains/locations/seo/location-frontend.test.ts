/**
 * Location frontend SEO, URLs, dynamic summary, geohash privacy.
 */

import { describe, expect, it } from "vitest";

import { LOCATION_DEMO_PROFILES } from "@/domains/locations/content/demo-profiles";
import { buildDynamicMarketSummary } from "@/domains/locations/seo/dynamic-summary";
import { buildLocationSeoJsonLd } from "@/domains/locations/seo/json-ld";
import {
  isLocationPageIndexable,
  resolveLocationPathSegments,
} from "@/domains/locations/seo/location-urls";
import {
  aggregateToGeohashGrid,
  encodeGeohash,
  MAP_CELL_MIN_SAMPLES,
} from "@/domains/locations/maps/geohash-grid";

describe("location URL resolution", () => {
  it("resolves nested /lokality/praha/vinohrady", () => {
    const r = resolveLocationPathSegments(["praha", "vinohrady"]);
    expect(r?.canonicalPath).toBe("/lokality/praha/vinohrady");
    expect(r?.profile.location.slug).toBe("praha-vinohrady");
    expect(r?.needsCanonicalRedirect).toBe(false);
  });

  it("redirects flat alias praha-vinohrady to nested canonical", () => {
    const r = resolveLocationPathSegments(["praha-vinohrady"]);
    expect(r?.canonicalPath).toBe("/lokality/praha/vinohrady");
    expect(r?.needsCanonicalRedirect).toBe(true);
  });
});

describe("thin pages / indexability", () => {
  it("never indexes synthetic demo profiles as production SEO", () => {
    expect(isLocationPageIndexable(LOCATION_DEMO_PROFILES.praha!)).toBe(false);
    expect(isLocationPageIndexable(LOCATION_DEMO_PROFILES.liberec!)).toBe(false);
  });

  it("noindexes empty profile", () => {
    const thin = {
      ...LOCATION_DEMO_PROFILES.praha!,
      isDemo: false,
      summary: LOCATION_DEMO_PROFILES.praha!.summary.map((m) => ({
        ...m,
        sampleCount: 2,
        confidence: 0.1,
      })),
    };
    expect(isLocationPageIndexable(thin)).toBe(false);
  });

  it("indexes non-demo profile with enough samples", () => {
    const live = {
      ...LOCATION_DEMO_PROFILES.praha!,
      isDemo: false,
    };
    expect(isLocationPageIndexable(live)).toBe(true);
  });
});

describe("dynamic market summary", () => {
  it("mentions median asking price from real metrics", () => {
    const text = buildDynamicMarketSummary(LOCATION_DEMO_PROFILES.praha!);
    expect(text).toContain("Medián nabídkových cen");
    expect(text).toContain("142 000");
    expect(text).not.toMatch(/AI|generick/i);
  });
});

describe("JSON-LD", () => {
  it("emits BreadcrumbList + Place without AggregateRating", () => {
    const ld = buildLocationSeoJsonLd(LOCATION_DEMO_PROFILES.praha!);
    const serialized = JSON.stringify(ld);
    expect(serialized).toContain("BreadcrumbList");
    expect(serialized).toContain('"@type":"Place"');
    expect(serialized).not.toContain("AggregateRating");
    expect(serialized).not.toContain("aggregateRating");
  });
});

describe("geohash privacy aggregation", () => {
  it("encodes stable geohash", () => {
    expect(encodeGeohash(50.0755, 14.4378, 6).length).toBe(6);
  });

  it("suppresses cells below min sample threshold", () => {
    const cells = aggregateToGeohashGrid(
      [
        { latitude: 50.07, longitude: 14.43, value: 100 },
        { latitude: 50.0701, longitude: 14.4301, value: 110 },
      ],
      6,
      MAP_CELL_MIN_SAMPLES,
    );
    expect(cells.every((c) => c.sampleCount >= MAP_CELL_MIN_SAMPLES)).toBe(true);
    expect(cells.length).toBe(0);
  });

  it("publishes cells with enough samples", () => {
    const observations = Array.from({ length: 8 }, (_, i) => ({
      latitude: 50.07 + i * 0.0001,
      longitude: 14.43 + i * 0.0001,
      value: 100_000 + i * 1000,
    }));
    const cells = aggregateToGeohashGrid(observations, 6);
    expect(cells.length).toBeGreaterThan(0);
    expect(cells[0]!.sampleCount).toBeGreaterThanOrEqual(MAP_CELL_MIN_SAMPLES);
  });
});
