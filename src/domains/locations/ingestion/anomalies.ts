/**
 * Anomaly detection for location metrics → review_required + DataQualityIssue rules.
 */

export type MetricAnomaly = {
  ruleCode: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  message: string;
  field?: string;
  meta?: Record<string, unknown>;
  reviewRequired: boolean;
};

export const ANOMALY_RULES = {
  PRICE_SPIKE_PCT: 80,
  SAMPLE_COLLAPSE_RATIO: 0.35,
  SAMPLE_COLLAPSE_MIN_PREV: 20,
} as const;

export function detectMetricAnomalies(input: {
  metricKey: string;
  currentValue: number;
  previousValue: number | null;
  currentSampleCount: number;
  previousSampleCount: number | null;
}): MetricAnomaly[] {
  const anomalies: MetricAnomaly[] = [];

  if (input.previousValue != null && input.previousValue !== 0) {
    const changePct =
      ((input.currentValue - input.previousValue) / Math.abs(input.previousValue)) *
      100;
    if (Math.abs(changePct) >= ANOMALY_RULES.PRICE_SPIKE_PCT) {
      anomalies.push({
        ruleCode: "LOCATION_METRIC_PRICE_SPIKE",
        severity: "WARNING",
        message: `Anomální změna metriky ${input.metricKey}: ${changePct.toFixed(1)} %.`,
        field: input.metricKey,
        meta: {
          changePct,
          previousValue: input.previousValue,
          currentValue: input.currentValue,
        },
        reviewRequired: true,
      });
    }
  }

  if (
    input.previousSampleCount != null &&
    input.previousSampleCount >= ANOMALY_RULES.SAMPLE_COLLAPSE_MIN_PREV
  ) {
    const ratio = input.currentSampleCount / input.previousSampleCount;
    if (ratio <= ANOMALY_RULES.SAMPLE_COLLAPSE_RATIO) {
      anomalies.push({
        ruleCode: "LOCATION_METRIC_SAMPLE_COLLAPSE",
        severity: "WARNING",
        message: `Pád vzorku pro ${input.metricKey}: ${input.previousSampleCount} → ${input.currentSampleCount}.`,
        field: "sampleCount",
        meta: {
          previousSampleCount: input.previousSampleCount,
          currentSampleCount: input.currentSampleCount,
          ratio,
        },
        reviewRequired: true,
      });
    }
  }

  return anomalies;
}
