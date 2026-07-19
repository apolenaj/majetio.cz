import { describe, expect, it } from "vitest";

import { computeValuationRange } from "./range";
import { computeConfidence, MIN_COMPS_FOR_ESTIMATE } from "./confidence";
import { evaluateSubjectEdgeCases } from "./edge-cases";
import {
  shouldRecalculateValuation,
  buildSubjectFingerprint,
  DEFAULT_VALUATION_MAX_AGE_DAYS,
} from "./staleness";
import { runValuationEstimate, VALUATION_CORE_ENGINE_VERSION } from "./index";
import type { ComparableCandidate, ScoredComparable, ValuationSubject } from "./types";

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

function scored(
  id: string,
  pps: number,
  weight: number,
  extras: Partial<ScoredComparable> = {},
): ScoredComparable {
  return {
    candidate: cand({ id, pricePerSqm: pps, priceCzk: Math.round(pps * 70) }),
    pricePerSqm: pps,
    geoTier: "MICRO",
    geoWeight: 1,
    timeDecayWeight: 1,
    similarityScore: 0.9,
    rawWeight: weight,
    weight,
    included: true,
    exclusionReason: null,
    distanceMeters: 100,
    ...extras,
  };
}

describe("valuation range", () => {
  it("computes lower/upper from weighted quantiles", () => {
    const comps = [
      scored("a", 80_000, 1),
      scored("b", 90_000, 1),
      scored("c", 100_000, 1),
      scored("d", 110_000, 1),
      scored("e", 120_000, 1),
    ];
    const range = computeValuationRange({
      comps,
      subjectUsableArea: 70,
      midValueCzk: 7_000_000,
      adjustments: [],
    });
    expect(range.method).toBe("weighted_quantile_ppsqm");
    expect(range.lowerBoundCzk).not.toBeNull();
    expect(range.upperBoundCzk).not.toBeNull();
    expect(range.lowerBoundCzk!).toBeLessThan(range.upperBoundCzk!);
    expect(range.relativeWidth).toBeGreaterThan(0);
  });

  it("returns insufficient when fewer than 2 comps", () => {
    const range = computeValuationRange({
      comps: [scored("a", 90_000, 1)],
      subjectUsableArea: 70,
      midValueCzk: 6_000_000,
      adjustments: [],
    });
    expect(range.method).toBe("insufficient_comps");
    expect(range.lowerBoundCzk).toBeNull();
  });
});

describe("confidence", () => {
  it("marks insufficient below min comps", () => {
    const conf = computeConfidence({
      includedComps: [scored("a", 90_000, 1), scored("b", 91_000, 1)],
      range: {
        lowerPricePerSqm: null,
        upperPricePerSqm: null,
        lowerBoundCzk: null,
        upperBoundCzk: null,
        relativeWidth: null,
        method: "insufficient_comps",
      },
    });
    expect(conf.level).toBe("INSUFFICIENT");
    expect(conf.explanations[0]).toMatch(/Méně než/);
    expect(MIN_COMPS_FOR_ESTIMATE).toBe(3);
  });

  it("applies dispersion penalty with Czech reason", () => {
    const conf = computeConfidence({
      includedComps: [
        scored("a", 50_000, 1),
        scored("b", 90_000, 1),
        scored("c", 140_000, 1),
        scored("d", 55_000, 1),
        scored("e", 130_000, 1),
      ],
      range: {
        lowerPricePerSqm: 50_000,
        upperPricePerSqm: 140_000,
        lowerBoundCzk: 3_500_000,
        upperBoundCzk: 9_800_000,
        relativeWidth: 0.9,
        method: "weighted_quantile_ppsqm",
      },
    });
    expect(conf.penalties.some((p) => p.code.includes("dispersion") || p.code === "wide_range")).toBe(
      true,
    );
    expect(conf.score).toBeLessThan(100);
    expect(conf.explanations.length).toBeGreaterThan(0);
  });
});

describe("edge cases", () => {
  it("blocks shell / huge apartments", () => {
    const shell = evaluateSubjectEdgeCases({
      ...subject,
      condition: "SHELL",
    });
    expect(shell.blockAutomated).toBe(true);
    expect(shell.status).toBe("REQUIRES_INDIVIDUAL_APPRAISAL");

    const huge = evaluateSubjectEdgeCases({
      ...subject,
      usableArea: 280,
    });
    expect(huge.blockAutomated).toBe(true);
    expect(huge.reasons.join(" ")).toMatch(/individuální/i);
  });

  it("allows ordinary apartment", () => {
    expect(evaluateSubjectEdgeCases(subject).blockAutomated).toBe(false);
  });
});

