/**
 * Pure pricing helpers — VAT display, historical versions, promo discounts.
 */

import {
  DEFAULT_VAT_RATE_BP,
  assertCommerceCurrency,
  getCatalogProduct,
  splitGrossVat,
  type CommerceCurrency,
} from "@/config/commerce";

export type PriceQuote = {
  productKey: string;
  priceVersionKey: string;
  currency: CommerceCurrency;
  listGrossMinor: number;
  discountMinor: number;
  grossMinor: number;
  netMinor: number;
  vatMinor: number;
  vatRateBp: number;
  promoCode: string | null;
};

export type PromoDefinition = {
  code: string;
  discountType: "PERCENT" | "FIXED_CZK";
  /** Percent in basis points (1000 = 10%) or fixed minor units. */
  discountValue: number;
  productKeys: string[];
  active: boolean;
  activeFrom: Date;
  activeTo: Date | null;
  maxRedemptions: number | null;
  redemptionCount: number;
};

export function applyPromoDiscount(input: {
  listGrossMinor: number;
  productKey: string;
  promo: PromoDefinition | null;
  now?: Date;
}): { discountMinor: number; grossMinor: number; error?: string } {
  const list = Math.max(0, Math.round(input.listGrossMinor));
  if (!input.promo) {
    return { discountMinor: 0, grossMinor: list };
  }
  const now = input.now ?? new Date();
  const p = input.promo;
  if (!p.active) return { discountMinor: 0, grossMinor: list, error: "Promo kód není aktivní." };
  if (p.activeFrom > now) {
    return { discountMinor: 0, grossMinor: list, error: "Promo kód ještě neplatí." };
  }
  if (p.activeTo && p.activeTo < now) {
    return { discountMinor: 0, grossMinor: list, error: "Platnost promo kódu vypršela." };
  }
  if (p.maxRedemptions != null && p.redemptionCount >= p.maxRedemptions) {
    return { discountMinor: 0, grossMinor: list, error: "Promo kód byl vyčerpán." };
  }
  if (p.productKeys.length > 0 && !p.productKeys.includes(input.productKey)) {
    return {
      discountMinor: 0,
      grossMinor: list,
      error: "Promo kód neplatí pro tento produkt.",
    };
  }

  let discountMinor = 0;
  if (p.discountType === "PERCENT") {
    discountMinor = Math.round((list * p.discountValue) / 10_000);
  } else {
    discountMinor = Math.min(list, Math.round(p.discountValue));
  }
  discountMinor = Math.max(0, Math.min(list, discountMinor));
  return { discountMinor, grossMinor: list - discountMinor };
}

/**
 * Build a quote from a frozen price version (historical) + optional promo.
 * Old orders must keep their versionKey / amounts — never reprice.
 */
export function buildPriceQuote(input: {
  productKey: string;
  priceVersionKey: string;
  listGrossMinor: number;
  currency: string;
  vatRateBp?: number;
  promo?: PromoDefinition | null;
  now?: Date;
}): PriceQuote | { error: string } {
  let currency: CommerceCurrency;
  try {
    currency = assertCommerceCurrency(input.currency);
  } catch {
    return { error: `Nepovolená měna: ${input.currency}` };
  }

  const catalog = getCatalogProduct(input.productKey);
  if (!catalog) return { error: "Neznámý produkt." };

  const applied = applyPromoDiscount({
    listGrossMinor: input.listGrossMinor,
    productKey: input.productKey,
    promo: input.promo ?? null,
    now: input.now,
  });
  if (applied.error && input.promo) {
    return { error: applied.error };
  }

  const split = splitGrossVat({
    grossMinor: applied.grossMinor,
    vatRateBp: input.vatRateBp ?? DEFAULT_VAT_RATE_BP,
  });

  return {
    productKey: input.productKey,
    priceVersionKey: input.priceVersionKey,
    currency,
    listGrossMinor: input.listGrossMinor,
    discountMinor: applied.discountMinor,
    grossMinor: split.grossMinor,
    netMinor: split.netMinor,
    vatMinor: split.vatMinor,
    vatRateBp: split.vatRateBp,
    promoCode: input.promo?.code ?? null,
  };
}

/** Historical order display — never recompute from current catalog. */
export function quoteFromOrderSnapshot(input: {
  productKey: string;
  priceVersionKey: string;
  currency: string;
  amountGrossMinor: number;
  amountNetMinor: number;
  amountVatMinor: number;
  vatRateBp: number;
  discountMinor: number;
  promoCodeSnapshot: string | null;
}): PriceQuote {
  return {
    productKey: input.productKey,
    priceVersionKey: input.priceVersionKey,
    currency: assertCommerceCurrency(input.currency),
    listGrossMinor: input.amountGrossMinor + input.discountMinor,
    discountMinor: input.discountMinor,
    grossMinor: input.amountGrossMinor,
    netMinor: input.amountNetMinor,
    vatMinor: input.amountVatMinor,
    vatRateBp: input.vatRateBp,
    promoCode: input.promoCodeSnapshot,
  };
}
