/**
 * Ingestion pipeline orchestrator:
 * source → fetch → validate → normalize → aggregate → quality check → store → publish
 */

import {
  buildCanonicalKey,
  deduplicateObservations,
  resolveSegmentKey,
} from "@/domains/locations/ingestion/dedupe";
import { aggregateBucket, groupIntoBuckets } from "@/domains/locations/ingestion/aggregate";
import { detectMetricAnomalies, type MetricAnomaly } from "@/domains/locations/ingestion/anomalies";
import {
  buildLocationQualityIssues,
  toLocationIssueWrites,
  type LocationDataQualityIssueWrite,
} from "@/domains/locations/ingestion/quality";
import { getDataSourceDefinition } from "@/domains/locations/ingestion/sources";
import {
  LOCATION_INGESTION_METHODOLOGY_VERSION,
  type AggregatedMetricCandidate,
  type IngestionStage,
  type RawObservationRecord,
  type StageResult,
} from "@/domains/locations/ingestion/types";

export type PipelineContext = {
  dataSourceKey: string;
  period: string;
  dataSourceId?: string | null;
  previousByBucketKey?: Map<string, { value: number; sampleCount: number }>;
};

export type PipelineResult = {
  methodologyVersion: string;
  stages: Partial<Record<IngestionStage, { ok: boolean; errors: string[]; warnings: string[] }>>;
  candidates: AggregatedMetricCandidate[];
  qualityIssues: LocationDataQualityIssueWrite[];
  reviewRequired: boolean;
};

function bucketKey(c: {
  locationId: string;
  metricKey: string;
  segmentKey: string;
  priceKind: string;
  period: string;
}): string {
  return [c.locationId, c.metricKey, c.segmentKey, c.priceKind, c.period].join("|");
}

export function validateObservations(
  records: RawObservationRecord[],
): StageResult<RawObservationRecord[]> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const valid: RawObservationRecord[] = [];

  for (const r of records) {
    if (!r.externalId || !r.locationId) {
      errors.push(`Missing identity for observation ${r.externalId ?? "?"}`);
      continue;
    }
    if (!Number.isFinite(r.value) || r.value <= 0) {
      errors.push(`Invalid value for ${r.externalId}`);
      continue;
    }
    if (!r.observedAt) {
      warnings.push(`Missing observedAt for ${r.externalId}`);
    }
    valid.push(r);
  }

  return {
    ok: errors.length === 0 || valid.length > 0,
    stage: "validate",
    data: valid,
    errors,
    warnings,
  };
}

export function normalizeObservations(
  records: RawObservationRecord[],
  defaultMetricKey: string,
): StageResult<
  {
    locationId: string;
    metricKey: string;
    segmentKey: string;
    priceKind: "ASKING" | "TRANSACTION" | "NONE";
    period: string;
    value: number;
    canonicalKey: string;
  }[]
> {
  const deduped = deduplicateObservations(records);
  const normalized = deduped.map((r) => ({
    locationId: r.locationId,
    metricKey: r.metricKey ?? defaultMetricKey,
    segmentKey: resolveSegmentKey(r),
    priceKind: (r.isTransaction ? "TRANSACTION" : "ASKING") as
      | "ASKING"
      | "TRANSACTION",
    period: "", // filled by caller context
    value: r.value,
    canonicalKey: r.canonicalKey ?? buildCanonicalKey(r),
  }));

  return {
    ok: normalized.length > 0,
    stage: "normalize",
    data: normalized,
    errors: normalized.length === 0 ? ["No records after normalize"] : [],
    warnings: [],
  };
}

export function runLocationIngestionPipeline(
  fetched: RawObservationRecord[],
  context: PipelineContext,
  options?: {
    defaultMetricKey?: string;
  },
): PipelineResult {
  const stages: PipelineResult["stages"] = {
    fetch: { ok: true, errors: [], warnings: [] },
  };

  const sourceDef = getDataSourceDefinition(context.dataSourceKey);
  const reliability = sourceDef?.reliability ?? 0.5;
  const defaultMetricKey =
    options?.defaultMetricKey ?? "property_market.median_asking_price_sqm";

  const validated = validateObservations(fetched);
  stages.validate = {
    ok: validated.ok,
    errors: validated.errors,
    warnings: validated.warnings,
  };

  const normalized = normalizeObservations(validated.data, defaultMetricKey);
  const withPeriod = normalized.data.map((n) => ({
    ...n,
    period: context.period,
  }));
  stages.normalize = {
    ok: normalized.ok,
    errors: normalized.errors,
    warnings: normalized.warnings,
  };

  const buckets = groupIntoBuckets(withPeriod);
  const candidates: AggregatedMetricCandidate[] = [];
  const allAnomalies: MetricAnomaly[] = [];

  for (const bucket of buckets) {
    const prev = context.previousByBucketKey?.get(bucketKey(bucket)) ?? null;
    const candidate = aggregateBucket({
      bucket,
      reliability,
      updateFrequency:
        sourceDef?.updateFrequency === "REALTIME"
          ? "DAILY"
          : sourceDef?.updateFrequency,
      previous: prev,
      dataSourceId: context.dataSourceId,
    });
    candidates.push(candidate);

    if (candidate.value != null) {
      const anomalies = detectMetricAnomalies({
        metricKey: candidate.metricKey,
        currentValue: candidate.value,
        previousValue: prev?.value ?? null,
        currentSampleCount: candidate.sampleCount,
        previousSampleCount: prev?.sampleCount ?? null,
      });
      allAnomalies.push(...anomalies);
    }
  }

  stages.aggregate = {
    ok: candidates.length > 0,
    errors: candidates.length === 0 ? ["No aggregates produced"] : [],
    warnings: [],
  };

  const qualityIssuesNested = candidates.map((c) =>
    buildLocationQualityIssues({
      locationId: c.locationId,
      candidates: [c],
      anomalies: allAnomalies.filter((a) => a.field === c.metricKey || a.meta?.metricKey === c.metricKey),
    }),
  );
  // Simpler: one pass per location
  const byLocation = new Map<string, AggregatedMetricCandidate[]>();
  for (const c of candidates) {
    const list = byLocation.get(c.locationId) ?? [];
    list.push(c);
    byLocation.set(c.locationId, list);
  }

  const qualityIssues: LocationDataQualityIssueWrite[] = [];
  for (const [locationId, list] of byLocation) {
    const issues = buildLocationQualityIssues({
      locationId,
      candidates: list,
      anomalies: allAnomalies,
    });
    qualityIssues.push(...toLocationIssueWrites(locationId, issues));
  }

  stages.quality_check = {
    ok: true,
    errors: [],
    warnings: qualityIssues
      .filter((i) => i.severity === "WARNING")
      .map((i) => i.message),
  };

  const reviewRequired =
    candidates.some((c) => c.reviewRequired) ||
    allAnomalies.some((a) => a.reviewRequired);

  stages.store = { ok: true, errors: [], warnings: [] };
  stages.publish = {
    ok: !reviewRequired,
    errors: [],
    warnings: reviewRequired
      ? ["Pipeline marked review_required — publish deferred for flagged metrics"]
      : [],
  };

  void qualityIssuesNested;

  return {
    methodologyVersion: LOCATION_INGESTION_METHODOLOGY_VERSION,
    stages,
    candidates,
    qualityIssues,
    reviewRequired,
  };
}
