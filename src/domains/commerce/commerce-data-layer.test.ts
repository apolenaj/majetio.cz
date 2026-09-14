import { describe, expect, it } from "vitest";

import { buildCommerceLineQuote } from "@/domains/commerce/quote";
import {
  mapProviderStatusToEventType,
  orderStatusForEvent,
  paymentStatusForEvent,
} from "@/domains/commerce/status-map";
import type { PublicPricingPlan } from "@/domains/commerce/catalog";
import { applyPromoDiscount } from "@/domains/payments/service/pricing";

const fullPlan: PublicPricingPlan & { rowId: string } = {
  id: "plan_full",
  rowId: "plan_full",
  key: "full_analysis",
  versionKey: "v2026.07",
  name: "Kompletní analýza",
  description: null,
  billingType: "ONE_TIME",
  priceGrossMinor: 499_000,
  currency: "CZK",
  marketCode: "CZ",
  countryCode: "CZ",
  taxRegion: "CZ",
  vatRateBp: 2100,
  entitlesProductKey: "full_analysis",
  limits: { analysesPerMonth: 50 },
  features: ["valuation", "scenarios"],
  sortOrder: 20,
};

describe("Commerce Data Layer — PricingPlan quotes + snapshots", () => {
  it("builds line quote with VAT split and frozen version key", () => {
    const line = buildCommerceLineQuote({ plan: fullPlan });
    expect("error" in line).toBe(false);
    if ("error" in line) return;
    expect(line.planVersionKey).toBe("v2026.07");
    expect(line.unitListGrossMinor).toBe(499_000);
    expect(line.lineNetMinor + line.lineVatMinor).toBe(line.lineGrossMinor);
    expect(line.featuresSnapshot).toContain("valuation");
  });

  it("applies promotion without mutating plan list price", () => {
    const promo = {
      id: "promo1",
      source: "promotion" as const,
      code: "SAVE10",
      discountType: "PERCENT" as const,
      discountValue: 1000,
      productKeys: ["full_analysis"],
      active: true,
      activeFrom: new Date("2020-01-01"),
      activeTo: null,
      maxRedemptions: null,
      redemptionCount: 0,
      maxPerUser: null,
    };
    const line = buildCommerceLineQuote({ plan: fullPlan, promotion: promo });
    expect("error" in line).toBe(false);
    if ("error" in line) return;
    expect(line.unitListGrossMinor).toBe(499_000);
    expect(line.discountMinor).toBe(49_900);
    expect(line.lineGrossMinor).toBe(449_100);
  });

  it("rejects expired promotion via applyPromoDiscount", () => {
    const applied = applyPromoDiscount({
      listGrossMinor: 499_000,
      productKey: "full_analysis",
      promo: {
        code: "OLD",
        discountType: "PERCENT",
        discountValue: 1000,
        productKeys: ["full_analysis"],
        active: true,
        activeFrom: new Date("2020-01-01"),
        activeTo: new Date("2020-02-01"),
        maxRedemptions: null,
        redemptionCount: 0,
      },
      now: new Date("2026-01-01"),
    });
    expect(applied.error).toMatch(/vypršela/i);
  });
});

describe("Commerce Data Layer — provider status mapping", () => {
  it("maps Stripe-like statuses to events", () => {
    expect(mapProviderStatusToEventType("payment_intent.succeeded")).toBe(
      "payment.succeeded",
    );
    expect(mapProviderStatusToEventType("charge.refunded")).toBe(
      "payment.refunded",
    );
    expect(mapProviderStatusToEventType("charge.dispute.created")).toBe(
      "payment.chargeback",
    );
  });

  it("maps events to PaymentStatus / OrderStatus", () => {
    expect(paymentStatusForEvent("payment.succeeded")).toBe("SUCCEEDED");
    expect(orderStatusForEvent("payment.succeeded")).toBe("PAID");
    expect(paymentStatusForEvent("payment.failed")).toBe("FAILED");
    expect(orderStatusForEvent("payment.cancelled")).toBe("CANCELLED");
    expect(paymentStatusForEvent("payment.refunded", true)).toBe(
      "PARTIALLY_REFUNDED",
    );
  });
});
