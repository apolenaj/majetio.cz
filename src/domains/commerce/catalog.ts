/**
 * Commerce Data Layer — PricingPlan catalog (DB-first, config fallback seed).
 * List prices come from `@/config/pricing-architecture` (checklist 221).
 */

import type { PricingBillingType, PricingPlan, PricingPlanStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import {
  commerceConfig,
  DEFAULT_VAT_RATE_BP,
  assertCommerceCurrency,
  type CommerceCurrency,
} from "@/config/commerce";
import {
  pricingCatalog,
  PRICING_VERSION_KEY,
  type CatalogProductDef,
} from "@/config/pricing-architecture";
import { listLocalPricingSeedsForMarket } from "@/domains/commerce/local-pricing";
import { vatRateBpForPlan } from "@/domains/tax/provider-config";
export type PricingPlanLimits = {
  analysesPerMonth?: number | null;
  comparisonsMax?: number | null;
  seats?: number | null;
  /** B2B: max ACTIVE/RESERVED listings within quota. */
  maxActiveListings?: number | null;
  audience?: "b2c" | "b2b" | string | null;
  projectsMax?: number | null;
  [key: string]: unknown;
};

export type PublicPricingPlan = {
  id: string;
  key: string;
  versionKey: string;
  name: string;
  description: string | null;
  billingType: PricingBillingType;
  priceGrossMinor: number;
  currency: CommerceCurrency;
  /** Explicit market — never FX from another market's plan. */
  marketCode: string;
  countryCode: string;
  taxRegion: string;
  vatRateBp: number;
  entitlesProductKey: string;
  limits: PricingPlanLimits;
  features: string[];
  sortOrder: number;
};

function parseFeatures(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((x): x is string => typeof x === "string");
  }
  return [];
}

function parseLimits(raw: unknown): PricingPlanLimits {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as PricingPlanLimits;
  }
  return {};
}

export function toPublicPricingPlan(row: PricingPlan): PublicPricingPlan {
  return {
    id: row.id,
    key: row.key,
    versionKey: row.versionKey,
    name: row.name,
    description: row.description,
    billingType: row.billingType,
    priceGrossMinor: row.priceGrossMinor,
    currency: assertCommerceCurrency(row.currency),
    marketCode: row.marketCode ?? "CZ",
    countryCode: row.countryCode ?? "CZ",
    taxRegion:
      "taxRegion" in row && typeof (row as { taxRegion?: string }).taxRegion === "string"
        ? (row as { taxRegion: string }).taxRegion
        : (row.marketCode ?? "CZ"),
    vatRateBp: row.vatRateBp,
    entitlesProductKey: row.entitlesProductKey,
    limits: parseLimits(row.limits),
    features: parseFeatures(row.features),
    sortOrder: row.sortOrder,
  };
}

export type ListPricingPlansInput = {
  marketCode?: string;
  now?: Date;
};

/** Active plans for public ceník / checkout — never trust client amounts. */
export async function listActivePricingPlans(
  marketOrNow?: string | Date | ListPricingPlansInput,
  maybeNow?: Date,
): Promise<PublicPricingPlan[]> {
  let marketCode = "CZ";
  let now = new Date();
  if (typeof marketOrNow === "string") {
    marketCode = marketOrNow;
    now = maybeNow ?? new Date();
  } else if (marketOrNow instanceof Date) {
    now = marketOrNow;
  } else if (marketOrNow && typeof marketOrNow === "object") {
    marketCode = marketOrNow.marketCode ?? "CZ";
    now = marketOrNow.now ?? new Date();
  }

  const market = marketCode.toUpperCase();

  const rows = await prisma.pricingPlan.findMany({
    where: {
      status: "ACTIVE",
      marketCode: market,
      activeFrom: { lte: now },
      OR: [{ activeTo: null }, { activeTo: { gt: now } }],
    },
    orderBy: [{ sortOrder: "asc" }, { key: "asc" }],
  });

  if (rows.length > 0) {
    return rows.map(toPublicPricingPlan);
  }

  return fallbackPlansFromConfig(market);
}

export async function getActivePricingPlanByKey(
  key: string,
  marketOrNow: string | Date = "CZ",
  maybeNow?: Date,
): Promise<(PublicPricingPlan & { rowId: string | null }) | null> {
  let marketCode = "CZ";
  let now = new Date();
  if (typeof marketOrNow === "string") {
    marketCode = marketOrNow;
    now = maybeNow ?? new Date();
  } else {
    now = marketOrNow;
  }
  const market = marketCode.toUpperCase();

  const row = await prisma.pricingPlan.findFirst({
    where: {
      key,
      marketCode: market,
      status: "ACTIVE" satisfies PricingPlanStatus,
      activeFrom: { lte: now },
      OR: [{ activeTo: null }, { activeTo: { gt: now } }],
    },
    orderBy: { activeFrom: "desc" },
  });
  if (row) {
    return { ...toPublicPricingPlan(row), rowId: row.id };
  }

  const fallback = fallbackPlansFromConfig(market).find((p) => p.key === key);
  if (!fallback) return null;
  return { ...fallback, rowId: null };
}

