import { describe, expect, it } from "vitest";

import {
  buildSeoDocumentMeta,
  toNextAlternates,
  buildCountryLandingPath,
  buildLocationHierarchyPath,
  SEO_HOSTS,
} from "@/domains/seo/architecture";
import {
  decideProgrammaticIndexability,
  computeReviewRequiredAt,
  isContentStale,
} from "@/domains/seo/programmatic-rules";
import {
  listMarketDataSources,
  marketHasMinimumSeoDataCoverage,
} from "@/domains/markets/data-sources/registry";
import {
  getCurrentPrivacyPolicy,
  assertPassportFieldAllowed,
  requiresReconsent,
} from "@/domains/privacy";
import {
  createInternationalPassport,
  userMarketProfileFromLegacyCzPassport,
  registerCollectedField,
  getMarketProfile,
} from "@/domains/identity";
import {
  compareAcrossMarkets,
  shouldFlagFxExposure,
} from "@/domains/comparisons/cross-market/engine";
import { buildComparisonWarnings } from "@/domains/comparisons/service/warnings";
import {
  evaluateMarketLaunchReadiness,
  evaluateAllMarketLaunchReadiness,
} from "@/domains/markets/launch-readiness";
import { identityExchangeRateSnapshot } from "@/domains/finance";

describe("SEO architecture (Prompt 17.5)", () => {
  it("builds CZ country and location paths", () => {
    expect(buildCountryLandingPath("CZ")).toBe("/lokality");
    expect(
      buildLocationHierarchyPath({
        marketCode: "CZ",
        segments: ["praha", "vinohrady"],
      }),
    ).toBe("/lokality/praha/vinohrady");
    expect(buildCountryLandingPath("AE")).toBe("/markets/ae");
  });

  it("emits canonical + hreflang and noindexes CZ duplicates on .com", () => {
    const cz = buildSeoDocumentMeta({
      pathname: "/nemovitosti",
      marketCode: "CZ",
      siteOrigin: SEO_HOSTS.cz.origin,
    });
    expect(cz.robots.index).toBe(true);
    expect(cz.canonicalUrl).toContain("majetio.cz");
    const alts = toNextAlternates(cz);
    expect(alts.languages["x-default"]).toBe(cz.canonicalUrl);
    expect(alts.canonical).toMatch(/\/nemovitosti$/);
    expect(alts.languages["cs-CZ"]).toMatch(/\/nemovitosti$/);
    expect(alts.languages["en-GB"]).toMatch(/\/en\/nemovitosti$/);

    const dup = buildSeoDocumentMeta({
      pathname: "/nemovitosti",
      marketCode: "CZ",
      siteOrigin: SEO_HOSTS.com.origin,
    });
    expect(dup.robots.index).toBe(false);
    expect(dup.indexDenialReason).toMatch(/duplicate/);
  });
});

describe("Data sources + privacy", () => {
  it("lists CZ sources with SEO coverage", () => {
    expect(listMarketDataSources("CZ").length).toBeGreaterThan(0);
    expect(marketHasMinimumSeoDataCoverage("CZ")).toBe(true);
    expect(marketHasMinimumSeoDataCoverage("AE")).toBe(false);
  });

  it("resolves CZ privacy and blocks unjustified PII fields", () => {
    const policy = getCurrentPrivacyPolicy({
      marketCode: "CZ",
      kind: "PRIVACY_POLICY",
    });
    expect(policy?.isCurrent).toBe(true);
    expect(requiresReconsent({
      marketCode: "CZ",
      kind: "PRIVACY_POLICY",
      grantedVersion: "2019-01-01",
    })).toBe(true);
    expect(() => assertPassportFieldAllowed("taxResidenceCountry")).toThrow(
      /justification/,
    );
    expect(() =>
      assertPassportFieldAllowed("taxResidenceCountry", "mortgage underwriting"),
    ).not.toThrow();
  });
});

describe("UserMarketProfile + passport", () => {
  it("creates multi-currency profiles without assuming CZK", () => {
    const passport = createInternationalPassport({
      userId: "u1",
      homeMarketCode: "AE",
      homeLocale: "en-AE",
      homeCurrency: "AED",
    });
    const ae = getMarketProfile(passport, "AE")!;
    expect(ae.preferredCurrency).toBe("AED");

    const cz = userMarketProfileFromLegacyCzPassport({
      userId: "u1",
      maxPriceCzk: 8_000_000,
      availableEquityCzk: 2_000_000,
      monthlyIncomeCzk: 80_000,
      monthlyLiabilitiesCzk: 15_000,
    });
    expect(cz.maxBudgetMinor).toBe(800_000_000);
    expect(cz.preferredCurrency).toBe("CZK");

    expect(() =>
      registerCollectedField(passport, "nationalIdNumber"),
    ).toThrow();
  });
});

