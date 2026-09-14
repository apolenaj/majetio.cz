/**
 * Commerce fallback helpers — runtime catalog is PricingPlan (DB).
 * Canonical list prices live in `@/config/pricing-architecture` (bod 221).
 * UI must load plans via `@/domains/commerce` (`listActivePricingPlans`)
 * or `getCatalogProductByKey` — never hardcode Kč in React components.
 */

import {
  getCatalogProductByKey,
  PRICING_VERSION_KEY,
} from "@/config/pricing-architecture";

export const COMMERCE_ALLOWED_CURRENCIES = ["CZK", "EUR", "AED"] as const;
export type CommerceCurrency = (typeof COMMERCE_ALLOWED_CURRENCIES)[number];

/** Czech standard VAT 21 % in basis points — prefer Tax Provider Config per market. */
export const DEFAULT_VAT_RATE_BP = 2100;

const fullAnalysis = getCatalogProductByKey("full_analysis");
const basicAnalysis = getCatalogProductByKey("basic_analysis");

export const commerceConfig = {
  /** Multi-market checkout currencies — list prices stay local (no FX of plans). */
  allowedCurrencies: COMMERCE_ALLOWED_CURRENCIES,
  currency: "CZK" as CommerceCurrency,
  vatRateBp: DEFAULT_VAT_RATE_BP,
  products: {
    fullAnalysis: {
      key: "full_analysis" as const,
      name: fullAnalysis?.nameCs ?? "Kompletní analýza nemovitosti",
      priceGrossMinor: fullAnalysis?.priceGrossMinor ?? 499_000,
      /** @deprecated major units — prefer priceGrossMinor */
      priceCzk: Math.round((fullAnalysis?.priceGrossMinor ?? 499_000) / 100),
      priceVersionKey: PRICING_VERSION_KEY,
      entitlesProductKey: "full_analysis" as const,
    },
    basicAnalysis: {
      key: "basic_analysis" as const,
      name: basicAnalysis?.nameCs ?? "Základní analýza nemovitosti",
      priceGrossMinor: basicAnalysis?.priceGrossMinor ?? 0,
      priceCzk: Math.round((basicAnalysis?.priceGrossMinor ?? 0) / 100),
      priceVersionKey: PRICING_VERSION_KEY,
      entitlesProductKey: "basic_analysis" as const,
    },
  },
  commissions: {
    transactionRate: 0.01,
  },
  hypotekaJasne: {
    leadProductKey: "hypotekajasne_lead",
  },
  checkout: {
    /** Steps for UX (checklist 129). */
    steps: [
      "select_product",
      "review",
      "billing",
      "payment",
      "confirmation",
      "entitlement",
      "success",
    ] as const,
  },
} as const;

export type CommerceConfig = typeof commerceConfig;
export type CommerceProductKey =
  | typeof commerceConfig.products.fullAnalysis.key
  | typeof commerceConfig.products.basicAnalysis.key;

export const configKeys = {
  fullAnalysisPrice: "pricing.fullAnalysisCzk",
  transactionCommission: "commission.transactionRate",
} as const;

export function isCommerceCurrency(value: string): value is CommerceCurrency {
  return (COMMERCE_ALLOWED_CURRENCIES as readonly string[]).includes(value);
}

export function assertCommerceCurrency(value: string): CommerceCurrency {
  const upper = value.toUpperCase();
  if (!isCommerceCurrency(upper)) {
    throw new Error(`Currency not allowed for checkout: ${value}`);
  }
  return upper;
}

export function getCatalogProduct(productKey: string) {
  const products = Object.values(commerceConfig.products);
  return products.find((p) => p.key === productKey) ?? null;
}

/** Split gross minor into net + VAT (VAT inclusive pricing). */
export function splitGrossVat(input: {
  grossMinor: number;
  vatRateBp?: number;
}): { netMinor: number; vatMinor: number; grossMinor: number; vatRateBp: number } {
  const vatRateBp = input.vatRateBp ?? DEFAULT_VAT_RATE_BP;
  const grossMinor = Math.max(0, Math.round(input.grossMinor));
  if (grossMinor === 0) {
    return { netMinor: 0, vatMinor: 0, grossMinor: 0, vatRateBp };
  }
  const netMinor = Math.round((grossMinor * 10_000) / (10_000 + vatRateBp));
  const vatMinor = grossMinor - netMinor;
  return { netMinor, vatMinor, grossMinor, vatRateBp };
}

export function formatMoneyFromMinor(
  minor: number,
  currency: string = "CZK",
): string {
  const major = minor / 100;
  const cur = isCommerceCurrency(currency) ? currency : "CZK";
  const locale =
    cur === "CZK" ? "cs-CZ" : cur === "EUR" ? "es-ES" : "en-AE";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: cur,
    maximumFractionDigits: 2,
  }).format(major);
}

/** @deprecated Prefer formatMoneyFromMinor(minor, currency) for multi-market. */
export function formatCzkFromMinor(minor: number): string {
  return formatMoneyFromMinor(minor, "CZK");
}
