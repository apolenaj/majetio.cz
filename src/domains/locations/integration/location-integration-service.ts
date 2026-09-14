/**
 * Location Intelligence integration orchestrator.
 */

import { loadLocationPageProfile } from "@/domains/locations/service/location-page-service";
import {
  buildPropertySegmentBenchmark,
  formatBenchmarkHeadline,
} from "@/domains/locations/integration/property-segment-benchmark";
import { buildValuationLocationContext } from "@/domains/locations/integration/valuation-context";
import { buildInvestmentLocationBenchmark } from "@/domains/locations/integration/investment-benchmark";
import {
  getSegmentDistribution,
  resolveMarketPercentile,
} from "@/domains/locations/integration/market-percentiles";
import { buildMarketOpportunityInsight } from "@/domains/locations/integration/market-opportunity-insight";
import { buildLocationRiskFacts } from "@/domains/locations/integration/location-risk-facts";
import { buildLocationMarketContextBlock } from "@/domains/locations/integration/market-context";
import { buildStrRegulatoryContext } from "@/domains/locations/integration/str-regulatory-context";
import { locationHref } from "@/domains/locations/seo/location-urls";
import type {
  InvestmentLocationBenchmark,
  PropertySegmentBenchmark,
  ValuationLocationContext,
} from "@/domains/locations/integration/types";
import type { MarketOpportunityInsight } from "@/domains/locations/integration/market-opportunity-insight";
import type { LocationRiskFactsResult } from "@/domains/locations/integration/location-risk-facts";
import type { LocationMarketContextBlock } from "@/domains/locations/integration/market-context";
import type { LocationStrRegulatoryBundle } from "@/domains/locations/integration/str-regulatory-context";

function inferLocationSlug(city?: string | null, district?: string | null): string | null {
  const raw = (district ?? city ?? "").toLowerCase();
  if (raw.includes("vinohrady")) return "praha-vinohrady";
  if (raw.includes("praha")) return "praha";
  if (raw.includes("brno")) return "brno";
  return city
    ? city
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .replace(/\s+/g, "-")
    : null;
}

export type PropertyLocationIntelligenceBundle = {
  segmentBenchmark: PropertySegmentBenchmark;
  headline: string | null;
  valuationContext: ValuationLocationContext | null;
  investmentBenchmark: InvestmentLocationBenchmark | null;
  locationPageHref: string | null;
  opportunityInsight: MarketOpportunityInsight;
  locationRisks: LocationRiskFactsResult;
  marketContext: LocationMarketContextBlock;
  strRegulatory: LocationStrRegulatoryBundle;
};

export async function resolveLocationIntelligenceForProperty(input: {
  propertyType: string;
  condition?: string | null;
  layout?: string | null;
  pricePerSqm?: number | null;
  askingPrice?: number | null;
  usableArea?: number | null;
  locationCity?: string | null;
  locationDistrict?: string | null;
  locationSlug?: string | null;
  /** Optional known/asking rent Kč/měs. for rent percentile. */
  monthlyRentCzk?: number | null;
}): Promise<PropertyLocationIntelligenceBundle> {
  const slug =
    input.locationSlug ??
    inferLocationSlug(input.locationCity, input.locationDistrict);
  const profile = slug ? await loadLocationPageProfile(slug) : null;

  const pricePerSqm =
    input.pricePerSqm ??
    (input.askingPrice != null && input.usableArea != null && input.usableArea > 0
      ? input.askingPrice / input.usableArea
      : null);

  const investmentBenchmark = buildInvestmentLocationBenchmark({
    profile,
    propertyType: input.propertyType,
    condition: input.condition,
    layout: input.layout,
    usableAreaSqm: input.usableArea ?? null,
    askingPriceCzk: input.askingPrice ?? null,
  });

  const propertyRentPerSqm =
    input.monthlyRentCzk != null &&
    input.usableArea != null &&
    input.usableArea > 0
      ? input.monthlyRentCzk / input.usableArea
      : null;

  const segmentBenchmark = buildPropertySegmentBenchmark({
    propertyPricePerSqm: pricePerSqm,
    propertyType: input.propertyType,
    condition: input.condition,
    layout: input.layout,
    profile,
    propertyRentPerSqm,
  });

  const purchasePct = resolveMarketPercentile(
    pricePerSqm,
    getSegmentDistribution(profile, segmentBenchmark.segmentKey, "askingPriceSqm"),
  );
  const rentPct = resolveMarketPercentile(
    propertyRentPerSqm,
    getSegmentDistribution(profile, segmentBenchmark.segmentKey, "rentSqm"),
  );

  const opportunityInsight = buildMarketOpportunityInsight({
    purchase: purchasePct,
    rent: rentPct,
    segmentLabel: segmentBenchmark.segmentLabel || "segment",
    locationLabel: segmentBenchmark.locationLabel || profile?.location.publicLabel || "lokalitě",
  });

  const marketContext = buildLocationMarketContextBlock(
    profile,
    segmentBenchmark.segmentKey || profile?.defaultSegmentKey || "",
  );
  const strRegulatory = buildStrRegulatoryContext(profile);

  const locationRisks = buildLocationRiskFacts({
    profile,
    segmentBenchmark,
    marketContext: {
      priceVolatilityCv: marketContext.priceVolatility.cv,
      developmentUnits: marketContext.development.unitsUnderConstruction,
      strRegulatoryLevel: strRegulatory.regulatory.available
        ? strRegulatory.regulatory.shortTermRentalLevel
        : null,
    },
  });

  return {
    segmentBenchmark,
    headline: formatBenchmarkHeadline(segmentBenchmark),
    valuationContext: buildValuationLocationContext({
      profile,
      propertyType: input.propertyType,
      condition: input.condition,
      layout: input.layout,
    }),
    investmentBenchmark,
    locationPageHref: profile ? locationHref(profile.location.slug) : null,
    opportunityInsight,
    locationRisks,
    marketContext,
    strRegulatory,
  };
}
