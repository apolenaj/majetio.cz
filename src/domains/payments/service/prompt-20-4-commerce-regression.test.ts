/**
 * Prompt 20.4 — Commerce, payments & international readiness regression.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  formatMoneyFromMinor,
  formatCzkFromMinor,
} from "@/config/commerce";
import { resolveCanonicalCheckoutAmount } from "@/config/pricing-architecture";
import { assertOrderEligibleForEntitlementGrant } from "@/domains/entitlements/grant-guard";
import { assertPricingPlanMarketMatch } from "@/domains/commerce/subscription-market-lock";
import { assertWebhookPaymentMatchesOrder } from "@/domains/payments/service/webhook-amount-guard";
import {
  isPaymentsMockAllowed,
  resolvePaymentsConfig,
} from "@/integrations/payments/config";
import {
  assertProductFirewallHardFalse,
  COMMERCIAL_FIREWALL_CONTRACT,
} from "@/domains/listing-promotions";

describe("Prompt 20.4 — Fake redirect / entitlement gate", () => {
  it("does not grant entitlement for unpaid awaiting order (success redirect alone)", () => {
    const blocked = assertOrderEligibleForEntitlementGrant({
      status: "AWAITING_PAYMENT",
      amountGrossMinor: 499_000,
    });
    expect(blocked.ok).toBe(false);
  });

  it("grants only after PAID webhook status", () => {
    const ok = assertOrderEligibleForEntitlementGrant({
      status: "PAID",
      amountGrossMinor: 499_000,
    });
    expect(ok).toEqual({ ok: true, source: "PAID_ORDER" });
  });

  it("success page source does not call grant APIs", () => {
    const src = readFileSync(
      join(process.cwd(), "src/app/(account)/checkout/success/page.tsx"),
      "utf8",
    );
    expect(src).not.toMatch(/grantEntitlement/);
    expect(src).toMatch(/getOrderForUser/);
  });
});

describe("Prompt 20.4 — Webhook amount integrity", () => {
  it("rejects mismatched webhook amount", () => {
    expect(() =>
      assertWebhookPaymentMatchesOrder({
        payloadAmountMinor: 1,
        payloadCurrency: "CZK",
        orderAmountGrossMinor: 499_000,
        orderCurrency: "CZK",
        paymentAmountGrossMinor: 499_000,
        paymentCurrency: "CZK",
      }),
    ).toThrow(/Webhook amount/);
  });

  it("rejects mismatched currency", () => {
    expect(() =>
      assertWebhookPaymentMatchesOrder({
        payloadAmountMinor: 499_000,
        payloadCurrency: "EUR",
        orderAmountGrossMinor: 499_000,
        orderCurrency: "CZK",
        paymentAmountGrossMinor: 499_000,
        paymentCurrency: "CZK",
      }),
    ).toThrow(/currency/i);
  });

  it("accepts matching amount and currency", () => {
    expect(() =>
      assertWebhookPaymentMatchesOrder({
        payloadAmountMinor: 499_000,
        payloadCurrency: "CZK",
        orderAmountGrossMinor: 499_000,
        orderCurrency: "CZK",
        paymentAmountGrossMinor: 499_000,
        paymentCurrency: "CZK",
      }),
    ).not.toThrow();
  });
});

describe("Prompt 20.4 — Mock PSP fail-closed in production", () => {
  it("forces provider none when mock set in production without ALLOW_MOCK", () => {
    const cfg = resolvePaymentsConfig({
      PAYMENTS_PROVIDER: "mock",
      NODE_ENV: "production",
      VERCEL_ENV: "production",
    } as NodeJS.ProcessEnv);
    expect(cfg.provider).toBe("none");
    expect(
      isPaymentsMockAllowed({
        PAYMENTS_PROVIDER: "mock",
        NODE_ENV: "production",
      } as NodeJS.ProcessEnv),
    ).toBe(false);
  });

  it("allows mock in development", () => {
    expect(
      isPaymentsMockAllowed({
        PAYMENTS_PROVIDER: "mock",
        NODE_ENV: "development",
      } as NodeJS.ProcessEnv),
    ).toBe(true);
  });

  it("allows mock in production only with PAYMENTS_ALLOW_MOCK", () => {
    expect(
      isPaymentsMockAllowed({
        PAYMENTS_PROVIDER: "mock",
        NODE_ENV: "production",
        PAYMENTS_ALLOW_MOCK: "true",
      } as NodeJS.ProcessEnv),
    ).toBe(true);
    const cfg = resolvePaymentsConfig({
      PAYMENTS_PROVIDER: "mock",
      NODE_ENV: "production",
      PAYMENTS_ALLOW_MOCK: "true",
    } as NodeJS.ProcessEnv);
    expect(cfg.provider).toBe("mock");
  });
});

describe("Prompt 20.4 — Price integrity & versioning", () => {
  it("ignores client-claimed amount below canonical plan price", () => {
    const canonical = resolveCanonicalCheckoutAmount({
      planPriceGrossMinor: 499_000,
      clientClaimedAmountMinor: 1,
    });
    expect(canonical).toBe(499_000);
  });

  it("pricing snapshots keep priceVersionKey on orders (source contract)", () => {
    const src = readFileSync(
      join(process.cwd(), "src/domains/orders/service/create-order.ts"),
      "utf8",
    );
    expect(src).toMatch(/priceVersionKey:\s*plan\.versionKey/);
    expect(src).toMatch(/assertPricingPlanMarketMatch/);
    expect(src).toMatch(/clientClaimedAmountMinor/);
  });
});

describe("Prompt 20.4 — Sponsored integrity", () => {
  it("boost never affects Majetio Score / organic ranking contract", () => {
    expect(assertProductFirewallHardFalse()).toEqual({ ok: true });
    expect(COMMERCIAL_FIREWALL_CONTRACT.boostAffectsMajetioScore).toBe(false);
    expect(COMMERCIAL_FIREWALL_CONTRACT.boostAffectsOrganicRanking).toBe(false);
    expect(COMMERCIAL_FIREWALL_CONTRACT.boostAffectsValuation).toBe(false);
  });
});

describe("Prompt 20.4 — Market / currency isolation", () => {
  it("refuses plan market ≠ checkout market", () => {
    expect(() =>
      assertPricingPlanMarketMatch({
        planMarketCode: "CZ",
        checkoutMarketCode: "AE",
      }),
    ).toThrow(/does not match/);
  });

  it("formats AED/EUR without forcing CZK symbol", () => {
    const aed = formatMoneyFromMinor(100_00, "AED");
    const eur = formatMoneyFromMinor(100_00, "EUR");
    const czk = formatCzkFromMinor(100_00);
    expect(aed).not.toMatch(/Kč/);
    expect(eur).not.toMatch(/Kč/);
    expect(czk).toMatch(/Kč|CZK/i);
  });
});
