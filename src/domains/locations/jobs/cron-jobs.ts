/**
 * Background / CRON jobs for Location Intelligence precomputation.
 * API requests MUST read precomputed LocationMetric / snapshots — never aggregate live.
 *
 * Wire to Vercel Cron / GitHub Actions / system cron via scripts/*.
 */

import type { PrismaClient } from "@prisma/client";

import { LOCATION_INGESTION_METHODOLOGY_VERSION } from "@/domains/locations/ingestion/types";
import { createLocationIngestionService } from "@/domains/locations/ingestion/service";
import { detectMetricAnomalies } from "@/domains/locations/ingestion/anomalies";
import { resolveFreshness } from "@/domains/locations/ingestion/freshness";
import { buildLocationJobIdempotencyKey } from "@/domains/locations/jobs/idempotency";
import { emitLocationTelemetry } from "@/domains/locations/observability/telemetry";
import { invalidateLocationCachePrefix } from "@/domains/locations/cache/location-cache";
import { prisma } from "@/lib/db";

export type LocationJobResult = {
  ok: boolean;
  idempotencyKey: string;
  status: "SUCCEEDED" | "SKIPPED_IDEMPOTENT" | "FAILED" | "REVIEW_REQUIRED";
  latencyMs: number;
  recordsProcessed: number;
  message?: string;
};

