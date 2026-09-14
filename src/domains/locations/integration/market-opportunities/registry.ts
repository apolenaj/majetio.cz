/**
 * Data-driven Market Opportunity pages — each with explicit goal + methodology.
 * FORBIDDEN: generic "10 best locations" without defined objective.
 */

import type { MarketOpportunityDefinition } from "@/domains/locations/integration/types";

export const MARKET_OPPORTUNITY_REGISTRY: MarketOpportunityDefinition[] = [
  {
    slug: "vyssi-najemni-vynos",
    title: "Lokality s vyšším nájemním výnosem",
    goal: "Identifikovat lokality kde medián hrubého výnosu překračuje celorepublikový benchmark pro segment bytů 2+kk (secondary).",
    metricKey: "investment.gross_rental_yield",
    segmentKey: "pt:APARTMENT|age:secondary|lay:2+kk",
    sortDirection: "desc",
    minSampleCount: 12,
    minLocations: 5,
    methodologySlug: "market-opportunity-rental-yield",
    methodologySummary:
      "Ranking = medián hrubého výnosu (nájem/asking cena) za posledních 12 měsíců, segment byt 2+kk secondary. Lokality s vzorkem < 12 vyloučeny.",
    periodLabel: "Posledních 12 měsíců",
    audience: "Investoři hledající dlouhodobý pronájem",
    forbidden: false,
  },
  {
    slug: "vysoka-likvidita",
    title: "Lokality s vysokou likviditou trhu",
    goal: "Seřadit lokality podle kombinace nízkého mediánu DOM a vysokého počtu transakcí — proxy rychlého prodeje.",
    metricKey: "property_market.median_days_on_market",
    segmentKey: "pt:APARTMENT|age:secondary|lay:2+kk",
    sortDirection: "asc",
    minSampleCount: 10,
    minLocations: 5,
    methodologySlug: "market-opportunity-liquidity",
    methodologySummary:
      "Primární metrika: medián days on market (oříznuté outlierů). Sekundární: počet transakcí. Nižší DOM = vyšší pořadí.",
    periodLabel: "Posledních 12 měsíců",
    audience: "Flip strategie a rychlý exit",
    forbidden: false,
  },
  {
    slug: "rostouci-ceny",
    title: "Lokality s rostoucím trendem asking cen",
    goal: "YoY změna mediánu nabídkové ceny za m² ve stejném segmentu — segmentově očištěný trend.",
    metricKey: "property_market.median_asking_price_sqm",
    segmentKey: "pt:APARTMENT|age:secondary|lay:2+kk",
    sortDirection: "desc",
    minSampleCount: 15,
    minLocations: 5,
    methodologySlug: "market-opportunity-price-trend",
    methodologySummary:
      "YoY = (medián T − medián T−12m) / medián T−12m. Composition effect: segment fixní (byt 2+kk secondary).",
    periodLabel: "YoY vs. předchozí rok",
    audience: "Investoři sledující cenový momentum",
    forbidden: false,
  },
];

/** Explicitly blocked page patterns. */
export const FORBIDDEN_OPPORTUNITY_PATTERNS = [
  /^10-nejlepsich/i,
  /best-locations/i,
  /top-\d+-lokalit/i,
  /nejlepsi-lokality$/i,
] as const;

export function validateOpportunitySlug(slug: string): {
  allowed: boolean;
  reason?: string;
} {
  for (const pattern of FORBIDDEN_OPPORTUNITY_PATTERNS) {
    if (pattern.test(slug)) {
      return {
        allowed: false,
        reason: "Clickbait ranking bez definovaného cíle je zakázán.",
      };
    }
  }
  const def = MARKET_OPPORTUNITY_REGISTRY.find((d) => d.slug === slug);
  if (!def) return { allowed: false, reason: "Neznámá opportunity stránka." };
  if (def.forbidden) return { allowed: false, reason: "Stránka je explicitně zakázána." };
  return { allowed: true };
}

export function getMarketOpportunity(slug: string): MarketOpportunityDefinition | null {
  const check = validateOpportunitySlug(slug);
  if (!check.allowed) return null;
  return MARKET_OPPORTUNITY_REGISTRY.find((d) => d.slug === slug) ?? null;
}
