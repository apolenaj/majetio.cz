/**
 * LocationMarketSnapshot builder — historical analysis artifact.
 */

import type { AggregatedMetricCandidate, LocationMarketSnapshotPayload } from "@/domains/locations/ingestion/types";

export function buildLocationMarketSnapshot(input: {
  locationId: string;
  period: string;
  segmentKey: string;
  metrics: AggregatedMetricCandidate[];
  calculatedAt?: Date;
}): LocationMarketSnapshotPayload {
  const selectedMetrics: LocationMarketSnapshotPayload["selectedMetrics"] = {};
  const methodologyVersions: Record<string, string> = {};
  let usedFallback = false;
  const fallbackNotes: string[] = [];

  for (const m of input.metrics) {
    if (!m.display || m.value == null) continue;
    selectedMetrics[m.metricKey] = {
      value: m.value,
      sampleCount: m.sampleCount,
      confidence: m.confidence,
      sourceQuality: m.sourceQuality,
      freshness: m.freshness,
      reviewRequired: m.reviewRequired,
      fallbackFromLocationId: m.fallbackFromLocationId,
    };
    methodologyVersions[m.metricKey] = m.methodologyVersion;
    if (m.fallbackFromLocationId) {
      usedFallback = true;
      fallbackNotes.push(
        `${m.metricKey}: data z širší oblasti (${m.fallbackFromLocationId})`,
      );
    }
  }

  return {
    locationId: input.locationId,
    period: input.period,
    segmentKey: input.segmentKey,
    selectedMetrics,
    methodologyVersions,
    usedFallback,
    fallbackNotes: fallbackNotes.length > 0 ? fallbackNotes.join("; ") : null,
    calculatedAt: input.calculatedAt ?? new Date(),
  };
}
