/**
 * Location metric quality → DetectedQualityIssue compatible with DataQualityIssue.
 */

import type { DetectedQualityIssue } from "@/domains/properties/service/data-quality";
import type { AggregatedMetricCandidate } from "@/domains/locations/ingestion/types";
import type { MetricAnomaly } from "@/domains/locations/ingestion/anomalies";

export function buildLocationQualityIssues(input: {
  locationId: string;
  candidates: AggregatedMetricCandidate[];
  anomalies: MetricAnomaly[];
}): DetectedQualityIssue[] {
  const issues: DetectedQualityIssue[] = [];

  for (const anomaly of input.anomalies) {
    issues.push({
      ruleCode: anomaly.ruleCode,
      severity: anomaly.severity,
      message: anomaly.message,
      field: anomaly.field,
      meta: {
        ...anomaly.meta,
        locationId: input.locationId,
        reviewRequired: anomaly.reviewRequired,
        scope: "location",
      },
    });
  }

  for (const c of input.candidates) {
    if (c.freshness === "STALE") {
      issues.push({
        ruleCode: "LOCATION_METRIC_STALE",
        severity: "INFO",
        message: `Zastaralá metrika ${c.metricKey} (period ${c.period}).`,
        field: c.metricKey,
        meta: {
          locationId: c.locationId,
          freshness: c.freshness,
          scope: "location",
        },
      });
    }

    if (c.sourceQuality === "LOW") {
      issues.push({
        ruleCode: "LOCATION_SOURCE_QUALITY_LOW",
        severity: "WARNING",
        message: `Nízká kvalita zdroje pro ${c.metricKey}.`,
        field: c.metricKey,
        meta: {
          locationId: c.locationId,
          sourceQuality: c.sourceQuality,
          scope: "location",
        },
      });
    }

    if (!c.display && c.suppressReason) {
      issues.push({
        ruleCode: "LOCATION_METRIC_SUPPRESSED",
        severity: "INFO",
        message: c.suppressReason,
        field: c.metricKey,
        meta: {
          locationId: c.locationId,
          sampleCount: c.sampleCount,
          scope: "location",
        },
      });
    }
  }

  return issues;
}

/**
 * Persist helper shape — caller upserts into existing DataQualityIssue table.
 */
export type LocationDataQualityIssueWrite = {
  locationId: string;
  propertyId?: null;
  ruleCode: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  message: string;
  field?: string;
  meta?: Record<string, unknown>;
};

export function toLocationIssueWrites(
  locationId: string,
  issues: DetectedQualityIssue[],
): LocationDataQualityIssueWrite[] {
  return issues.map((issue) => ({
    locationId,
    propertyId: null,
    ruleCode: issue.ruleCode,
    severity: issue.severity,
    message: issue.message,
    field: issue.field,
    meta: issue.meta,
  }));
}