describe("Cross-market comparison + FX exposure", () => {
  it("flags FX exposure and normalizes same-currency without FX", () => {
    expect(
      shouldFlagFxExposure({
        marketCodes: ["CZ", "AE"],
        currencies: ["CZK", "AED"],
      }),
    ).toBe(true);

    const result = compareAcrossMarkets({
      displayCurrency: "AED",
      fxSnapshots: {},
      left: {
        propertyId: "a",
        title: "Dubai apt",
        marketCode: "AE",
        currency: "AED",
        askingPriceMinor: 1_000_000_00,
        transactionCostsMinor: 40_000_00,
        monthlyFinancingMinor: 5_000_00,
        grossYieldPct: 6,
        riskTags: ["freehold"],
      },
      right: {
        propertyId: "b",
        title: "Dubai villa",
        marketCode: "AE",
        currency: "AED",
        askingPriceMinor: 2_000_000_00,
        transactionCostsMinor: 80_000_00,
        monthlyFinancingMinor: 9_000_00,
        grossYieldPct: 5,
        riskTags: ["leasehold"],
      },
    });
    expect(result.sameMarket).toBe(true);
    expect(result.fxExposure).toBe(false);
    expect(result.left.askingPriceDisplayMinor).toBe(1_000_000_00);
  });

  it("sets fxExposure when markets differ", () => {
    const snap = identityExchangeRateSnapshot("CZK");
    // identity won't convert AED→CZK; use a proper snapshot shape
    const aedToCzk = {
      ...snap,
      baseCurrency: "AED" as const,
      quoteCurrency: "CZK" as const,
      rate: "6.0",
    };
    const result = compareAcrossMarkets({
      displayCurrency: "CZK",
      fxSnapshots: { "AED->CZK": aedToCzk, "CZK->CZK": snap },
      left: {
        propertyId: "praha",
        title: "Praha",
        marketCode: "CZ",
        currency: "CZK",
        askingPriceMinor: 10_000_000_00,
        transactionCostsMinor: 100_000_00,
        monthlyFinancingMinor: 40_000_00,
        grossYieldPct: 4,
        riskTags: ["svj"],
      },
      right: {
        propertyId: "dubai",
        title: "Dubai",
        marketCode: "AE",
        currency: "AED",
        askingPriceMinor: 1_000_000_00,
        transactionCostsMinor: 40_000_00,
        monthlyFinancingMinor: 5_000_00,
        grossYieldPct: 6,
        riskTags: ["freehold"],
      },
    });
    expect(result.fxExposure).toBe(true);
    expect(result.warnings.some((w) => w.id === "cross-market-fx-exposure")).toBe(
      true,
    );
    expect(result.right.askingPriceDisplayMinor).toBe(6_000_000_00);
  });

  it("adds FX warning from buildComparisonWarnings", () => {
    const warnings = buildComparisonWarnings([
      {
        propertyId: "1",
        title: "A",
        propertyType: "APARTMENT",
        strategyTags: [],
        valuationConfidence: "high",
        marketCode: "CZ",
        currency: "CZK",
      },
      {
        propertyId: "2",
        title: "B",
        propertyType: "APARTMENT",
        strategyTags: [],
        valuationConfidence: "high",
        marketCode: "AE",
        currency: "AED",
      },
    ]);
    expect(warnings.some((w) => w.id === "cross-market-fx-exposure")).toBe(true);
  });
});

describe("Programmatic SEO + launch readiness", () => {
  it("refuses thin / demo pages and requires review dates for legal", () => {
    const thin = decideProgrammaticIndexability({
      id: "1",
      kind: "LOCATION_LANDING",
      marketCode: "CZ",
      path: "/lokality/x",
      hasRealData: false,
      sampleCount: 2,
      publishedAt: new Date().toISOString(),
      reviewRequiredAt: null,
      lastReviewedAt: null,
      isDemo: true,
    });
    expect(thin.indexable).toBe(false);
    expect(thin.reasons).toEqual(
      expect.arrayContaining(["demo_content", "no_real_data"]),
    );

    const reviewedAt = "2026-07-01T00:00:00.000Z";
    const legalOk = decideProgrammaticIndexability(
      {
        id: "2",
        kind: "LEGAL_DOC",
        marketCode: "CZ",
        path: "/ochrana-soukromi",
        hasRealData: true,
        sampleCount: null,
        publishedAt: reviewedAt,
        reviewRequiredAt: computeReviewRequiredAt(reviewedAt),
        lastReviewedAt: reviewedAt,
        isDemo: false,
      },
      "2026-07-15T00:00:00.000Z",
    );
    expect(legalOk.indexable).toBe(true);

    expect(
      isContentStale({
        reviewRequiredAt: "2020-01-01T00:00:00.000Z",
        lastReviewedAt: "2020-01-01T00:00:00.000Z",
        asOfIso: "2026-07-01T00:00:00.000Z",
      }),
    ).toBe(true);
  });

  it("marks CZ READY_PUBLIC and others blocked/in progress", () => {
    const cz = evaluateMarketLaunchReadiness("CZ");
    expect(cz.status).toBe("READY_PUBLIC");
    expect(cz.blockingReasons).toEqual([]);

    const ae = evaluateMarketLaunchReadiness("AE");
    expect(ae.status).not.toBe("READY_PUBLIC");
    expect(ae.blockingReasons.length).toBeGreaterThan(0);

    const all = evaluateAllMarketLaunchReadiness();
    expect(all.some((r) => r.marketCode === "CZ")).toBe(true);
  });
});
