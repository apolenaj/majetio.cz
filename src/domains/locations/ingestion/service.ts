/**
 * Location Ingestion Service — persist metrics, quality issues, snapshots.
 */

import type { Prisma, PrismaClient } from "@prisma/client";

import { getMetricDefinition } from "@/domains/locations/metrics/registry";
import { LOCATION_DATA_SOURCE_REGISTRY } from "@/domains/locations/ingestion/sources";
import {
  runLocationIngestionPipeline,
  type PipelineContext,
  type PipelineResult,
} from "@/domains/locations/ingestion/pipeline";
import { buildLocationMarketSnapshot } from "@/domains/locations/ingestion/snapshot";
import type { RawObservationRecord } from "@/domains/locations/ingestion/types";
import { LOCATION_INGESTION_METHODOLOGY_VERSION } from "@/domains/locations/ingestion/types";
import { prisma } from "@/lib/db";

export class LocationIngestionService {
  constructor(private readonly db: PrismaClient = prisma) {}

  async ensureRegisteredSources(): Promise<void> {
    for (const def of LOCATION_DATA_SOURCE_REGISTRY) {
      await this.db.locationDataSource.upsert({
        where: { key: def.key },
        create: {
          key: def.key,
          name: def.name,
          category: def.category,
          urlOrReference: def.urlOrReference,
          license: def.license,
          updateFrequency: def.updateFrequency,
          reliability: def.reliability,
          allowedUsage: def.allowedUsage as Prisma.InputJsonValue,
        },
        update: {
          name: def.name,
          category: def.category,
          urlOrReference: def.urlOrReference,
          license: def.license,
          updateFrequency: def.updateFrequency,
          reliability: def.reliability,
          allowedUsage: def.allowedUsage as Prisma.InputJsonValue,
        },
      });
    }
  }

