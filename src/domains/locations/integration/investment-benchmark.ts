/**
 * Investment Engine — location benchmarks as suggestions (never overwrite user inputs).
 */

import type { LocationPageProfile } from "@/domains/locations/types/location-page";
import type { InvestmentLocationBenchmark } from "@/domains/locations/integration/types";
import { resolvePropertySegmentKey } from "@/domains/locations/integration/property-segment-benchmark";

const DISCLAIMER =
  "Benchmark z lokality je návrh výchozí hodnoty. Uživatelské vstupy v kalkulačce mají vždy přednost.";

/** Proxy vacancy from rent listings turnover + price reduction rate. */
function proxyVacancyRatePp(profile: LocationPageProfile): number | null {
  const turnover = profile.supplyDemand.rentTurnover?.value;
  const reduction = profile.supplyDemand.priceReductionRate?.value;
  if (turnover == null && reduction == null) return null;
  const base = 5;
  const fromTurnover = turnover != null ? (1 - turnover) * 15 : 0;
  const fromReduction = reduction != null ? reduction * 10 : 0;
  return Math.min(25, Math.max(3, base + fromTurnover + fromReduction));
}

export function buildInvestmentLocationBenchmark(input: {
  profile: LocationPageProfile | null;
  propertyType: string;
  condition?: string | null;
  layout?: string | null;
  usableAreaSqm: number | null;
  askingPriceCzk: number | null;
}): InvestmentLocationBenchmark | null {
  if (!input.profile) return null;

  const segmentKey = resolvePropertySegmentKey(input);
  const rentPerSqm = input.profile.rentHistoryBySegment[segmentKey]?.points.at(-1)?.value ?? null;
  const grossYield =
    input.profile.investment.grossYield.value ??
    input.profile.summary.find((m) => m.key === "investment.gross_rental_yield")?.value ??
    null;

  const suggestedRent =
    rentPerSqm != null && input.usableAreaSqm != null
      ? Math.round(rentPerSqm * input.usableAreaSqm)
      : null;

  const vacancy = proxyVacancyRatePp(input.profile);

  if (suggestedRent == null && grossYield == null && vacancy == null) return null;

  return {
    role: "benchmark_suggestion",
    suggestedMonthlyRentCzk: suggestedRent,
    locationMedianRentPerSqm: rentPerSqm,
    locationGrossYieldPct: grossYield,
    suggestedVacancyRatePp: vacancy,
    period: input.profile.periodLabel,
    sampleCount: input.profile.rentHistoryBySegment[segmentKey]?.sampleCount ?? null,
    confidence: input.profile.investment.grossYield.confidence ?? null,
    methodologyHref: input.profile.methodologyHref,
    source: input.profile.source,
    disclaimer: DISCLAIMER,
  };
}
