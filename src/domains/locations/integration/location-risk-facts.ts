/**
 * Location → Risk Engine facts.
 * Pure signals from location metrics — never stereotypical assumptions.
 */

import type { LocationPageProfile } from "@/domains/locations/types/location-page";
import type { PropertySegmentBenchmark } from "@/domains/locations/integration/types";
import type { PropertyRiskItem } from "@/content/demo-property-context";

export const LOCATION_RISK_FACT_CODES = [
  "low_liquidity",
  "declining_rent_trend",
  "declining_price_trend",
  "high_supply_growth",
  "low_sample_confidence",
  "high_price_volatility",
  "development_pipeline_pressure",
  "str_regulatory_restriction",
] as const;

export type LocationRiskFactCode = (typeof LOCATION_RISK_FACT_CODES)[number];

export type LocationRiskFact = {
  code: LocationRiskFactCode;
  severity: "info" | "warning" | "critical";
  /** Machine-readable evidence for Risk Engine / analytics. */
  evidence: {
    metricKey?: string;
    value?: number | null;
    threshold?: number | null;
    sampleCount?: number | null;
    confidence?: number | null;
    period?: string;
  };
  message: string;
};

export type LocationRiskFactsResult = {
  facts: LocationRiskFact[];
  /** Mapped for PropertyRisksSection UI. */
  propertyRiskItems: PropertyRiskItem[];
};

const DOM_HIGH_DAYS = 60;
const SUPPLY_HIGH = 1500;
const CONFIDENCE_LOW = 0.55;
const TREND_DECLINE_PCT = -2;
const VOLATILITY_HIGH_CV = 0.08;

function severityToUi(
  s: LocationRiskFact["severity"],
): PropertyRiskItem["severity"] {
  if (s === "critical") return "critical";
  if (s === "warning") return "high";
  return "medium";
}

/**
 * Derive location risk facts from profile + segment benchmark — data only.
 */
