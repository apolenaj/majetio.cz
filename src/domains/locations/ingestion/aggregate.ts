/**
 * Aggregation stage — deduped values → outlier filter → median stats + confidence.
 */

import { getMetricDefinition } from "@/domains/locations/metrics/registry";
import { resolveMetricConfidence } from "@/domains/locations/metrics/confidence";
import { aggregateNumeric } from "@/domains/locations/metrics/statistics";
import { filterOutliersPreserveHighEnd } from "@/domains/locations/ingestion/outlier-filter";
import { detectMetricAnomalies } from "@/domains/locations/ingestion/anomalies";
import { resolveFreshness } from "@/domains/locations/ingestion/freshness";
import { sourceQualityFromReliability } from "@/domains/locations/ingestion/sources";
import {
  LOCATION_INGESTION_METHODOLOGY_VERSION,
  type AggregatedMetricCandidate,
  type AggregationInputBucket,
} from "@/domains/locations/ingestion/types";

export function aggregateBucket(input: {
  bucket: AggregationInputBucket;
  reliability: number;
  updateFrequency?: "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "AD_HOC";
  previous?: { value: number; sampleCount: number } | null;
  dataSourceId?: string | null;
  calculatedAt?: Date;
}): AggregatedMetricCandidate {
  const definition = getMetricDefinition(input.bucket.metricKey);
  const filtered = filterOutliersPreserveHighEnd(input.bucket.values);
  const stats = aggregateNumeric(filtered.kept);
  const primary =
    definition?.preferredStatistic === "mean" ? stats.mean : stats.median;

  const confidenceDecision = definition
    ? resolveMetricConfidence(stats.sampleCount, definition)
    : {
        display: stats.sampleCount > 0,
        confidence: stats.sampleCount > 0 ? 0.5 : 0,
        reason: stats.sampleCount === 0 ? "Prázdný vzorek." : null,
      };

  const anomalies =
    primary == null
      ? []
      : detectMetricAnomalies({
          metricKey: input.bucket.metricKey,
          currentValue: primary,
          previousValue: input.previous?.value ?? null,
          currentSampleCount: stats.sampleCount,
          previousSampleCount: input.previous?.sampleCount ?? null,
        });

  const reviewRequired = anomalies.some((a) => a.reviewRequired);
  const calculatedAt = input.calculatedAt ?? new Date();
  const freshness = resolveFreshness({
    calculatedAt,
    updateFrequency: input.updateFrequency ?? "MONTHLY",
  });
  const sourceQuality = sourceQualityFromReliability(input.reliability);

  // Blend source reliability into confidence
  const confidence = Math.min(
    0.95,
    confidenceDecision.confidence * (0.6 + 0.4 * input.reliability),
  );

  // Never coerce missing primary to 0 — empty aggregates are non-displayable.
  if (primary == null) {
    return {
      locationId: input.bucket.locationId,
      metricKey: input.bucket.metricKey,
      segmentKey: input.bucket.segmentKey,
      priceKind: input.bucket.priceKind,
      period: input.bucket.period,
      value: null,
      meanValue: stats.mean,
      lowerQuartile: stats.lowerQuartile,
      upperQuartile: stats.upperQuartile,
      sampleCount: stats.sampleCount,
      outliersRemoved: filtered.removed.length,
      highEndPreserved: filtered.highEndPreserved.length,
      methodologyVersion: LOCATION_INGESTION_METHODOLOGY_VERSION,
      confidence: 0,
      sourceQuality,
      freshness,
      reviewRequired: true,
      anomalyCodes: anomalies.map((a) => a.ruleCode),
      fallbackFromLocationId: null,
      dataSourceId: input.dataSourceId ?? null,
      display: false,
      suppressReason: "Chybí primární statistika — hodnota není 0.",
    };
  }

  return {
    locationId: input.bucket.locationId,
    metricKey: input.bucket.metricKey,
    segmentKey: input.bucket.segmentKey,
    priceKind: input.bucket.priceKind,
    period: input.bucket.period,
    value: primary,
    meanValue: stats.mean,
    lowerQuartile: stats.lowerQuartile,
    upperQuartile: stats.upperQuartile,
    sampleCount: stats.sampleCount,
    outliersRemoved: filtered.removed.length,
    highEndPreserved: filtered.highEndPreserved.length,
    methodologyVersion: LOCATION_INGESTION_METHODOLOGY_VERSION,
    confidence,
    sourceQuality,
    freshness,
    reviewRequired,
    anomalyCodes: anomalies.map((a) => a.ruleCode),
    fallbackFromLocationId: null,
    dataSourceId: input.dataSourceId ?? null,
    display: confidenceDecision.display,
    suppressReason: confidenceDecision.reason,
  };
}

export function groupIntoBuckets(
  observations: {
    locationId: string;
    metricKey: string;
    segmentKey: string;
    priceKind: "ASKING" | "TRANSACTION" | "NONE";
    period: string;
    value: number;
    canonicalKey: string;
  }[],
): AggregationInputBucket[] {
  const map = new Map<string, AggregationInputBucket>();

  for (const obs of observations) {
    const key = [
      obs.locationId,
      obs.metricKey,
      obs.segmentKey,
      obs.priceKind,
      obs.period,
    ].join("|");
    const existing = map.get(key);
    if (existing) {
      existing.values.push(obs.value);
      existing.sampleCanonicalKeys.push(obs.canonicalKey);
    } else {
      map.set(key, {
        locationId: obs.locationId,
        metricKey: obs.metricKey,
        segmentKey: obs.segmentKey,
        priceKind: obs.priceKind,
        period: obs.period,
        values: [obs.value],
        sampleCanonicalKeys: [obs.canonicalKey],
      });
    }
  }

  return [...map.values()];
}
