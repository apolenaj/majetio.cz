import { describe, expect, it } from "vitest";

import { resolveGeoTier, haversineMeters } from "./geo-hierarchy";
import { timeDecayWeight, daysBetween } from "./time-decay";
import {
  computeSimilarityScore,
  normalizeLayout,
  areaSimilarity,
} from "./similarity";
import { detectOutliers, iqrBounds } from "./outliers";
import {
  weightedMedian,
  weightedMean,
  computeBaseValuation,
  resolvePricePerSqm,
} from "./base-valuation";
import {
  computeFeatureAdjustments,
  applyAdjustments,
} from "./adjustments";
import { selectAndWeightComparables } from "./comparable-selection";
import { runValuationCore } from "./index";
import type { ComparableCandidate, ValuationSubject } from "./types";

const subject: ValuationSubject = {
  id: "subj",
  propertyType: "APARTMENT",
  usableArea: 70,
  layout: "3+kk",
  condition: "GOOD",
  floor: 3,
  floorsTotal: 5,
  hasBalcony: true,
  hasElevator: true,
  city: "Praha",
  district: "Vinohrady",
  region: "Hlavní město Praha",
  latitude: 50.075,
  longitude: 14.44,
};

function cand(
  partial: Partial<ComparableCandidate> & Pick<ComparableCandidate, "id">,
): ComparableCandidate {
  return {
    usableArea: 68,
    layout: "3+kk",
    condition: "GOOD",
    floor: 2,
    floorsTotal: 5,
    hasBalcony: false,
    hasElevator: true,
    city: "Praha",
    district: "Vinohrady",
    region: "Hlavní město Praha",
    latitude: 50.076,
    longitude: 14.441,
    priceCzk: 6_000_000,
    pricePerSqm: null,
    observedAt: "2026-06-01T00:00:00.000Z",
    ...partial,
  };
}

describe("geo hierarchy", () => {
  it("classifies same district as MICRO", () => {
    const { tier } = resolveGeoTier(subject, cand({ id: "a" }));
    expect(tier).toBe("MICRO");
  });

  it("classifies same city different district as NEIGHBOR", () => {
    const { tier } = resolveGeoTier(
      subject,
      cand({ id: "b", district: "Žižkov" }),
    );
    expect(tier).toBe("NEIGHBOR");
  });

  it("classifies other region as OUT_OF_SCOPE", () => {
    const { tier } = resolveGeoTier(
      subject,
      cand({
        id: "c",
        city: "Brno",
        district: "střed",
        region: "Jihomoravský kraj",
        latitude: 49.2,
        longitude: 16.6,
      }),
    );
    expect(tier).toBe("OUT_OF_SCOPE");
  });

  it("computes haversine for nearby points", () => {
    const d = haversineMeters(subject, {
      latitude: 50.076,
      longitude: 14.441,
    });
    expect(d).not.toBeNull();
    expect(d!).toBeGreaterThan(0);
    expect(d!).toBeLessThan(500);
  });
});

describe("time decay", () => {
  it("gives ~1 for fresh observations", () => {
    const w = timeDecayWeight("2026-07-18T00:00:00.000Z", {
      asOf: new Date("2026-07-19T00:00:00.000Z"),
    });
    expect(w).toBeGreaterThan(0.95);
  });

  it("decays toward half after one half-life year", () => {
    const w = timeDecayWeight("2025-07-19T00:00:00.000Z", {
      asOf: new Date("2026-07-19T00:00:00.000Z"),
      halfLifeDays: 365,
    });
    expect(w).toBeCloseTo(0.5, 1);
  });

  it("parses day gaps", () => {
    expect(
      daysBetween("2026-07-01T00:00:00.000Z", new Date("2026-07-19T00:00:00.000Z")),
    ).toBe(18);
  });
});

describe("similarity", () => {
  it("normalizes layouts", () => {
    expect(normalizeLayout("3+kk")).toBe("3+kk");
    expect(normalizeLayout("3 kk")).toBe("3+kk");
  });

  it("scores identical comps high", () => {
    const s = computeSimilarityScore(subject, cand({ id: "x" }));
    expect(s).toBeGreaterThan(0.9);
  });

  it("penalizes large area mismatch", () => {
    expect(areaSimilarity(70, 35)).toBeLessThan(0.55);
  });
});

describe("outliers", () => {
  it("computes IQR bounds", () => {
    const b = iqrBounds([10, 12, 14, 15, 16, 18, 100]);
    expect(b).not.toBeNull();
    expect(b!.upper).toBeLessThan(100);
  });

  it("marks extreme price and bad area as excluded with reason", () => {
    const marks = detectOutliers([
      { id: "1", pricePerSqm: 80_000, usableArea: 70 },
      { id: "2", pricePerSqm: 82_000, usableArea: 72 },
      { id: "3", pricePerSqm: 79_000, usableArea: 68 },
      { id: "4", pricePerSqm: 81_000, usableArea: 71 },
      { id: "lux", pricePerSqm: 250_000, usableArea: 70 },
      { id: "bad", pricePerSqm: 80_000, usableArea: 5 },
    ]);
    expect(marks.find((m) => m.id === "lux")?.excluded).toBe(true);
    expect(marks.find((m) => m.id === "lux")?.reason).toMatch(/Outlier/i);
    expect(marks.find((m) => m.id === "bad")?.excluded).toBe(true);
    expect(marks.find((m) => m.id === "bad")?.reason).toMatch(/plocha/i);
  });
});

