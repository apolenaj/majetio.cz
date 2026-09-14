/**
 * Aggregates raw market observations into segmented LocationMetric records.
 * Never blends asking/transaction prices or cross-segment averages.
 */

import type { LocationMetricPriceKind } from "@prisma/client";

import { resolveMetricConfidence } from "@/domains/locations/metrics/confidence";
import {
  DEFAULT_METRIC_AGGREGATION_CONFIG,
  getMetricDefinition,
  type LocationMetricKey,
} from "@/domains/locations/metrics/registry";
import {
  encodeSegmentKey,
  inferMarketAge,
  normalizeLayout,
  type LocationMetricSegment,
} from "@/domains/locations/metrics/segment";
import { aggregateNumeric } from "@/domains/locations/metrics/statistics";
import type {
  AggregatedMetricRecord,
  MetricAggregationContext,
  RawPriceObservation,
  RawRentObservation,
  SegmentBucket,
} from "@/domains/locations/metrics/types";
import {
  aggregateLiquidityMetrics,
  computeRentListingsTurnover,
  type ListingObservation,
} from "@/domains/locations/metrics/liquidity";

function bucketBySegment<T>(
  items: T[],
  toSegment: (item: T) => LocationMetricSegment,
): SegmentBucket<T>[] {
  const map = new Map<string, SegmentBucket<T>>();
  for (const item of items) {
    const segment = toSegment(item);
    const segmentKey = encodeSegmentKey(segment);
    const existing = map.get(segmentKey);
    if (existing) {
      existing.observations.push(item);
    } else {
      map.set(segmentKey, { segmentKey, segment, observations: [item] });
    }
  }
  return [...map.values()];
}

function observationSegment(input: {
  propertyType: RawPriceObservation["propertyType"];
  condition: RawPriceObservation["condition"];
  layout?: string | null;
}): LocationMetricSegment {
  return {
    propertyType: input.propertyType,
    marketAge: inferMarketAge(input.condition),
    layout: normalizeLayout(input.layout ?? "ALL"),
  };
}

function buildPriceMetric(input: {
  context: MetricAggregationContext;
  metricKey: LocationMetricKey;
  priceKind: LocationMetricPriceKind;
  segmentKey: string;
  segment: LocationMetricSegment;
  values: number[];
}): AggregatedMetricRecord | null {
  const definition = getMetricDefinition(input.metricKey);
  if (!definition) return null;

  const stats = aggregateNumeric(input.values);
  const decision = resolveMetricConfidence(stats.sampleCount, definition);
  const primary =
    definition.preferredStatistic === "mean" ? stats.mean : stats.median;

  if (primary == null) return null;

  return {
    locationId: input.context.locationId,
    metricKey: input.metricKey,
    category: definition.category,
    value: primary,
    unit: definition.unit,
    period: input.context.period,
    source: input.context.source,
    sourceType: input.context.sourceType,
    priceKind: input.priceKind,
    segmentKey: input.segmentKey,
    segment: input.segment,
    sampleCount: stats.sampleCount,
    meanValue: stats.mean,
    lowerQuartile: stats.lowerQuartile,
    upperQuartile: stats.upperQuartile,
    confidence: decision.confidence,
    methodologyVersion: DEFAULT_METRIC_AGGREGATION_CONFIG.methodologyVersion,
    calculatedAt: input.context.calculatedAt,
    validFrom: input.context.validFrom,
    validTo: input.context.validTo ?? null,
    display: decision.display,
    suppressReason: decision.reason,
  };
}

export class LocationMetricAggregationService {
  aggregateAskingPrices(
    observations: RawPriceObservation[],
    context: MetricAggregationContext,
  ): AggregatedMetricRecord[] {
    return this.aggregatePriceObservations(
      observations,
      context,
      "ASKING",
      "property_market.median_asking_price_sqm",
      "property_market.mean_asking_price_sqm",
    );
  }

  aggregateTransactionPrices(
    observations: RawPriceObservation[],
    context: MetricAggregationContext,
  ): AggregatedMetricRecord[] {
    const metrics = this.aggregatePriceObservations(
      observations,
      context,
      "TRANSACTION",
      "property_market.median_transaction_price_sqm",
      null,
    );

    const buckets = bucketBySegment(observations, (o) =>
      observationSegment(o),
    );
    for (const bucket of buckets) {
      const txCountDef = getMetricDefinition("property_market.transaction_count");
      if (!txCountDef) continue;
      const decision = resolveMetricConfidence(
        bucket.observations.length,
        txCountDef,
      );
      metrics.push({
        locationId: context.locationId,
        metricKey: "property_market.transaction_count",
        category: txCountDef.category,
        value: bucket.observations.length,
        unit: txCountDef.unit,
        period: context.period,
        source: context.source,
        sourceType: context.sourceType,
        priceKind: "TRANSACTION",
        segmentKey: bucket.segmentKey,
        segment: bucket.segment,
        sampleCount: bucket.observations.length,
        meanValue: null,
        lowerQuartile: null,
        upperQuartile: null,
        confidence: decision.confidence,
        methodologyVersion: DEFAULT_METRIC_AGGREGATION_CONFIG.methodologyVersion,
        calculatedAt: context.calculatedAt,
        validFrom: context.validFrom,
        validTo: context.validTo ?? null,
        display: decision.display,
        suppressReason: decision.reason,
      });
    }

    return metrics;
  }