  async runPipeline(input: {
    dataSourceKey: string;
    period: string;
    observations: RawObservationRecord[];
    defaultMetricKey?: string;
    publish?: boolean;
  }): Promise<PipelineResult & { jobId: string }> {
    const source = await this.db.locationDataSource.findUnique({
      where: { key: input.dataSourceKey },
    });
    if (!source) {
      throw new Error(`Unknown LocationDataSource key: ${input.dataSourceKey}`);
    }

    const job = await this.db.locationIngestionJob.create({
      data: {
        dataSourceId: source.id,
        status: "FETCHING",
        period: input.period,
        startedAt: new Date(),
        methodologyVersion: LOCATION_INGESTION_METHODOLOGY_VERSION,
        recordsFetched: input.observations.length,
      },
    });

    try {
      await this.db.locationIngestionJob.update({
        where: { id: job.id },
        data: { status: "VALIDATING" },
      });

      const context: PipelineContext = {
        dataSourceKey: input.dataSourceKey,
        period: input.period,
        dataSourceId: source.id,
      };

      const result = runLocationIngestionPipeline(input.observations, context, {
        defaultMetricKey: input.defaultMetricKey,
      });

      await this.db.locationIngestionJob.update({
        where: { id: job.id },
        data: {
          status: result.reviewRequired ? "REVIEW_REQUIRED" : "STORING",
          stageLog: result.stages as Prisma.InputJsonValue,
        },
      });

      const publish = input.publish !== false && !result.reviewRequired;
      let stored = 0;
      const validFrom = new Date(`${input.period}-01T00:00:00.000Z`);
      if (Number.isNaN(validFrom.getTime())) {
        validFrom.setTime(Date.now());
      }

      for (const c of result.candidates) {
        // Never persist a coerced 0 — missing primary stays out of the store.
        if (c.value == null) continue;
        if (!c.display && !c.reviewRequired) continue;

        const def = getMetricDefinition(c.metricKey);
        const category = def?.category ?? "PROPERTY_MARKET";

        const saved = await this.db.locationMetric.upsert({
          where: {
            locationId_metricKey_period_segmentKey_priceKind_validFrom: {
              locationId: c.locationId,
              metricKey: c.metricKey,
              period: c.period,
              segmentKey: c.segmentKey,
              priceKind: c.priceKind,
              validFrom,
            },
          },
          create: {
            locationId: c.locationId,
            metricKey: c.metricKey,
            category,
            value: c.value,
            period: c.period,
            segmentKey: c.segmentKey,
            priceKind: c.priceKind,
            sampleCount: c.sampleCount,
            meanValue: c.meanValue,
            lowerQuartile: c.lowerQuartile,
            upperQuartile: c.upperQuartile,
            confidence: c.confidence,
            sourceQuality: c.sourceQuality,
            freshness: c.freshness,
            reviewRequired: c.reviewRequired,
            fallbackFromLocationId: c.fallbackFromLocationId,
            dataSourceId: c.dataSourceId,
            methodologyVersion: c.methodologyVersion,
            calculatedAt: new Date(),
            validFrom,
            publishedAt: publish && !c.reviewRequired ? new Date() : null,
            sourceType: "INTERNAL_AGGREGATION",
            source: input.dataSourceKey,
          },
          update: {
            value: c.value,
            category,
            sampleCount: c.sampleCount,
            meanValue: c.meanValue,
            lowerQuartile: c.lowerQuartile,
            upperQuartile: c.upperQuartile,
            confidence: c.confidence,
            sourceQuality: c.sourceQuality,
            freshness: c.freshness,
            reviewRequired: c.reviewRequired,
            methodologyVersion: c.methodologyVersion,
            calculatedAt: new Date(),
            publishedAt: publish && !c.reviewRequired ? new Date() : null,
          },
        });

        await this.db.locationMetricHistory.create({
          data: {
            locationId: c.locationId,
            locationMetricId: saved.id,
            metricKey: c.metricKey,
            category,
            priceKind: c.priceKind,
            segmentKey: c.segmentKey,
            period: c.period,
            value: c.value,
            sampleCount: c.sampleCount,
            meanValue: c.meanValue,
            lowerQuartile: c.lowerQuartile,
            upperQuartile: c.upperQuartile,
            confidence: c.confidence,
            methodologyVersion: c.methodologyVersion,
            calculatedAt: saved.calculatedAt,
            validFrom: saved.validFrom,
          },
        });
        stored += 1;
      }

      // Persist quality issues into existing DataQualityIssue table
      for (const issue of result.qualityIssues) {
        await this.db.dataQualityIssue.create({
          data: {
            locationId: issue.locationId,
            propertyId: null,
            ruleCode: issue.ruleCode,
            severity: issue.severity,
            message: issue.message,
            field: issue.field,
            meta: (issue.meta ?? {}) as Prisma.InputJsonValue,
          },
        });
      }

      // Snapshots per location
      const byLocation = new Map<string, typeof result.candidates>();
      for (const c of result.candidates) {
        const list = byLocation.get(c.locationId) ?? [];
        list.push(c);
        byLocation.set(c.locationId, list);
      }
      for (const [locationId, metrics] of byLocation) {
        const snapshot = buildLocationMarketSnapshot({
          locationId,
          period: input.period,
          segmentKey: metrics[0]?.segmentKey ?? "_all",
          metrics,
        });
        await this.db.locationMarketSnapshot.create({
          data: {
            locationId: snapshot.locationId,
            period: snapshot.period,
            segmentKey: snapshot.segmentKey,
            selectedMetrics: snapshot.selectedMetrics as Prisma.InputJsonValue,
            methodologyVersions:
              snapshot.methodologyVersions as Prisma.InputJsonValue,
            usedFallback: snapshot.usedFallback,
            fallbackNotes: snapshot.fallbackNotes,
            calculatedAt: snapshot.calculatedAt,
            publishedAt: publish ? new Date() : null,
          },
        });
      }

      await this.db.locationIngestionJob.update({
        where: { id: job.id },
        data: {
          status: result.reviewRequired
            ? "REVIEW_REQUIRED"
            : publish
              ? "PUBLISHED"
              : "STORING",
          finishedAt: new Date(),
          recordsStored: stored,
          stageLog: result.stages as Prisma.InputJsonValue,
        },
      });

      await this.db.locationDataSource.update({
        where: { id: source.id },
        data: { lastUpdated: new Date() },
      });

      return { ...result, jobId: job.id };
    } catch (err) {
      await this.db.locationIngestionJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          finishedAt: new Date(),
          errorMessage: err instanceof Error ? err.message : "Unknown error",
        },
      });
      throw err;
    }
  }
}

export function createLocationIngestionService(
  db: PrismaClient = prisma,
): LocationIngestionService {
  return new LocationIngestionService(db);
}
