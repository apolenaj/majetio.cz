import { DEFAULT_METRIC_AGGREGATION_CONFIG } from "@/domains/locations/metrics/registry";
import {
  aggregateNumeric,
  trimmedValues,
} from "@/domains/locations/metrics/statistics";

export type ListingObservation = {
  listingId: string;
  daysOnMarket: number;
  hadPriceReduction: boolean;
};

export type LiquidityAggregate = {
  activeListingsCount: number;
  medianDaysOnMarket: number | null;
  meanDaysOnMarket: number | null;
  priceReductionRate: number | null;
  sampleCountDom: number;
  domOutliersTrimmed: number;
};

export function aggregateLiquidityMetrics(
  activeListings: ListingObservation[],
  config = DEFAULT_METRIC_AGGREGATION_CONFIG,
): LiquidityAggregate {
  const domValues = activeListings.map((l) => l.daysOnMarket);
  const trimmed = trimmedValues(
    domValues,
    config.domOutlierLowerPercentile,
    config.domOutlierUpperPercentile,
  );
  const domStats = aggregateNumeric(trimmed);
  const withReduction = activeListings.filter((l) => l.hadPriceReduction).length;

  return {
    activeListingsCount: activeListings.length,
    medianDaysOnMarket: domStats.median,
    meanDaysOnMarket: domStats.mean,
    priceReductionRate:
      activeListings.length > 0 ? withReduction / activeListings.length : null,
    sampleCountDom: domStats.sampleCount,
    domOutliersTrimmed: domValues.length - trimmed.length,
  };
}

export function computeRentListingsTurnover(input: {
  listedAtStart: number;
  removedDuringPeriod: number;
}): number | null {
  if (input.listedAtStart <= 0) return null;
  return input.removedDuringPeriod / input.listedAtStart;
}
