import { describe, expect, it } from "vitest";

import { Money } from "@/domains/finance/primitives/money";
import {
  InMemoryFxRateStore,
  resolveExchangeRate,
  convertMoneyWithFxEngine,
  FxUnavailableError,
  buildDualCurrencyDisplay,
} from "@/domains/finance";
import {
  listLocalPricingSeedsForMarket,
  assertNotFxDerivedListPrice,
  assertSubscriptionUnchangedOnMarketSwitch,
  assertPricingPlanMarketMatch,
} from "@/domains/commerce";
import {
  resolveTaxProviderConfig,
  vatRateBpForPlan,
} from "@/domains/tax";
import {
  resolveFinancingProvider,
  resolveFinancingLeadRouting,
  assertHypotekaJasneCzOnly,
} from "@/domains/financing/providers/registry";
import {
  resolveValuationModelForMarket,
  assertValuationModelMarketMatch,
} from "@/domains/valuation/market/model-registry";
import {
  normalizeListingsByHomeCapital,
  sortByHomeCapital,
} from "@/domains/properties/search/capital-normalized";

describe("FX engine — fresh / stale / unavailable / pinned", () => {
  const freshAt = "2026-07-21T12:00:00.000Z";
  const staleAt = "2026-07-01T12:00:00.000Z";
  const asOf = new Date("2026-07-21T14:00:00.000Z");

  it("returns FRESH when within maxAge", () => {
    const store = new InMemoryFxRateStore();
    store.seed([
      {
        baseCurrency: "AED",
        quoteCurrency: "CZK",
        rate: "6.2",
        source: "manual",
        observedAt: freshAt,
      },
    ]);
    const r = resolveExchangeRate({
      baseCurrency: "AED",
      quoteCurrency: "CZK",
      store,
      asOf,
      maxAgeMs: 48 * 60 * 60 * 1000,
      mode: "ALLOW_STALE",
    });
    expect(r.status).toBe("FRESH");
    expect(r.usedStaleFallback).toBe(false);
  });

  it("falls back to STALE when ALLOW_STALE", () => {
    const store = new InMemoryFxRateStore();
    store.seed([
      {
        baseCurrency: "AED",
        quoteCurrency: "CZK",
        rate: "6.0",
        source: "manual",
        observedAt: staleAt,
      },
    ]);
    const r = resolveExchangeRate({
      baseCurrency: "AED",
      quoteCurrency: "CZK",
      store,
      asOf,
      maxAgeMs: 24 * 60 * 60 * 1000,
      mode: "ALLOW_STALE",
    });
    expect(r.status).toBe("STALE");
    expect(r.usedStaleFallback).toBe(true);
  });

  it("throws UNAVAILABLE when REQUIRE_FRESH and only stale exists", () => {
    const store = new InMemoryFxRateStore();
    store.seed([
      {
        baseCurrency: "EUR",
        quoteCurrency: "CZK",
        rate: "25",
        source: "ecb",
        observedAt: staleAt,
      },
    ]);
    expect(() =>
      resolveExchangeRate({
        baseCurrency: "EUR",
        quoteCurrency: "CZK",
        store,
        asOf,
        maxAgeMs: 24 * 60 * 60 * 1000,
        mode: "REQUIRE_FRESH",
      }),
    ).toThrow(FxUnavailableError);
  });

  it("throws when no rate exists", () => {
    const store = new InMemoryFxRateStore();
    expect(() =>
      resolveExchangeRate({
        baseCurrency: "SAR",
        quoteCurrency: "CZK",
        store,
        asOf,
      }),
    ).toThrow(FxUnavailableError);
  });

  it("pins historical snapshot for reproducibility", () => {
    const store = new InMemoryFxRateStore();
    store.seed([
      {
        baseCurrency: "AED",
        quoteCurrency: "CZK",
        rate: "9.9",
        source: "manual",
        observedAt: freshAt,
      },
    ]);
    const pinned = {
      baseCurrency: "AED" as const,
      quoteCurrency: "CZK" as const,
      rate: "5.5",
      source: "scenario_freeze",
      observedAt: "2025-01-01T00:00:00.000Z",
    };
    const { money, resolution } = convertMoneyWithFxEngine({
      amount: Money.fromMajor(1000, "AED"),
      targetCurrency: "CZK",
      store,
      mode: "PINNED",
      pinned,
    });
    expect(resolution.snapshot.rate).toBe("5.5");
    expect(money.toMajorNumber()).toBeCloseTo(5500, 5);
  });
});

