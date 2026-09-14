import { describe, expect, it } from "vitest";

import { splitGrossVat, formatCzkFromMinor } from "@/config/commerce";
import {
  applyPromoDiscount,
  buildPriceQuote,
  quoteFromOrderSnapshot,
} from "@/domains/payments/service/pricing";

describe("Payments pricing — VAT (186)", () => {
  it("splits gross into net + VAT at 21%", () => {
    const split = splitGrossVat({ grossMinor: 499_000, vatRateBp: 2100 });
    expect(split.grossMinor).toBe(499_000);
    expect(split.netMinor + split.vatMinor).toBe(499_000);
    expect(split.vatMinor).toBeGreaterThan(0);
    expect(formatCzkFromMinor(split.grossMinor)).toMatch(/4.?990/);
  });

  it("zero price has zero VAT", () => {
    expect(splitGrossVat({ grossMinor: 0 })).toEqual({
      netMinor: 0,
      vatMinor: 0,
      grossMinor: 0,
      vatRateBp: 2100,
    });
  });
});

describe("Payments pricing — historical price versions (187)", () => {
  it("old order snapshot keeps legacy price even if catalog changed", () => {
    const historical = quoteFromOrderSnapshot({
      productKey: "full_analysis",
      priceVersionKey: "v2025.01",
      currency: "CZK",
      amountGrossMinor: 399_000,
      amountNetMinor: 329_752,
      amountVatMinor: 69_248,
      vatRateBp: 2100,
      discountMinor: 0,
      promoCodeSnapshot: null,
    });
    expect(historical.priceVersionKey).toBe("v2025.01");
    expect(historical.grossMinor).toBe(399_000);

    const current = buildPriceQuote({
      productKey: "full_analysis",
      priceVersionKey: "v2026.07",
      listGrossMinor: 499_000,
      currency: "CZK",
    });
    expect("error" in current).toBe(false);
    if (!("error" in current)) {
      expect(current.grossMinor).toBe(499_000);
      expect(current.grossMinor).not.toBe(historical.grossMinor);
    }
  });

  it("rejects disallowed currency", () => {
    const quote = buildPriceQuote({
      productKey: "full_analysis",
      priceVersionKey: "v1",
      listGrossMinor: 100,
      currency: "USD",
    });
    expect("error" in quote).toBe(true);
  });
});

describe("Payments pricing — promo codes (188)", () => {
  const basePromo = {
    code: "MAJETIO10",
    discountType: "PERCENT" as const,
    discountValue: 1000, // 10%
    productKeys: ["full_analysis"],
    active: true,
    activeFrom: new Date("2020-01-01"),
    activeTo: null as Date | null,
    maxRedemptions: 100,
    redemptionCount: 0,
  };

  it("applies percent promo", () => {
    const applied = applyPromoDiscount({
      listGrossMinor: 499_000,
      productKey: "full_analysis",
      promo: basePromo,
    });
    expect(applied.discountMinor).toBe(49_900);
    expect(applied.grossMinor).toBe(449_100);
  });

  it("applies fixed promo in minor units", () => {
    const applied = applyPromoDiscount({
      listGrossMinor: 499_000,
      productKey: "full_analysis",
      promo: {
        ...basePromo,
        discountType: "FIXED_CZK",
        discountValue: 50_000,
      },
    });
    expect(applied.discountMinor).toBe(50_000);
    expect(applied.grossMinor).toBe(449_000);
  });

  it("rejects expired or wrong-product promo", () => {
    expect(
      applyPromoDiscount({
        listGrossMinor: 499_000,
        productKey: "full_analysis",
        promo: { ...basePromo, activeTo: new Date("2020-01-02") },
        now: new Date("2026-01-01"),
      }).error,
    ).toMatch(/vypršela/i);

    expect(
      applyPromoDiscount({
        listGrossMinor: 499_000,
        productKey: "basic_analysis",
        promo: basePromo,
      }).error,
    ).toMatch(/neplatí pro tento produkt/i);
  });

  it("buildPriceQuote includes VAT after promo", () => {
    const quote = buildPriceQuote({
      productKey: "full_analysis",
      priceVersionKey: "v2026.07",
      listGrossMinor: 499_000,
      currency: "CZK",
      promo: basePromo,
    });
    expect("error" in quote).toBe(false);
    if (!("error" in quote)) {
      expect(quote.discountMinor).toBe(49_900);
      expect(quote.netMinor + quote.vatMinor).toBe(quote.grossMinor);
      expect(quote.promoCode).toBe("MAJETIO10");
    }
  });
});
