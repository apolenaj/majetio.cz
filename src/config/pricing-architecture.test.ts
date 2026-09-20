import { describe, expect, it } from "vitest";

import {
  FEATURE_FLAG_DEFAULTS,
  isFeatureEnabled,
} from "@/config/feature-flags";
import { commerceConfig } from "@/config/commerce";
import {
  getCatalogProductByKey,
  pricingCatalog,
  pricingSegments,
  resolveCanonicalCheckoutAmount,
} from "@/config/pricing-architecture";
import {
  assertNoDarkPatternConfig,
  renewConsentInitialChecked,
} from "@/config/pricing-ux";
import { parseCheckoutOrderInput } from "@/domains/orders/server/checkout-input";

describe("Pricing architecture — catalog (221)", () => {
  it("covers all five public segments + professional services", () => {
    const segments = new Set(pricingCatalog.map((p) => p.segment));
    expect(segments).toEqual(
      new Set([
        "buyers",
        "investors",
        "sellers",
        "agents",
        "developers",
        "professional_services",
      ]),
    );
    expect(pricingSegments.buyers.titleCs).toBe("Kupující");
    expect(pricingSegments.investors.titleCs).toBe("Investoři");
    expect(pricingSegments.sellers.titleCs).toBe("Prodávající a inzerenti");
    expect(pricingSegments.agents.titleCs).toBe("Firmy a makléři");
    expect(pricingSegments.developers.titleCs).toBe("Developeři");
  });

  it("matches seeded list prices (haléře, DPH v ceně)", () => {
    expect(getCatalogProductByKey("deep_analysis")?.priceGrossMinor).toBe(
      499_000,
    );
    expect(getCatalogProductByKey("listing_basic_30")?.priceGrossMinor).toBe(
      29_900,
    );
    expect(getCatalogProductByKey("listing_premium_30")?.priceGrossMinor).toBe(
      79_900,
    );
    expect(getCatalogProductByKey("listing_prep")?.priceGrossMinor).toBe(
      299_000,
    );
    expect(
      getCatalogProductByKey("property_search_project")?.priceGrossMinor,
    ).toBe(999_000);
    expect(getCatalogProductByKey("firm_starter_monthly")?.priceGrossMinor).toBe(
      99_000,
    );
    expect(getCatalogProductByKey("firm_growth_monthly")?.priceGrossMinor).toBe(
      199_000,
    );
    expect(getCatalogProductByKey("firm_scale_monthly")?.priceGrossMinor).toBe(
      399_000,
    );
    expect(getCatalogProductByKey("buyer_pass")?.priceGrossMinor).toBe(149_900);
    expect(getCatalogProductByKey("investor_pro_monthly")?.priceGrossMinor).toBe(
      99_900,
    );
    expect(getCatalogProductByKey("investor_pro_annual")?.priceGrossMinor).toBe(
      999_000,
    );
    expect(getCatalogProductByKey("boost_7_days")?.priceGrossMinor).toBe(49_900);
    expect(getCatalogProductByKey("boost_30_days")?.priceGrossMinor).toBe(
      149_900,
    );
    expect(getCatalogProductByKey("agent_pro")?.priceGrossMinor).toBe(149_900);
    expect(getCatalogProductByKey("agency_growth")?.priceGrossMinor).toBe(
      499_900,
    );
    expect(getCatalogProductByKey("developer_standard")?.priceGrossMinor).toBe(
      999_900,
    );
    expect(getCatalogProductByKey("expert_review")?.priceGrossMinor).toBe(
      299_000,
    );
    expect(getCatalogProductByKey("investment_audit")?.priceGrossMinor).toBe(
      799_000,
    );
  });

  it("keeps commerceConfig legacy products aligned with catalog", () => {
    expect(commerceConfig.products.fullAnalysis.priceGrossMinor).toBe(
      getCatalogProductByKey("full_analysis")?.priceGrossMinor,
    );
    expect(commerceConfig.products.basicAnalysis.priceGrossMinor).toBe(
      getCatalogProductByKey("basic_analysis")?.priceGrossMinor,
    );
  });

  it("never defaults auto-renew on", () => {
    for (const p of pricingCatalog) {
      expect(p.autoRenewDefault).toBe(false);
    }
  });
});

describe("Feature flags — rollout defaults (165/166)", () => {
  it("keeps transaction success fee OFF by default", () => {
    expect(FEATURE_FLAG_DEFAULTS.TRANSACTION_SUCCESS_FEE_ENABLED).toBe(false);
    expect(FEATURE_FLAG_DEFAULTS.PARTNER_MARKETPLACE_ENABLED).toBe(false);
    expect(isFeatureEnabled("TRANSACTION_SUCCESS_FEE_ENABLED")).toBe(false);
  });
});

describe("Anti dark patterns (128)", () => {
  it("hard-bans silent auto-renew and fake countdowns", () => {
    const check = assertNoDarkPatternConfig();
    expect(check.ok).toBe(true);
    expect(check.violations).toEqual([]);
    expect(renewConsentInitialChecked()).toBe(false);
  });
});

describe("Price integrity — server canonical amount (171/172)", () => {
  it("ignores client-claimed amount and uses PricingPlan only", () => {
    const planPrice = 499_000;
    expect(
      resolveCanonicalCheckoutAmount({
        planPriceGrossMinor: planPrice,
        clientClaimedAmountMinor: 1,
      }),
    ).toBe(planPrice);
    expect(
      resolveCanonicalCheckoutAmount({
        planPriceGrossMinor: planPrice,
        clientClaimedAmountMinor: 999_999_999,
      }),
    ).toBe(planPrice);
    expect(
      resolveCanonicalCheckoutAmount({
        planPriceGrossMinor: planPrice,
        clientClaimedAmountMinor: null,
      }),
    ).toBe(planPrice);
  });

  it("rejects checkout payloads that include client price fields", () => {
    const base = {
      productKey: "deep_analysis",
      billing: { name: "Jan Novák", email: "jan@example.com" },
      acceptPurchaseTerms: true as const,
    };

    expect(parseCheckoutOrderInput(base).success).toBe(true);

    expect(
      parseCheckoutOrderInput({ ...base, amountGrossMinor: 1 }).success,
    ).toBe(false);
    expect(parseCheckoutOrderInput({ ...base, priceCzk: 1 }).success).toBe(
      false,
    );
    expect(parseCheckoutOrderInput({ ...base, amountCzk: 1 }).success).toBe(
      false,
    );
    expect(
      parseCheckoutOrderInput({ ...base, sneakyPrice: 100 }).success,
    ).toBe(false);
  });
});
