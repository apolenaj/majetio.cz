import { describe, expect, it, beforeEach } from "vitest";

import { computeNegotiationSpace, computeDaysOnMarket, modeledMaxFromValuation } from "./negotiation-space";
import { buildRenovationDecisionMetrics } from "./renovation-metrics";
import { summarizeRisks } from "./risk-summary";
import {
  collectDecisionGaps,
  completenessFromGaps,
} from "./completeness";
import { buildDecisionAdvice, buildPropertyNextAction } from "./advice";
import { detectStaleDiffs, formatAskingPriceDiffCs } from "./fingerprints";
import {
  assertPublicMetricsOnly,
  clearComparisonPublicCacheForTests,
  setCachedPublicMetrics,
  buildPublicMetricsCacheKey,
} from "./public-module-cache";
import type {
  ComparisonPublicPropertyMetrics,
  PropertyPublicFingerprint,
  ScoredMetric,
} from "./types";

function emptyScore(partial?: Partial<ScoredMetric>): ScoredMetric {
  return {
    score: null,
    confidence: "unknown",
    confidenceScore: null,
    breakdown: [],
    ...partial,
  };
}

describe("negotiation space (BOD 93–94)", () => {
  it("computes asking vs max offer gap without inventing zeros", () => {
    const space = computeNegotiationSpace({
      askingPriceCzk: 6_500_000,
      modeledMaxOfferCzk: 6_000_000,
      daysOnMarket: 60,
      recentPriceDropCzk: 200_000,
    });
    expect(space.gapCzk).toBe(500_000);
    expect(space.gapPct).toBeCloseTo(7.69, 1);
    expect(space.summaryCs).toContain("nad modelovaným maximem");
    expect(space.summaryCs).toContain("60 dní");
  });

  it("returns null gap when max offer missing", () => {
    const space = computeNegotiationSpace({
      askingPriceCzk: 5_000_000,
      modeledMaxOfferCzk: null,
      daysOnMarket: null,
    });
    expect(space.gapCzk).toBeNull();
    expect(space.gapPct).toBeNull();
  });

  it("derives days on market and valuation-based max", () => {
    expect(computeDaysOnMarket(new Date(Date.now() - 10 * 86_400_000))).toBe(10);
    expect(modeledMaxFromValuation(10_000_000, 0.05)).toBe(9_500_000);
    expect(modeledMaxFromValuation(null)).toBeNull();
  });
});

describe("renovation metrics (BOD 95)", () => {
  it("computes value creation from ARV − (asking + base)", () => {
    const reno = buildRenovationDecisionMetrics({
      costLowCzk: 400_000,
      costBaseCzk: 500_000,
      costHighCzk: 700_000,
      durationDays: 90,
      arvCzk: 7_500_000,
      askingPriceCzk: 6_000_000,
      confidenceScore: 60,
    });
    expect(reno.valueCreationCzk).toBe(1_000_000);
    expect(reno.confidence).toBe("medium");
  });

  it("leaves value creation null when inputs missing", () => {
    const reno = buildRenovationDecisionMetrics({
      costLowCzk: null,
      costBaseCzk: null,
      costHighCzk: null,
      durationDays: null,
      arvCzk: null,
      askingPriceCzk: 5_000_000,
    });
    expect(reno.valueCreationCzk).toBeNull();
    expect(reno.confidence).toBe("unknown");
  });
});

describe("risks by severity (BOD 97–98)", () => {
  it("counts critical/high/medium and exposes details", () => {
    const summary = summarizeRisks([
      {
        id: "1",
        title: "SVJ",
        severity: "high",
        detail: "Fond oprav neověřen",
      },
      {
        id: "2",
        title: "CF",
        severity: "critical",
        detail: "Záporné cash flow",
      },
      {
        id: "3",
        title: "DOM",
        severity: "medium",
        detail: "Krátký čas na trhu",
      },
    ]);
    expect(summary.counts.critical).toBe(1);
    expect(summary.counts.high).toBe(1);
    expect(summary.counts.medium).toBe(1);
    expect(summary.topSeverity).toBe("critical");
    expect(summary.items[1]!.detail).toContain("cash flow");
  });
});

