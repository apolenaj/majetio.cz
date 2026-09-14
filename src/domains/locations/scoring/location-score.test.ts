import { describe, expect, it } from "vitest";

import {
  buildAccessibilityProfile,
  computeLocationScore,
  computeLocationMatchScore,
  assertAllowedScoreInput,
  ProhibitedScoreInputError,
  type LocationScoreInput,
  type PoiRecord,
} from "@/domains/locations/scoring";
import type { EnvironmentalProfile } from "@/domains/locations/scoring/environment/types";

const BASE_POIS: PoiRecord[] = [
  {
    id: "s1",
    category: "SCHOOL",
    name: "ZŠ Test",
    latitude: 50.076,
    longitude: 14.44,
    source: "MŠMT registry (demo)",
    sourceDate: "2026-01-01",
  },
  {
    id: "g1",
    category: "GREEN_SPACE",
    name: "Park",
    latitude: 50.0755,
    longitude: 14.441,
    source: "OSM (demo)",
    sourceDate: "2026-01-01",
  },
  {
    id: "m1",
    category: "METRO_STATION",
    name: "Náměstí Míru",
    latitude: 50.0753,
    longitude: 14.439,
    source: "DPP (demo)",
    sourceDate: "2026-01-01",
  },
];

const MARKET_INPUT: LocationScoreInput["market"] = {
  medianAskingPriceSqm: 142_000,
  medianTransactionPriceSqm: 128_000,
  medianAskingRentSqm: 420,
  grossRentalYieldPct: 3.55,
  medianDaysOnMarket: 38,
  activeListingsCount: 620,
  priceReductionRate: 0.22,
  sampleCounts: { transaction: 86 },
};

function fullScoreInput(overrides?: Partial<LocationScoreInput>): LocationScoreInput {
  const centroid = { latitude: 50.0755, longitude: 14.4378 };
  return {
    locationId: "loc_test",
    segmentKey: "pt:APARTMENT|age:secondary|lay:2+kk",
    market: MARKET_INPUT,
    accessibility: buildAccessibilityProfile({
      locationId: "loc_test",
      centroid,
      pois: BASE_POIS,
    }),
    environment: null,
    ...overrides,
  };
}

describe("guardrails", () => {
  it("rejects prohibited demographic score keys", () => {
    expect(() => assertAllowedScoreInput("safety_score_neighborhood")).toThrow(
      ProhibitedScoreInputError,
    );
  });
});

describe("LocationScore dimensions", () => {
  it("returns null score when market data missing — not 0", () => {
    const result = computeLocationScore(
      fullScoreInput({ market: { medianDaysOnMarket: null, activeListingsCount: null } }),
    );
    const liquidity = result.dimensions.find((d) => d.dimension === "MARKET_LIQUIDITY");
    expect(liquidity?.score).toBeNull();
    expect(liquidity?.availability).toBe("insufficient_data");
  });

  it("computes separate dimensions — no single universal score in result", () => {
    const result = computeLocationScore(fullScoreInput());
    expect(result.dimensions.length).toBe(4);
    const available = result.dimensions.filter((d) => d.score != null);
    expect(available.length).toBeGreaterThan(0);
    expect(result.strategyComposite).toBeNull();
  });

  it("exposes composite only when primary dimension requested and available", () => {
    const result = computeLocationScore(fullScoreInput(), {
      primaryDimension: "RENTAL_INVESTMENT_FIT",
    });
    expect(result.strategyComposite?.dimension).toBe("RENTAL_INVESTMENT_FIT");
    expect(result.strategyComposite?.score).toBeGreaterThan(0);
  });
});

describe("accessibility", () => {
  it("does not treat all POI categories equally for rental vs own-use", () => {
    const profile = buildAccessibilityProfile({
      locationId: "x",
      centroid: { latitude: 50.0755, longitude: 14.4378 },
      pois: BASE_POIS,
    });
    expect(profile.subIndices.some((s) => s.value != null)).toBe(true);
    expect(profile.methodologyVersion).toContain("majetio-accessibility");
  });
});

describe("environment signals", () => {
  it("includes source and status in environmental profile", () => {
    const env: EnvironmentalProfile = {
      locationId: "loc",
      methodologyVersion: "env.v1",
      computedAt: "2026-07-01",
      signals: [
        {
          id: "f1",
          type: "FLOOD_ZONE",
          status: "PLANNED",
          title: "Záplavové území Q100",
          description: "Oficiální DTM vrstva",
          source: "DIBAVOD / DTM ČR",
          sourceDate: "2025-06-01",
          verifiedAt: "2026-07-01",
          severity: "material",
        },
      ],
    };
    const result = computeLocationScore(fullScoreInput({ environment: env }), {
      primaryDimension: "OWN_USE_FIT",
    });
    const own = result.dimensions.find((d) => d.dimension === "OWN_USE_FIT");
    expect(own?.explanations.some((e) => e.includes("Záplav"))).toBe(true);
  });
});

describe("LocationMatchScore", () => {
  it("is explainable with Czech reasons", () => {
    const match = computeLocationMatchScore({
      scoreInput: fullScoreInput(),
      preferences: {
        preferredCity: "Praha",
        maxPriceCzk: 12_000_000,
        goal: "INVESTMENT",
        strategies: ["dlouhodoby-pronajem"],
        targetGrossYieldPct: 3.5,
      },
      locationName: "Praha",
      locationSlug: "praha",
    });
    expect(match.reasons.length).toBeGreaterThan(0);
    expect(match.reasons.some((r) => r.label.includes("Praha"))).toBe(true);
  });

  it("returns unavailable match when profile incomplete", () => {
    const match = computeLocationMatchScore({
      scoreInput: fullScoreInput(),
      preferences: {},
      locationName: "Praha",
      locationSlug: "praha",
    });
    expect(match.available).toBe(false);
    expect(match.score).toBeNull();
  });
});