describe("base valuation", () => {
  it("resolves ppsqm from price/area", () => {
    expect(resolvePricePerSqm(7_000_000, 70, null)).toBe(100_000);
  });

  it("computes weighted median", () => {
    expect(
      weightedMedian([
        { value: 10, weight: 1 },
        { value: 20, weight: 1 },
        { value: 100, weight: 0.1 },
      ]),
    ).toBe(20);
  });

  it("computes weighted mean", () => {
    expect(
      weightedMean([
        { value: 10, weight: 1 },
        { value: 30, weight: 1 },
      ]),
    ).toBe(20);
  });
});

describe("feature adjustments", () => {
  it("adds balcony factor with amount and reason", () => {
    const adj = computeFeatureAdjustments(
      subject,
      [
        cand({ id: "1", hasBalcony: false }),
        cand({ id: "2", hasBalcony: false }),
        cand({ id: "3", hasBalcony: false }),
      ],
      6_000_000,
    );
    const balcony = adj.find((a) => a.code === "balcony");
    expect(balcony).toBeDefined();
    expect(balcony!.factor).toBe(0.02);
    expect(balcony!.amountCzk).toBe(120_000);
    expect(balcony!.reason).toMatch(/Balkon/i);
  });

  it("applies sum of factors to base", () => {
    expect(
      applyAdjustments(1_000_000, [
        { code: "a", factor: 0.02, amountCzk: 20_000, reason: "x" },
        { code: "b", factor: -0.01, amountCzk: -10_000, reason: "y" },
      ]),
    ).toBe(1_010_000);
  });
});

describe("selection + core pipeline", () => {
  const asOf = new Date("2026-07-19T00:00:00.000Z");

  const pool: ComparableCandidate[] = [
    cand({ id: "m1", priceCzk: 5_950_000, observedAt: "2026-05-01T00:00:00.000Z" }),
    cand({ id: "m2", priceCzk: 6_100_000, observedAt: "2026-04-01T00:00:00.000Z" }),
    cand({ id: "m3", priceCzk: 6_050_000, observedAt: "2026-06-15T00:00:00.000Z" }),
    cand({ id: "m4", priceCzk: 5_900_000, observedAt: "2026-03-01T00:00:00.000Z" }),
    cand({
      id: "n1",
      district: "Žižkov",
      priceCzk: 5_700_000,
      latitude: 50.085,
      longitude: 14.45,
    }),
    cand({
      id: "outlier",
      priceCzk: 18_000_000,
      usableArea: 70,
      pricePerSqm: 257_000,
    }),
    cand({
      id: "brno",
      city: "Brno",
      district: "střed",
      region: "Jihomoravský kraj",
      latitude: 49.2,
      longitude: 16.6,
      priceCzk: 4_000_000,
    }),
  ];

  it("weights MICRO higher than NEIGHBOR and excludes out-of-scope by default", () => {
    const scored = selectAndWeightComparables(subject, pool, { asOf });
    const micro = scored.find((s) => s.candidate.id === "m1");
    const neighbor = scored.find((s) => s.candidate.id === "n1");
    expect(micro?.geoTier).toBe("MICRO");
    expect(neighbor?.geoTier).toBe("NEIGHBOR");
    expect(micro!.geoWeight).toBeGreaterThan(neighbor!.geoWeight);
    expect(scored.find((s) => s.candidate.id === "brno")).toBeUndefined();
  });

  it("marks outlier excluded with reason but keeps it in list", () => {
    const scored = selectAndWeightComparables(subject, pool, { asOf });
    const lux = scored.find((s) => s.candidate.id === "outlier");
    expect(lux).toBeDefined();
    expect(lux!.included).toBe(false);
    expect(lux!.exclusionReason).toMatch(/Outlier/i);
  });

  it("produces base value and adjustments without inventing zeros", () => {
    const result = runValuationCore(subject, pool, { asOf });
    expect(result.base.method).toBe("weighted_median_ppsqm");
    expect(result.base.baseValueCzk).toBeGreaterThan(0);
    expect(result.base.pricePerSqmWeightedMedian).toBeGreaterThan(0);
    expect(result.adjustedValueCzk).toBeGreaterThan(0);
    expect(result.comparables.some((c) => c.included)).toBe(true);
    // weights of included sum ~ 1
    const wSum = result.comparables
      .filter((c) => c.included)
      .reduce((s, c) => s + c.weight, 0);
    expect(wSum).toBeCloseTo(1, 5);
  });

  it("returns insufficient when no usable comps", () => {
    const result = runValuationCore(subject, [], { asOf });
    expect(result.base.method).toBe("insufficient_comps");
    expect(result.base.baseValueCzk).toBeNull();
    expect(result.adjustedValueCzk).toBeNull();
  });
});
