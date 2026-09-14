import type { LocationMetricDefinition } from "@/domains/locations/metrics/registry";

export type MetricDisplayDecision = {
  display: boolean;
  confidence: number;
  reason: string | null;
};

export function resolveMetricConfidence(
  sampleCount: number,
  definition: LocationMetricDefinition,
): MetricDisplayDecision {
  if (sampleCount < definition.suppressBelowSampleCount) {
    return {
      display: false,
      confidence: 0,
      reason: `Vzorek ${sampleCount} < ${definition.suppressBelowSampleCount} — metrika potlačena.`,
    };
  }

  if (sampleCount < definition.minSampleCount) {
    const ratio = sampleCount / definition.minSampleCount;
    return {
      display: true,
      confidence: Math.max(0.2, Math.min(0.6, ratio * 0.6)),
      reason: `Nízký vzorek (${sampleCount}/${definition.minSampleCount}).`,
    };
  }

  const headroom = Math.min(1, sampleCount / (definition.minSampleCount * 2));
  return {
    display: true,
    confidence: Math.min(0.95, 0.7 + headroom * 0.25),
    reason: null,
  };
}
