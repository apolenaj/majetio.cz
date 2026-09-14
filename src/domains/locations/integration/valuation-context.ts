/**
 * Valuation Engine — location market context (NOT a comp replacement).
 */

import type { LocationPageProfile } from "@/domains/locations/types/location-page";
import type { ValuationLocationContext } from "@/domains/locations/integration/types";
import {
  resolvePropertySegmentKey,
} from "@/domains/locations/integration/property-segment-benchmark";

const DISCLAIMER =
  "Lokální cenová hladina slouží jako kontext odhadu. Odhad hodnoty vychází z comparables, ne z mediánu lokality.";

export function buildValuationLocationContext(input: {
  profile: LocationPageProfile | null;
  propertyType: string;
  condition?: string | null;
  layout?: string | null;
}): ValuationLocationContext | null {
  if (!input.profile) return null;

  const segmentKey = resolvePropertySegmentKey(input);
  const priceHistory = input.profile.priceHistoryBySegment[segmentKey];
  const asking = priceHistory?.asking?.points.at(-1)?.value ?? null;
  const transaction = priceHistory?.transaction?.points.at(-1)?.value ?? null;

  const askingPoints = priceHistory?.asking?.points ?? [];
  const priceTrendYoYPct =
    askingPoints.length >= 13
      ? ((askingPoints.at(-1)!.value - askingPoints.at(-13)!.value) /
          Math.abs(askingPoints.at(-13)!.value)) *
        100
      : null;

  if (asking == null && transaction == null) return null;

  return {
    role: "market_context",
    medianAskingPriceSqm: asking,
    medianTransactionPriceSqm: transaction,
    priceTrendYoYPct,
    segmentKey,
    segmentLabel: segmentKey,
    period: input.profile.periodLabel,
    sampleCount: priceHistory?.asking?.sampleCount ?? null,
    confidence: input.profile.summary.find(
      (m) => m.key === "property_market.median_asking_price_sqm",
    )?.confidence ?? null,
    methodologyHref: input.profile.methodologyHref,
    disclaimer: DISCLAIMER,
  };
}