function toDbBillingType(
  billing: CatalogProductDef["billingType"],
): PricingBillingType | null {
  if (billing === "CONTACT") return null;
  return billing;
}

function catalogToPublicPlan(def: CatalogProductDef): PublicPricingPlan | null {
  if (def.priceGrossMinor == null) return null;
  const billingType = toDbBillingType(def.billingType);
  if (!billingType) return null;
  return {
    id: `fallback_${def.key}`,
    key: def.key,
    versionKey: PRICING_VERSION_KEY,
    name: def.nameCs,
    description: def.taglineCs,
    billingType,
    priceGrossMinor: def.priceGrossMinor,
    currency: commerceConfig.currency,
    marketCode: "CZ",
    countryCode: "CZ",
    taxRegion: "CZ",
    vatRateBp: DEFAULT_VAT_RATE_BP,
    entitlesProductKey: def.entitlesProductKey,
    limits: def.limits as PricingPlanLimits,
    features: def.features,
    sortOrder: def.sortOrder,
  };
}

/** Dev / empty-DB fallback — CZ catalog + explicit local seeds (never FX). */
function fallbackPlansFromConfig(marketCode = "CZ"): PublicPricingPlan[] {
  const market = marketCode.toUpperCase();
  if (market === "CZ") {
    return pricingCatalog
      .map(catalogToPublicPlan)
      .filter((p): p is PublicPricingPlan => p != null)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  return listLocalPricingSeedsForMarket(market).map((seed) => ({
    id: `fallback_${seed.marketCode}_${seed.key}`,
    key: seed.key,
    versionKey: seed.versionKey,
    name: seed.name,
    description: seed.description,
    billingType: seed.billingType,
    priceGrossMinor: seed.priceGrossMinor,
    currency: assertCommerceCurrency(seed.currency),
    marketCode: seed.marketCode,
    countryCode: seed.countryCode,
    taxRegion: seed.taxRegion,
    vatRateBp: seed.vatRateBp,
    entitlesProductKey: seed.entitlesProductKey,
    limits: seed.limits as PricingPlanLimits,
    features: seed.features,
    sortOrder: seed.sortOrder,
  }));
}

/**
 * Ensure Phase 1 catalog plans exist (safe to call from bootstrap / admin).
 * Source of truth: `pricingCatalog` — never hardcode Kč here.
 */
export async function ensureDefaultPricingPlans(): Promise<number> {
  let upserted = 0;
  for (const def of pricingCatalog) {
    const billingType = toDbBillingType(def.billingType);
    if (billingType == null || def.priceGrossMinor == null) continue;

    const row = await prisma.pricingPlan.upsert({
      where: {
        key_versionKey: { key: def.key, versionKey: PRICING_VERSION_KEY },
      },
      create: {
        key: def.key,
        versionKey: PRICING_VERSION_KEY,
        name: def.nameCs,
        description: def.taglineCs,
        billingType,
        priceGrossMinor: def.priceGrossMinor,
        entitlesProductKey: def.entitlesProductKey,
        limits: def.limits,
        features: def.features,
        sortOrder: def.sortOrder,
        status: "ACTIVE",
        currency: "CZK",
        marketCode: "CZ",
        countryCode: "CZ",
        taxRegion: "CZ",
        vatRateBp: vatRateBpForPlan({ marketCode: "CZ", taxRegion: "CZ" }),
      },
      update: {
        name: def.nameCs,
        description: def.taglineCs,
        billingType,
        priceGrossMinor: def.priceGrossMinor,
        entitlesProductKey: def.entitlesProductKey,
        limits: def.limits,
        features: def.features,
        sortOrder: def.sortOrder,
        status: "ACTIVE",
        marketCode: "CZ",
        countryCode: "CZ",
        taxRegion: "CZ",
      },
    });
    const { writeMonetizationAuditLog } = await import(
      "@/domains/revenue/monetization-audit",
    );
    await writeMonetizationAuditLog({
      action: "pricing.plan.upsert",
      entity: "PricingPlan",
      entityId: row.id,
      actorId: null,
      meta: {
        key: def.key,
        versionKey: PRICING_VERSION_KEY,
        priceGrossMinor: def.priceGrossMinor,
        source: "ensureDefaultPricingPlans",
      },
    });
    upserted += 1;
  }
  return upserted;
}
