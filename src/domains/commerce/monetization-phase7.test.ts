/**
 * Phase 7 — Legal, consents, anti-patterns (211–215, 226).
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  assertDisputedFeaturesDefaultOff,
  LEGAL_REVIEW_REGISTRY,
  listBlockedLegalReviewItems,
} from "@/config/legal-review";
import {
  FEATURE_FLAG_DEFAULTS,
  isFeatureEnabled,
} from "@/config/feature-flags";
import {
  assertNoMarketingBundledWithPurchase,
  PURCHASE_CONSENT_COPY_CS,
  PURCHASE_TERMS_VERSION,
} from "@/domains/commerce/purchase-consent";
import { parseCheckoutOrderInput } from "@/domains/orders/server/checkout-input";
import {
  assertMonetizationAntiPatternsCatalog,
  MONETIZATION_ANTI_PATTERNS,
} from "@/config/monetization-anti-patterns";
import { assertNoDarkPatternConfig } from "@/config/pricing-ux";
import { COMMERCIAL_FIREWALL_CONTRACT } from "@/domains/listing-promotions/commercial-firewall";
import { LTV_CAC_GUARDRAILS } from "@/domains/revenue/ltv-cac";

describe("Purchase consent 211 / 212", () => {
  it("records versioned Terms and rejects marketing bundling", () => {
    expect(PURCHASE_TERMS_VERSION.length).toBeGreaterThan(0);
    expect(PURCHASE_CONSENT_COPY_CS.marketingSeparation).toMatch(/Marketing/);
    expect(assertNoMarketingBundledWithPurchase({}).ok).toBe(true);
    expect(
      assertNoMarketingBundledWithPurchase({ acceptMarketing: true }).ok,
    ).toBe(false);
  });

  it("checkout schema requires Terms and forbids price + marketing fields", () => {
    const ok = parseCheckoutOrderInput({
      productKey: "deep_analysis",
      billing: { name: "Test User", email: "t@example.com" },
      acceptPurchaseTerms: true,
    });
    expect(ok.success).toBe(true);

    const withPrice = parseCheckoutOrderInput({
      productKey: "deep_analysis",
      billing: { name: "Test User", email: "t@example.com" },
      acceptPurchaseTerms: true,
      amountGrossMinor: 100,
    });
    expect(withPrice.success).toBe(false);

    const withMarketing = parseCheckoutOrderInput({
      productKey: "deep_analysis",
      billing: { name: "Test User", email: "t@example.com" },
      acceptPurchaseTerms: true,
      acceptMarketing: true,
    });
    expect(withMarketing.success).toBe(false);

    const noTerms = parseCheckoutOrderInput({
      productKey: "deep_analysis",
      billing: { name: "Test User", email: "t@example.com" },
      acceptPurchaseTerms: false,
    });
    expect(noTerms.success).toBe(false);
  });

  it("wires recordPurchaseTermsAcceptance into create-order", () => {
    const file = readFileSync(
      join(process.cwd(), "src/domains/orders/service/create-order.ts"),
      "utf8",
    );
    expect(file).toMatch(/recordPurchaseTermsAcceptance/);
  });
});

describe("Legal / Accounting Review 213–215", () => {
  it("keeps disputed features default OFF", () => {
    expect(FEATURE_FLAG_DEFAULTS.CONSUMER_WITHDRAWAL_ENABLED).toBe(false);
    expect(FEATURE_FLAG_DEFAULTS.TRANSACTION_SUCCESS_FEE_ENABLED).toBe(false);
    expect(FEATURE_FLAG_DEFAULTS.PARTNER_MARKETPLACE_ENABLED).toBe(false);
    expect(FEATURE_FLAG_DEFAULTS.AUTOMATED_INVOICE_ENABLED).toBe(false);
    expect(isFeatureEnabled("CONSUMER_WITHDRAWAL_ENABLED")).toBe(false);
    expect(isFeatureEnabled("TRANSACTION_SUCCESS_FEE_ENABLED")).toBe(false);
    expect(isFeatureEnabled("AUTOMATED_INVOICE_ENABLED")).toBe(false);

    const assert = assertDisputedFeaturesDefaultOff();
    expect(assert.ok).toBe(true);
    expect(assert.violations).toEqual([]);

    const blocked = listBlockedLegalReviewItems();
    expect(blocked.some((i) => i.id === "consumer_withdrawal")).toBe(true);
    expect(blocked.some((i) => i.id === "transaction_success_fee")).toBe(true);
    expect(blocked.some((i) => i.id === "automated_invoices")).toBe(true);
    expect(LEGAL_REVIEW_REGISTRY.some((i) => i.domain === "vat")).toBe(true);
  });
});

describe("Anti-patterns 226", () => {
  it("catalog is complete and hard-forbidden", () => {
    expect(MONETIZATION_ANTI_PATTERNS.length).toBeGreaterThanOrEqual(10);
    expect(assertMonetizationAntiPatternsCatalog().ok).toBe(true);
    expect(assertNoDarkPatternConfig().ok).toBe(true);
    expect(COMMERCIAL_FIREWALL_CONTRACT.boostAffectsMajetioScore).toBe(false);
    expect(LTV_CAC_GUARDRAILS.forbidGmvAsLtvInput).toBe(true);
  });

  it("docs from bod 220 exist", () => {
    for (const name of [
      "MONETIZATION_ARCHITECTURE.md",
      "DEVELOPER_PRODUCTS.md",
      "PARTNER_MONETIZATION.md",
      "MONETIZATION_LEGAL_REVIEW.md",
      "MONETIZATION_TEST_PLAN.md",
    ]) {
      const body = readFileSync(join(process.cwd(), "docs", name), "utf8");
      expect(body.length).toBeGreaterThan(200);
    }
  });
});