describe("decision completeness + advice (BOD 108–113)", () => {
  it("is rule-based low → medium → ready_for_decision", () => {
    const manyGaps = collectDecisionGaps({
      askingPriceCzk: null,
      valuationMidCzk: null,
      majetioScore: emptyScore(),
      matchScore: emptyScore(),
      locationScore: emptyScore(),
      renovation: {
        costLowCzk: null,
        costBaseCzk: null,
        costHighCzk: null,
        durationDays: null,
        arvCzk: null,
        valueCreationCzk: null,
        confidence: "unknown",
      },
      financing: null,
      risks: {
        counts: { critical: 0, high: 0, medium: 0, low: 0 },
        items: [],
        topSeverity: null,
      },
      hasCriticalRiskWithoutDetail: false,
    });
    expect(completenessFromGaps(manyGaps)).toBe("low");
    expect(
      buildDecisionAdvice({
        gaps: manyGaps,
        nextAction: null,
      }).headlineCs,
    ).toContain("K rozhodnutí vám chybí");
  });

  it("never uses purchase verdicts in nextAction copy", () => {
    const action = buildPropertyNextAction({
      propertyId: "p1",
      slug: "demo",
      risks: {
        counts: { critical: 1, high: 0, medium: 0, low: 0 },
        items: [
          {
            id: "r1",
            title: "Kritické",
            severity: "critical",
            detail: "Detail",
          },
        ],
        topSeverity: "critical",
      },
      renovation: {
        costLowCzk: 1,
        costBaseCzk: 1,
        costHighCzk: 1,
        durationDays: 1,
        arvCzk: 1,
        valueCreationCzk: 0,
        confidence: "medium",
      },
      financing: {
        equityCzk: 1_000_000,
        loanCzk: 4_000_000,
        monthlyPaymentCzk: 20_000,
        financingGapCzk: 0,
        ltvPct: 80,
        usedPersonalPassport: true,
        private: true,
      },
      gaps: [],
    });
    expect(action.labelCs.toLowerCase()).not.toContain("kupte");
    expect(action.reasonCs).toContain("Doporučený krok");
  });
});

describe("stale diffs (BOD 75, 104–106)", () => {
  it("detects price change without mutating fingerprints", () => {
    const prev: PropertyPublicFingerprint = {
      propertyId: "p1",
      askingPriceCzk: 6_000_000,
      status: "ACTIVE",
      valuationMidCzk: 5_800_000,
      renovationBaseCzk: 400_000,
      majetioScore: 72,
      updatedAt: "2026-07-01T00:00:00.000Z",
    };
    const live: PropertyPublicFingerprint = {
      ...prev,
      askingPriceCzk: 5_700_000,
      updatedAt: "2026-07-20T00:00:00.000Z",
    };
    const diffs = detectStaleDiffs({
      snapshotFingerprints: [prev],
      live: [{ fingerprint: live, title: "Byt Vinohrady" }],
    });
    expect(diffs).toHaveLength(1);
    expect(diffs[0]!.messageCs).toMatch(/Cena klesla o 300/);
    expect(prev.askingPriceCzk).toBe(6_000_000);
  });

  it("formats price increase distinctly", () => {
    expect(formatAskingPriceDiffCs(5_000_000, 5_300_000)).toMatch(
      /Cena vzrostla o 300/,
    );
  });
});

describe("public cache guard (BOD 146)", () => {
  beforeEach(() => {
    clearComparisonPublicCacheForTests();
  });

  it("rejects personal financing keys in public metrics cache", () => {
    const base = {
      propertyId: "p1",
      slug: "x",
      title: "X",
      href: "/x",
      isDemo: false,
      basics: {
        askingPriceCzk: 1,
        pricePerSqm: null,
        usableArea: null,
        layout: null,
        propertyType: "APARTMENT",
        condition: null,
        city: "Praha",
        daysOnMarket: null,
      },
      majetioScore: emptyScore({ score: 50, confidence: "medium" }),
      locationScore: emptyScore(),
      valuation: {
        midCzk: null,
        lowCzk: null,
        highCzk: null,
        confidence: "unknown" as const,
        confidenceScore: null,
      },
      investment: {
        grossYieldPct: null,
        netYieldPct: null,
        cashFlowMonthlyCzk: null,
        estimatedRentMonthlyCzk: null,
        confidence: "unknown" as const,
      },
      negotiation: {
        askingPriceCzk: 1,
        modeledMaxOfferCzk: null,
        gapCzk: null,
        gapPct: null,
        daysOnMarket: null,
        recentPriceDropCzk: null,
        summaryCs: null,
      },
      renovation: {
        costLowCzk: null,
        costBaseCzk: null,
        costHighCzk: null,
        durationDays: null,
        arvCzk: null,
        valueCreationCzk: null,
        confidence: "unknown" as const,
      },
      risks: {
        counts: { critical: 0, high: 0, medium: 0, low: 0 },
        items: [],
        topSeverity: null,
      },
      fingerprint: {
        propertyId: "p1",
        askingPriceCzk: 1,
        status: "ACTIVE",
        valuationMidCzk: null,
        renovationBaseCzk: null,
        majetioScore: 50,
        updatedAt: "2026-07-20T00:00:00.000Z",
      },
    } satisfies ComparisonPublicPropertyMetrics;

    expect(() => assertPublicMetricsOnly(base)).not.toThrow();

    const poisoned = {
      ...base,
      financing: { equityCzk: 100 },
    } as unknown as ComparisonPublicPropertyMetrics;

    expect(() => assertPublicMetricsOnly(poisoned)).toThrow(/personal field/);

    const key = buildPublicMetricsCacheKey({
      propertyId: "p1",
      updatedAt: "2026-07-20T00:00:00.000Z",
    });
    expect(() => setCachedPublicMetrics(key, base)).not.toThrow();
  });
});