describe("Local pricing — not FX of another market", () => {
  it("AE list prices are explicit AED amounts", () => {
    const ae = listLocalPricingSeedsForMarket("AE");
    const full = ae.find((p) => p.key === "full_analysis")!;
    expect(full.currency).toBe("AED");
    expect(full.marketCode).toBe("AE");
    expect(full.taxRegion).toBe("AE");
    // Must not equal a naïve FX of CZK 4990 Kč (499_000 minor) ≈ anything
    expect(full.priceGrossMinor).toBe(199_00);
    expect(() =>
      assertNotFxDerivedListPrice({ source: "FX_CONVERSION" }),
    ).toThrow(/forbidden/i);
  });

  it("subscriptions stay put when market preference changes", () => {
    const result = assertSubscriptionUnchangedOnMarketSwitch({
      existing: {
        subscriptionId: "sub_1",
        billingMarketCode: "CZ",
        currency: "CZK",
        pricingPlanKey: "pro_monthly",
        pricingPlanVersionKey: "v1",
      },
      newPreferredMarketCode: "AE",
    });
    expect(result.action).toBe("KEEP_EXISTING_SUBSCRIPTION");
    expect(result.note).toMatch(/does not reprice/i);
  });

  it("checkout market must match plan market", () => {
    expect(() =>
      assertPricingPlanMarketMatch({
        planMarketCode: "CZ",
        checkoutMarketCode: "AE",
      }),
    ).toThrow();
  });
});

describe("Tax provider config", () => {
  it("resolves market-specific VAT — not hardcoded single rate", () => {
    expect(vatRateBpForPlan({ marketCode: "CZ" })).toBe(2100);
    expect(vatRateBpForPlan({ marketCode: "AE" })).toBe(500);
    expect(resolveTaxProviderConfig({ marketCode: "ES" })?.currency).toBe("EUR");
  });
});

describe("Cross-market leakage — financing & valuation", () => {
  it("HypotekaJasne is CZ-only", () => {
    expect(resolveFinancingProvider("CZ").provider?.code).toBe("hypotekajasne");
    const ae = resolveFinancingProvider("AE");
    expect(ae.provider?.code).not.toBe("hypotekajasne");
    expect(["PARTNER_PENDING", "UNAVAILABLE"]).toContain(ae.status);

    const route = resolveFinancingLeadRouting({ marketCode: "AE" });
    expect(route.partner).not.toBe("hypotekajasne");
    expect(route.handoffAllowed).toBe(false);
    expect(["PARTNER_PENDING", "UNAVAILABLE"]).toContain(route.status);

    expect(() =>
      assertHypotekaJasneCzOnly({
        marketCode: "AE",
        partnerCode: "hypotekajasne",
      }),
    ).toThrow(/CZ-only/i);
  });

  it("UAE property never uses CZ valuation model", () => {
    const cz = resolveValuationModelForMarket({
      marketCode: "CZ",
      propertyType: "APARTMENT",
    });
    expect(cz.status).toBe("READY");

    const ae = resolveValuationModelForMarket({
      marketCode: "AE",
      propertyType: "VILLA",
    });
    expect(ae.status).toBe("DISABLED");
    expect(ae.model?.marketCode).toBe("AE");

    expect(() =>
      assertValuationModelMarketMatch({
        modelMarketCode: "CZ",
        propertyMarketCode: "AE",
      }),
    ).toThrow(/does not match/);
  });
});

describe("Dual currency + capital-normalized search", () => {
  it("builds secondary orientational display", () => {
    const display = buildDualCurrencyDisplay({
      primary: Money.fromMajor(1_000_000, "AED"),
      secondaryCurrency: "CZK",
      snapshot: {
        baseCurrency: "AED",
        quoteCurrency: "CZK",
        rate: "6",
        source: "manual",
        observedAt: "2026-07-21T00:00:00.000Z",
      },
    });
    expect(display.secondary?.amountMajor).toBeCloseTo(6_000_000, 0);
    expect(display.secondary?.disclaimerKey).toBe("fx.orientational_only");
  });

  it("normalizes equity into home currency for sort", () => {
    const store = new InMemoryFxRateStore();
    store.seed([
      {
        baseCurrency: "AED",
        quoteCurrency: "CZK",
        rate: "6",
        source: "manual",
        observedAt: "2026-07-21T00:00:00.000Z",
      },
    ]);
    const hits = normalizeListingsByHomeCapital({
      homeCurrency: "CZK",
      store,
      listings: [
        {
          listingId: "ae1",
          marketCode: "AE",
          priceMajor: 1_000_000,
          currency: "AED",
          equityRatio: 0.2,
        },
        {
          listingId: "cz1",
          marketCode: "CZ",
          priceMajor: 5_000_000,
          currency: "CZK",
          equityRatio: 0.2,
        },
      ],
    });
    const sorted = sortByHomeCapital(hits);
    // CZ equity = 1_000_000 CZK; AE equity home = 200_000 AED * 6 = 1_200_000 CZK
    expect(sorted[0]!.listingId).toBe("cz1");
    expect(sorted[1]!.listingId).toBe("ae1");
  });
});
