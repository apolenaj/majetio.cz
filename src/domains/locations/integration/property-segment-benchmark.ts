/**
 * Property vs local segment median — core comparison for property detail.
 */

import type { PropertyCondition } from "@prisma/client";

import { inferMarketAge, encodeSegmentKey, normalizeLayout } from "@/domains/locations/metrics/segment";
import { getMetricDefinition } from "@/domains/locations/metrics/registry";
import { resolveMetricConfidence } from "@/domains/locations/metrics/confidence";
import type { LocationPageProfile } from "@/domains/locations/types/location-page";
import type { PropertySegmentBenchmark } from "@/domains/locations/integration/types";
import { segmentLabelFromKey } from "@/domains/locations/service/location-page-service";
import {
  getSegmentDistribution,
  resolveMarketPercentile,
} from "@/domains/locations/integration/market-percentiles";

const METHODOLOGY_HREF = "/metodika#lokality";

function pctDiff(property: number, median: number): number | null {
  if (median === 0) return null;
  return ((property - median) / Math.abs(median)) * 100;
}

export function resolvePropertySegmentKey(input: {
  propertyType: string;
  condition?: string | null;
  layout?: string | null;
}): string {
  const condition = (input.condition ?? "UNKNOWN") as PropertyCondition;
  const marketAge = inferMarketAge(condition);
  const pt = input.propertyType as "APARTMENT" | "HOUSE" | "LAND" | "COMMERCIAL" | "OTHER";
  return encodeSegmentKey({
    propertyType: pt,
    marketAge,
    layout: normalizeLayout(input.layout ?? "ALL"),
  });
}

export function buildPropertySegmentBenchmark(input: {
  propertyPricePerSqm: number | null;
  propertyType: string;
  condition?: string | null;
  layout?: string | null;
  profile: LocationPageProfile | null;
  priceKind?: "ASKING" | "TRANSACTION";
  /** Optional property rent Kč/m²/měs. for rent percentile. */
  propertyRentPerSqm?: number | null;
}): PropertySegmentBenchmark {
  const priceKind = input.priceKind ?? "ASKING";
  const empty: PropertySegmentBenchmark = {
    available: false,
    propertyPricePerSqm: input.propertyPricePerSqm,
    localMedianPricePerSqm: null,
    diffPct: null,
    diffAbsCzkPerSqm: null,
    segmentKey: "",
    segmentLabel: "",
    priceKind,
    period: "",
    sampleCount: null,
    confidence: null,
    methodologyVersion: "",
    methodologyHref: METHODOLOGY_HREF,
    source: "",
    locationSlug: null,
    locationLabel: "",
    rentBenchmarkPerSqm: null,
    priceTrendYoYPct: null,
    suppressReason: "Profil lokality není k dispozici.",
    purchasePricePercentile: null,
    rentPercentile: null,
    percentilesStatisticallyValid: false,
  };

  if (!input.profile || input.propertyPricePerSqm == null) {
    return {
      ...empty,
      suppressReason:
        input.propertyPricePerSqm == null
          ? "Chybí cena za m² nemovitosti."
          : empty.suppressReason,
    };
  }

  const segmentKey = resolvePropertySegmentKey(input);
  const segmentLabel = segmentLabelFromKey(segmentKey);
  const priceHistory = input.profile.priceHistoryBySegment[segmentKey];
  const medianSeries =
    priceKind === "TRANSACTION"
      ? priceHistory?.transaction
      : priceHistory?.asking;

  const localMedian = medianSeries?.points.at(-1)?.value ?? null;
  const metricDef = getMetricDefinition(
    priceKind === "TRANSACTION"
      ? "property_market.median_transaction_price_sqm"
      : "property_market.median_asking_price_sqm",
  );

  const sampleCount = medianSeries?.sampleCount ?? null;
  const confidenceDecision =
    metricDef && sampleCount != null
      ? resolveMetricConfidence(sampleCount, metricDef)
      : { display: false, confidence: 0, reason: "Chybí vzorek." };

  const askingDist = getSegmentDistribution(
    input.profile,
    segmentKey,
    "askingPriceSqm",
  );
  const rentDist = getSegmentDistribution(input.profile, segmentKey, "rentSqm");
  const purchasePct = resolveMarketPercentile(
    input.propertyPricePerSqm,
    askingDist,
  );
  const rentPct = resolveMarketPercentile(
    input.propertyRentPerSqm ?? null,
    rentDist,
  );

  if (!confidenceDecision.display || localMedian == null) {
    return {
      ...empty,
      segmentKey,
      segmentLabel,
      period: input.profile.periodLabel,
      locationSlug: input.profile.location.slug,
      locationLabel: input.profile.location.publicLabel,
      source: input.profile.source,
      methodologyVersion: input.profile.methodologyVersion,
      purchasePricePercentile: purchasePct.statisticallyValid
        ? purchasePct.percentile
        : null,
      rentPercentile: rentPct.statisticallyValid ? rentPct.percentile : null,
      percentilesStatisticallyValid:
        purchasePct.statisticallyValid || rentPct.statisticallyValid,
      suppressReason:
        confidenceDecision.reason ?? "Nedostatečný vzorek pro segment — srovnání potlačeno.",
    };
  }

  const diffPct = pctDiff(input.propertyPricePerSqm, localMedian);
  const rentHistory = input.profile.rentHistoryBySegment[segmentKey];
  const askingPoints = priceHistory?.asking?.points ?? [];
  const priceTrendYoYPct =
    askingPoints.length >= 13 && askingPoints.at(-1) && askingPoints.at(-13)
      ? pctDiff(askingPoints.at(-1)!.value, askingPoints.at(-13)!.value)
      : null;

  return {
    available: true,
    propertyPricePerSqm: input.propertyPricePerSqm,
    localMedianPricePerSqm: localMedian,
    diffPct,
    diffAbsCzkPerSqm:
      input.propertyPricePerSqm != null ? input.propertyPricePerSqm - localMedian : null,
    segmentKey,
    segmentLabel,
    priceKind,
    period: input.profile.periodLabel,
    sampleCount,
    confidence: confidenceDecision.confidence,
    methodologyVersion: input.profile.methodologyVersion,
    methodologyHref: input.profile.methodologyHref,
    source: input.profile.source,
    locationSlug: input.profile.location.slug,
    locationLabel: input.profile.location.publicLabel,
    rentBenchmarkPerSqm: rentHistory?.points.at(-1)?.value ?? null,
    priceTrendYoYPct,
    suppressReason: null,
    purchasePricePercentile: purchasePct.statisticallyValid
      ? purchasePct.percentile
      : null,
    rentPercentile: rentPct.statisticallyValid ? rentPct.percentile : null,
    percentilesStatisticallyValid:
      purchasePct.statisticallyValid || rentPct.statisticallyValid,
  };
}

export function formatBenchmarkHeadline(b: PropertySegmentBenchmark): string | null {
  if (!b.available || b.propertyPricePerSqm == null || b.localMedianPricePerSqm == null) {
    return null;
  }
  const prop = Math.round(b.propertyPricePerSqm / 1000);
  const med = Math.round(b.localMedianPricePerSqm / 1000);
  const sign = b.diffPct != null && b.diffPct > 0 ? "+" : "";
  const pct =
    b.diffPct != null ? `${sign}${b.diffPct.toFixed(1).replace(".", ",")} %` : "—";
  return `Tato nemovitost: ${prop} tis. Kč/m² vs lokální medián: ${med} tis. Kč/m² (${pct}) · ${b.segmentLabel}`;
}