export function buildLocationRiskFacts(input: {
  profile: LocationPageProfile | null;
  segmentBenchmark: PropertySegmentBenchmark;
  marketContext?: {
    priceVolatilityCv?: number | null;
    developmentUnits?: number | null;
    strRegulatoryLevel?: "none" | "limited" | "restricted" | "unknown" | null;
  };
}): LocationRiskFactsResult {
  const facts: LocationRiskFact[] = [];
  const { profile, segmentBenchmark: seg, marketContext } = input;

  if (!profile) {
    return { facts: [], propertyRiskItems: [] };
  }

  const dom = profile.supplyDemand.medianDom.value;
  const domSample = profile.supplyDemand.medianDom.sampleCount;
  if (dom != null && domSample != null && domSample >= 20 && dom >= DOM_HIGH_DAYS) {
    facts.push({
      code: "low_liquidity",
      severity: dom >= 90 ? "critical" : "warning",
      evidence: {
        metricKey: "property_market.median_days_on_market",
        value: dom,
        threshold: DOM_HIGH_DAYS,
        sampleCount: domSample,
        period: profile.periodLabel,
      },
      message: `Nízká likvidita: medián DOM ${Math.round(dom)} dní (práh ${DOM_HIGH_DAYS}, vzorek ${domSample}).`,
    });
  }

  const rentTrend = rentTrendYoY(profile, seg.segmentKey);
  if (rentTrend != null && rentTrend <= TREND_DECLINE_PCT) {
    facts.push({
      code: "declining_rent_trend",
      severity: "warning",
      evidence: {
        metricKey: "rental_market.median_asking_rent_sqm",
        value: rentTrend,
        threshold: TREND_DECLINE_PCT,
        period: profile.periodLabel,
      },
      message: `Klesající trend nájmů: ${rentTrend.toFixed(1)} % YoY v segmentu.`,
    });
  }

  if (seg.priceTrendYoYPct != null && seg.priceTrendYoYPct <= TREND_DECLINE_PCT) {
    facts.push({
      code: "declining_price_trend",
      severity: "warning",
      evidence: {
        metricKey: "property_market.median_asking_price_sqm",
        value: seg.priceTrendYoYPct,
        threshold: TREND_DECLINE_PCT,
        sampleCount: seg.sampleCount,
        period: seg.period,
      },
      message: `Klesající trend cen: ${seg.priceTrendYoYPct.toFixed(1)} % YoY.`,
    });
  }

  const listings = profile.supplyDemand.activeListings.value;
  const listingsSample = profile.supplyDemand.activeListings.sampleCount;
  if (
    listings != null &&
    listingsSample != null &&
    listingsSample >= 50 &&
    listings >= SUPPLY_HIGH
  ) {
    facts.push({
      code: "high_supply_growth",
      severity: "info",
      evidence: {
        metricKey: "property_market.active_listings_count",
        value: listings,
        threshold: SUPPLY_HIGH,
        sampleCount: listingsSample,
        period: profile.periodLabel,
      },
      message: `Vysoká nabídka: ${Math.round(listings)} aktivních inzerátů (práh ${SUPPLY_HIGH}).`,
    });
  }

  if (
    seg.confidence != null &&
    seg.confidence < CONFIDENCE_LOW &&
    seg.sampleCount != null
  ) {
    facts.push({
      code: "low_sample_confidence",
      severity: "warning",
      evidence: {
        confidence: seg.confidence,
        sampleCount: seg.sampleCount,
        threshold: CONFIDENCE_LOW,
        period: seg.period,
      },
      message: `Nízká confidence lokálního benchmarku (${(seg.confidence * 100).toFixed(0)} %, vzorek ${seg.sampleCount}).`,
    });
  }

  const cv = marketContext?.priceVolatilityCv;
  if (cv != null && cv >= VOLATILITY_HIGH_CV) {
    facts.push({
      code: "high_price_volatility",
      severity: "warning",
      evidence: {
        metricKey: "property_market.price_volatility_cv",
        value: cv,
        threshold: VOLATILITY_HIGH_CV,
        period: profile.periodLabel,
      },
      message: `Vyšší volatilita cen: variační koeficient ${(cv * 100).toFixed(1)} % v čase.`,
    });
  }

  const units = marketContext?.developmentUnits;
  if (units != null && units >= 2000) {
    facts.push({
      code: "development_pipeline_pressure",
      severity: "info",
      evidence: {
        metricKey: "development.units_under_construction",
        value: units,
        threshold: 2000,
        period: profile.periodLabel,
      },
      message: `Tlak nové výstavby: ${units.toLocaleString("cs-CZ")} jednotek ve výstavbě.`,
    });
  }

  const reg = marketContext?.strRegulatoryLevel;
  if (reg === "restricted" || reg === "limited") {
    facts.push({
      code: "str_regulatory_restriction",
      severity: reg === "restricted" ? "warning" : "info",
      evidence: {
        metricKey: "regulatory.short_term_rental",
        value: reg === "restricted" ? 2 : 1,
        period: profile.periodLabel,
      },
      message:
        reg === "restricted"
          ? "Regulace krátkodobých pronájmů: omezení v lokalitě (zdroj: regulatory context)."
          : "Částečná regulace krátkodobých pronájmů v lokalitě (zdroj: regulatory context).",
    });
  }

  const propertyRiskItems: PropertyRiskItem[] = facts.map((f) => ({
    id: `loc-${f.code}`,
    title: factTitle(f.code),
    severity: severityToUi(f.severity),
    text: f.message,
  }));

  return { facts, propertyRiskItems };
}

function factTitle(code: LocationRiskFactCode): string {
  const map: Record<LocationRiskFactCode, string> = {
    low_liquidity: "Nízká likvidita lokality",
    declining_rent_trend: "Klesající nájmy",
    declining_price_trend: "Klesající ceny",
    high_supply_growth: "Vysoká nabídka",
    low_sample_confidence: "Nízká jistota dat",
    high_price_volatility: "Volatilita cen",
    development_pipeline_pressure: "Nová výstavba",
    str_regulatory_restriction: "Regulace short-term",
  };
  return map[code];
}

function rentTrendYoY(
  profile: LocationPageProfile,
  segmentKey: string,
): number | null {
  const points = profile.rentHistoryBySegment[segmentKey]?.points ?? [];
  if (points.length < 13) return null;
  const last = points.at(-1)?.value;
  const yearAgo = points.at(-13)?.value;
  if (last == null || yearAgo == null || yearAgo === 0) return null;
  return ((last - yearAgo) / Math.abs(yearAgo)) * 100;
}

/**
 * Optional enrichment for investment Risk Engine consumers.
 * Location facts do not alter cash-flow math — they annotate context.
 */
export function locationFactsForRiskEngine(
  facts: LocationRiskFact[],
): Array<{ code: string; severity: string; message: string }> {
  return facts.map((f) => ({
    code: `location.${f.code}`,
    severity: f.severity,
    message: f.message,
  }));
}
