/**
 * Local market list prices — NEVER derive by FX from another market (Rules 160–162).
 * CZK 490 ≠ 19 EUR; each market has explicit PricingPlan rows / catalog seeds.
 */

import type { PricingBillingType } from "@prisma/client";

export type LocalPricingPlanSeed = {
  key: string;
  versionKey: string;
  name: string;
  description: string | null;
  billingType: PricingBillingType;
  /** Explicit local list price in minor units of `currency`. */
  priceGrossMinor: number;
  currency: string;
  marketCode: string;
  countryCode: string;
  taxRegion: string;
  vatRateBp: number;
  entitlesProductKey: string;
  sortOrder: number;
  features: string[];
  limits: Record<string, unknown>;
};

/**
 * Explicit AE AED prices — intentionally NOT `czkPrice / fxRate`.
 */
export const AE_LOCAL_PRICING_SEEDS: readonly LocalPricingPlanSeed[] = [
  {
    key: "full_analysis",
    versionKey: "ae.2026.07",
    name: "Full property analysis",
    description: "AED list price for UAE market — not FX of CZK plan.",
    billingType: "ONE_TIME",
    priceGrossMinor: 199_00, // 199.00 AED — local commercial decision
    currency: "AED",
    marketCode: "AE",
    countryCode: "AE",
    taxRegion: "AE",
    vatRateBp: 500,
    entitlesProductKey: "full_analysis",
    sortOrder: 10,
    features: ["valuation", "scenarios"],
    limits: { audience: "b2c" },
  },
  {
    key: "basic_analysis",
    versionKey: "ae.2026.07",
    name: "Basic property analysis",
    description: "AED list price for UAE market.",
    billingType: "ONE_TIME",
    priceGrossMinor: 0,
    currency: "AED",
    marketCode: "AE",
    countryCode: "AE",
    taxRegion: "AE",
    vatRateBp: 500,
    entitlesProductKey: "basic_analysis",
    sortOrder: 20,
    features: ["valuation"],
    limits: { audience: "b2c" },
  },
] as const;

export const ES_LOCAL_PRICING_SEEDS: readonly LocalPricingPlanSeed[] = [
  {
    key: "full_analysis",
    versionKey: "es.2026.07",
    name: "Análisis completo",
    description: "EUR list price for Spain — not FX of CZK 499.",
    billingType: "ONE_TIME",
    priceGrossMinor: 29_00, // €29.00 local
    currency: "EUR",
    marketCode: "ES",
    countryCode: "ES",
    taxRegion: "ES",
    vatRateBp: 2100,
    entitlesProductKey: "full_analysis",
    sortOrder: 10,
    features: ["valuation", "scenarios"],
    limits: { audience: "b2c" },
  },
] as const;

export function listLocalPricingSeedsForMarket(
  marketCode: string,
): LocalPricingPlanSeed[] {
  switch (marketCode.toUpperCase()) {
    case "AE":
      return [...AE_LOCAL_PRICING_SEEDS];
    case "ES":
      return [...ES_LOCAL_PRICING_SEEDS];
    default:
      return [];
  }
}

/**
 * Guard: refuse treating FX conversion as a PricingPlan list price.
 */
export function assertNotFxDerivedListPrice(input: {
  source: "LOCAL_CATALOG" | "FX_CONVERSION" | string;
}): void {
  if (input.source === "FX_CONVERSION") {
    throw new Error(
      "PricingPlan list prices must be explicit local amounts — FX conversion of another market's plan is forbidden.",
    );
  }
}