  aggregateAskingRents(
    observations: RawRentObservation[],
    context: MetricAggregationContext,
  ): AggregatedMetricRecord[] {
    const buckets = bucketBySegment(observations, (o) =>
      observationSegment(o),
    );
    const results: AggregatedMetricRecord[] = [];

    for (const bucket of buckets) {
      const values = bucket.observations.map((o) => o.rentPerSqm);
      const median = buildPriceMetric({
        context,
        metricKey: "rental_market.median_asking_rent_sqm",
        priceKind: "ASKING",
        segmentKey: bucket.segmentKey,
        segment: bucket.segment,
        values,
      });
      if (median) results.push(median);
    }

    return results;
  }

  aggregateLiquidity(
    listings: ListingObservation[],
    context: MetricAggregationContext,
    segment: LocationMetricSegment = {
      propertyType: "ALL",
      marketAge: "unknown",
      layout: "ALL",
    },
  ): AggregatedMetricRecord[] {
    const segmentKey = encodeSegmentKey(segment);
    const liquidity = aggregateLiquidityMetrics(listings);
    const results: AggregatedMetricRecord[] = [];

    const pushMetric = (
      metricKey: LocationMetricKey,
      value: number | null,
      sampleCount: number,
    ) => {
      const definition = getMetricDefinition(metricKey);
      if (!definition || value == null) return;
      const decision = resolveMetricConfidence(sampleCount, definition);
      results.push({
        locationId: context.locationId,
        metricKey,
        category: definition.category,
        value,
        unit: definition.unit,
        period: context.period,
        source: context.source,
        sourceType: context.sourceType,
        priceKind: definition.priceKind,
        segmentKey,
        segment,
        sampleCount,
        meanValue:
          metricKey === "property_market.median_days_on_market"
            ? liquidity.meanDaysOnMarket
            : null,
        lowerQuartile: null,
        upperQuartile: null,
        confidence: decision.confidence,
        methodologyVersion: DEFAULT_METRIC_AGGREGATION_CONFIG.methodologyVersion,
        calculatedAt: context.calculatedAt,
        validFrom: context.validFrom,
        validTo: context.validTo ?? null,
        display: decision.display,
        suppressReason: decision.reason,
      });
    };

    pushMetric(
      "property_market.active_listings_count",
      liquidity.activeListingsCount,
      liquidity.activeListingsCount,
    );
    pushMetric(
      "property_market.median_days_on_market",
      liquidity.medianDaysOnMarket,
      liquidity.sampleCountDom,
    );
    if (liquidity.priceReductionRate != null) {
      pushMetric(
        "property_market.price_reduction_rate",
        liquidity.priceReductionRate,
        listings.length,
      );
    }

    return results;
  }

  aggregateRentTurnover(
    input: { listedAtStart: number; removedDuringPeriod: number },
    context: MetricAggregationContext,
    segment: LocationMetricSegment = {
      propertyType: "ALL",
      marketAge: "unknown",
      layout: "ALL",
    },
  ): AggregatedMetricRecord | null {
    const definition = getMetricDefinition("rental_market.rent_listings_turnover");
    if (!definition) return null;

    const turnover = computeRentListingsTurnover(input);
    if (turnover == null) return null;

    const segmentKey = encodeSegmentKey(segment);
    const sampleCount = input.listedAtStart;
    const decision = resolveMetricConfidence(sampleCount, definition);

    return {
      locationId: context.locationId,
      metricKey: "rental_market.rent_listings_turnover",
      category: definition.category,
      value: turnover,
      unit: definition.unit,
      period: context.period,
      source: context.source,
      sourceType: context.sourceType,
      priceKind: definition.priceKind,
      segmentKey,
      segment,
      sampleCount,
      meanValue: null,
      lowerQuartile: null,
      upperQuartile: null,
      confidence: decision.confidence,
      methodologyVersion: DEFAULT_METRIC_AGGREGATION_CONFIG.methodologyVersion,
      calculatedAt: context.calculatedAt,
      validFrom: context.validFrom,
      validTo: context.validTo ?? null,
      display: decision.display,
      suppressReason: decision.reason,
    };
  }

  private aggregatePriceObservations(
    observations: RawPriceObservation[],
    context: MetricAggregationContext,
    priceKind: LocationMetricPriceKind,
    medianKey: LocationMetricKey,
    meanKey: LocationMetricKey | null,
  ): AggregatedMetricRecord[] {
    const buckets = bucketBySegment(observations, (o) =>
      observationSegment(o),
    );
    const results: AggregatedMetricRecord[] = [];

    for (const bucket of buckets) {
      const values = bucket.observations.map((o) => o.pricePerSqm);
      const median = buildPriceMetric({
        context,
        metricKey: medianKey,
        priceKind,
        segmentKey: bucket.segmentKey,
        segment: bucket.segment,
        values,
      });
      if (median) results.push(median);

      if (meanKey) {
        const meanMetric = buildPriceMetric({
          context,
          metricKey: meanKey,
          priceKind,
          segmentKey: bucket.segmentKey,
          segment: bucket.segment,
          values,
        });
        if (meanMetric) results.push(meanMetric);
      }
    }

    return results;
  }
}

export function createLocationMetricAggregationService(): LocationMetricAggregationService {
  return new LocationMetricAggregationService();
}