describe("staleness / recalculation", () => {
  const fp = buildSubjectFingerprint(subject);

  it("uses cache when fresh and unchanged", () => {
    const decision = shouldRecalculateValuation(
      {
        calculatedAt: "2026-07-15T00:00:00.000Z",
        inputAskingPriceCzk: 6_500_000,
        subjectFingerprint: fp,
        modelVersion: VALUATION_CORE_ENGINE_VERSION,
      },
      {
        now: new Date("2026-07-19T00:00:00.000Z"),
        currentAskingPriceCzk: 6_500_000,
        currentSubjectFingerprint: fp,
        currentModelVersion: VALUATION_CORE_ENGINE_VERSION,
      },
    );
    expect(decision.useCache).toBe(true);
    expect(decision.shouldRecalculate).toBe(false);
  });

  it("recalculates on price change, age, manual, fingerprint", () => {
    const baseCached = {
      calculatedAt: "2026-07-15T00:00:00.000Z",
      inputAskingPriceCzk: 6_500_000,
      subjectFingerprint: fp,
      modelVersion: VALUATION_CORE_ENGINE_VERSION,
    };

    expect(
      shouldRecalculateValuation(baseCached, {
        now: new Date("2026-07-19T00:00:00.000Z"),
        currentAskingPriceCzk: 7_000_000,
        currentSubjectFingerprint: fp,
        currentModelVersion: VALUATION_CORE_ENGINE_VERSION,
      }).shouldRecalculate,
    ).toBe(true);

    expect(
      shouldRecalculateValuation(
        {
          ...baseCached,
          calculatedAt: "2026-06-01T00:00:00.000Z",
        },
        {
          now: new Date("2026-07-19T00:00:00.000Z"),
          currentAskingPriceCzk: 6_500_000,
          currentSubjectFingerprint: fp,
          currentModelVersion: VALUATION_CORE_ENGINE_VERSION,
          maxAgeDays: DEFAULT_VALUATION_MAX_AGE_DAYS,
        },
      ).reasons.join(" "),
    ).toMatch(/starší/);

    expect(
      shouldRecalculateValuation(baseCached, {
        now: new Date("2026-07-19T00:00:00.000Z"),
        currentAskingPriceCzk: 6_500_000,
        currentSubjectFingerprint: fp,
        currentModelVersion: VALUATION_CORE_ENGINE_VERSION,
        manualRequest: true,
      }).reasons.join(" "),
    ).toMatch(/Ruční/);

    expect(
      shouldRecalculateValuation(null, {
        currentAskingPriceCzk: 6_500_000,
        currentSubjectFingerprint: fp,
        currentModelVersion: VALUATION_CORE_ENGINE_VERSION,
      }).useCache,
    ).toBe(false);
  });
});

describe("runValuationEstimate", () => {
  const asOf = new Date("2026-07-19T00:00:00.000Z");
  const pool: ComparableCandidate[] = [
    cand({ id: "m1", priceCzk: 5_950_000 }),
    cand({ id: "m2", priceCzk: 6_100_000 }),
    cand({ id: "m3", priceCzk: 6_050_000 }),
    cand({ id: "m4", priceCzk: 5_900_000 }),
    cand({ id: "m5", priceCzk: 6_200_000 }),
  ];

  it("returns CALCULATED with bounds and confidence", () => {
    const result = runValuationEstimate(subject, pool, { asOf });
    expect(result.status).toBe("CALCULATED");
    expect(result.adjustedValueCzk).toBeGreaterThan(0);
    expect(result.lowerBoundCzk).toBeLessThanOrEqual(result.adjustedValueCzk!);
    expect(result.upperBoundCzk).toBeGreaterThanOrEqual(result.adjustedValueCzk!);
    expect(result.confidenceScore).toBeGreaterThan(0);
    expect(result.confidenceLevel).not.toBe("INSUFFICIENT");
  });

  it("does not invent estimate without comps", () => {
    const result = runValuationEstimate(subject, [], { asOf });
    expect(result.status).toBe("INSUFFICIENT_DATA");
    expect(result.adjustedValueCzk).toBeNull();
    expect(result.lowerBoundCzk).toBeNull();
    expect(result.upperBoundCzk).toBeNull();
    expect(result.confidenceLevel).toBe("INSUFFICIENT");
    expect(result.statusReason).toBeTruthy();
  });

  it("blocks unique properties", () => {
    const result = runValuationEstimate(
      { ...subject, usableArea: 300, condition: "SHELL" },
      pool,
      { asOf },
    );
    expect(result.status).toBe("REQUIRES_INDIVIDUAL_APPRAISAL");
    expect(result.adjustedValueCzk).toBeNull();
  });
});