async function findExistingJob(
  db: PrismaClient,
  idempotencyKey: string,
): Promise<{ id: string; status: string } | null> {
  // Store idempotency in stageLog.idempotencyKey on LocationIngestionJob
  const jobs = await db.locationIngestionJob.findMany({
    where: {
      OR: [
        { status: "PUBLISHED" },
        { status: "REVIEW_REQUIRED" },
        { status: "STORING" },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, status: true, stageLog: true },
  });
  for (const job of jobs) {
    const log = job.stageLog as { idempotencyKey?: string } | null;
    if (log?.idempotencyKey === idempotencyKey) {
      return { id: job.id, status: job.status };
    }
  }
  return null;
}

/**
 * Metric aggregation job — runs ingestion pipeline for a period.
 * Idempotent: same period + methodology → SKIPPED_IDEMPOTENT.
 */
export async function runMetricAggregationJob(input?: {
  period?: string;
  dataSourceKey?: string;
  force?: boolean;
  db?: PrismaClient;
}): Promise<LocationJobResult> {
  const started = Date.now();
  const db = input?.db ?? prisma;
  const period = input?.period ?? new Date().toISOString().slice(0, 7);
  const methodologyVersion = LOCATION_INGESTION_METHODOLOGY_VERSION;
  const idempotencyKey = buildLocationJobIdempotencyKey({
    job: "metric_aggregation",
    period,
    methodologyVersion,
  });

  try {
    const existing = input?.force
      ? null
      : await findExistingJob(db, idempotencyKey);
    if (existing && (existing.status === "PUBLISHED" || existing.status === "REVIEW_REQUIRED")) {
      const result: LocationJobResult = {
        ok: true,
        idempotencyKey,
        status: "SKIPPED_IDEMPOTENT",
        latencyMs: Date.now() - started,
        recordsProcessed: 0,
        message: "Job already completed for this period + methodology",
      };
      emitLocationTelemetry({
        type: "location_job_completed",
        job: "metric_aggregation",
        idempotencyKey,
        status: "SKIPPED_IDEMPOTENT",
        latencyMs: result.latencyMs,
        recordsProcessed: 0,
      });
      return result;
    }

    const ingestion = createLocationIngestionService(db);
    await ingestion.ensureRegisteredSources();

    // Empty observations → job still records run; producers feed observations externally
    const pipeline = await ingestion.runPipeline({
      dataSourceKey: input?.dataSourceKey ?? "majetio_internal_aggregation",
      period,
      observations: [],
      publish: true,
    });

    // Stamp idempotency on job
    await db.locationIngestionJob.update({
      where: { id: pipeline.jobId },
      data: {
        stageLog: {
          ...pipeline.stages,
          idempotencyKey,
        },
      },
    });

    invalidateLocationCachePrefix("loc:");

    const status = pipeline.reviewRequired ? "REVIEW_REQUIRED" : "SUCCEEDED";
    const result: LocationJobResult = {
      ok: true,
      idempotencyKey,
      status,
      latencyMs: Date.now() - started,
      recordsProcessed: pipeline.candidates.length,
    };
    emitLocationTelemetry({
      type: "location_job_completed",
      job: "metric_aggregation",
      idempotencyKey,
      status,
      latencyMs: result.latencyMs,
      recordsProcessed: result.recordsProcessed,
    });
    return result;
  } catch (err) {
    const latencyMs = Date.now() - started;
    emitLocationTelemetry({
      type: "location_job_failed",
      job: "metric_aggregation",
      idempotencyKey,
      code: err instanceof Error ? err.message.slice(0, 120) : "UNKNOWN",
      latencyMs,
    });
    return {
      ok: false,
      idempotencyKey,
      status: "FAILED",
      latencyMs,
      recordsProcessed: 0,
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Data refresh job — mark stale metrics by source update frequency.
 */
export async function runDataRefreshJob(input?: {
  period?: string;
  force?: boolean;
  db?: PrismaClient;
}): Promise<LocationJobResult> {
  const started = Date.now();
  const db = input?.db ?? prisma;
  const period = input?.period ?? new Date().toISOString().slice(0, 7);
  const idempotencyKey = buildLocationJobIdempotencyKey({
    job: "data_refresh",
    period,
    methodologyVersion: LOCATION_INGESTION_METHODOLOGY_VERSION,
  });

  try {
    const existing = input?.force
      ? null
      : await findExistingJob(db, idempotencyKey);
    if (existing?.status === "PUBLISHED") {
      return {
        ok: true,
        idempotencyKey,
        status: "SKIPPED_IDEMPOTENT",
        latencyMs: Date.now() - started,
        recordsProcessed: 0,
      };
    }

    await createLocationIngestionService(db).ensureRegisteredSources();

    const metrics = await db.locationMetric.findMany({
      where: { freshness: { not: "STALE" } },
      select: {
        id: true,
        calculatedAt: true,
        dataSource: { select: { updateFrequency: true } },
      },
      take: 5000,
    });

    let updated = 0;
    const now = new Date();
    for (const m of metrics) {
      const freshness = resolveFreshness({
        calculatedAt: m.calculatedAt,
        now,
        updateFrequency: m.dataSource?.updateFrequency ?? "MONTHLY",
      });
      if (freshness === "STALE") {
        await db.locationMetric.update({
          where: { id: m.id },
          data: { freshness: "STALE" },
        });
        updated += 1;
      }
    }

    const source = await db.locationDataSource.findFirst({
      where: { key: "majetio_internal_aggregation" },
    });
    if (!source) {
      throw new Error("LocationDataSource majetio_internal_aggregation missing — run ensureRegisteredSources");
    }

    await db.locationIngestionJob.create({
      data: {
        dataSourceId: source.id,
        status: "PUBLISHED",
        period,
        startedAt: new Date(started),
        finishedAt: new Date(),
        recordsFetched: metrics.length,
        recordsStored: updated,
        methodologyVersion: LOCATION_INGESTION_METHODOLOGY_VERSION,
        stageLog: { idempotencyKey, job: "data_refresh" },
      },
    });

    invalidateLocationCachePrefix("loc:");

    const result: LocationJobResult = {
      ok: true,
      idempotencyKey,
      status: "SUCCEEDED",
      latencyMs: Date.now() - started,
      recordsProcessed: updated,
    };
    emitLocationTelemetry({
      type: "location_job_completed",
      job: "data_refresh",
      idempotencyKey,
      status: "SUCCEEDED",
      latencyMs: result.latencyMs,
      recordsProcessed: updated,
    });
    return result;
  } catch (err) {
    emitLocationTelemetry({
      type: "location_job_failed",
      job: "data_refresh",
      idempotencyKey,
      code: err instanceof Error ? err.message.slice(0, 120) : "UNKNOWN",
      latencyMs: Date.now() - started,
    });
    return {
      ok: false,
      idempotencyKey,
      status: "FAILED",
      latencyMs: Date.now() - started,
      recordsProcessed: 0,
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Anomaly check job — compare current vs previous period metrics.
 */
export async function runAnomalyCheckJob(input?: {
  period?: string;
  previousPeriod?: string;
  force?: boolean;
  db?: PrismaClient;
}): Promise<LocationJobResult> {
  const started = Date.now();
  const db = input?.db ?? prisma;
  const period = input?.period ?? new Date().toISOString().slice(0, 7);
  const idempotencyKey = buildLocationJobIdempotencyKey({
    job: "anomaly_check",
    period,
    methodologyVersion: LOCATION_INGESTION_METHODOLOGY_VERSION,
  });

  try {
    const existing = input?.force
      ? null
      : await findExistingJob(db, idempotencyKey);
    if (existing?.status === "PUBLISHED" || existing?.status === "REVIEW_REQUIRED") {
      return {
        ok: true,
        idempotencyKey,
        status: "SKIPPED_IDEMPOTENT",
        latencyMs: Date.now() - started,
        recordsProcessed: 0,
      };
    }

    const current = await db.locationMetric.findMany({
      where: { period },
      take: 2000,
    });

    let flagged = 0;
    let reviewRequired = false;

    for (const metric of current) {
      const previous = await db.locationMetric.findFirst({
        where: {
          locationId: metric.locationId,
          metricKey: metric.metricKey,
          segmentKey: metric.segmentKey,
          priceKind: metric.priceKind,
          period: { not: period },
        },
        orderBy: { calculatedAt: "desc" },
      });

      const anomalies = detectMetricAnomalies({
        metricKey: metric.metricKey,
        currentValue: metric.value,
        previousValue: previous?.value ?? null,
        currentSampleCount: metric.sampleCount ?? 0,
        previousSampleCount: previous?.sampleCount ?? null,
      });

      if (anomalies.some((a) => a.reviewRequired)) {
        reviewRequired = true;
        flagged += 1;
        await db.locationMetric.update({
          where: { id: metric.id },
          data: { reviewRequired: true },
        });
        await db.dataQualityIssue.create({
          data: {
            locationId: metric.locationId,
            propertyId: null,
            ruleCode: anomalies[0]!.ruleCode,
            severity: anomalies[0]!.severity,
            message: anomalies[0]!.message,
            field: metric.metricKey,
            meta: { idempotencyKey, scope: "location" },
          },
        });
      }
    }

    await createLocationIngestionService(db).ensureRegisteredSources();
    const source = await db.locationDataSource.findFirst({
      where: { key: "majetio_internal_aggregation" },
    });
    if (!source) {
      throw new Error(
        "LocationDataSource majetio_internal_aggregation missing — run ensureRegisteredSources",
      );
    }
    await db.locationIngestionJob.create({
      data: {
        dataSourceId: source.id,
        status: reviewRequired ? "REVIEW_REQUIRED" : "PUBLISHED",
        period,
        startedAt: new Date(started),
        finishedAt: new Date(),
        recordsFetched: current.length,
        recordsStored: flagged,
        methodologyVersion: LOCATION_INGESTION_METHODOLOGY_VERSION,
        stageLog: { idempotencyKey, job: "anomaly_check" },
      },
    });

    const status = reviewRequired ? "REVIEW_REQUIRED" : "SUCCEEDED";
    emitLocationTelemetry({
      type: "location_job_completed",
      job: "anomaly_check",
      idempotencyKey,
      status,
      latencyMs: Date.now() - started,
      recordsProcessed: flagged,
    });

    return {
      ok: true,
      idempotencyKey,
      status,
      latencyMs: Date.now() - started,
      recordsProcessed: flagged,
    };
  } catch (err) {
    emitLocationTelemetry({
      type: "location_job_failed",
      job: "anomaly_check",
      idempotencyKey,
      code: err instanceof Error ? err.message.slice(0, 120) : "UNKNOWN",
      latencyMs: Date.now() - started,
    });
    return {
      ok: false,
      idempotencyKey,
      status: "FAILED",
      latencyMs: Date.now() - started,
      recordsProcessed: 0,
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
