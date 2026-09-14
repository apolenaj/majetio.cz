/**
 * Persistence + read API for LocationMetric and LocationMetricHistory.
 */

import type {
  LocationMetric,
  LocationMetricHistory,
  Prisma,
  PrismaClient,
} from "@prisma/client";

import type {
  InternalLocationMetricDto,
  PublicMetricPointDto,
} from "@/domains/locations/dto";
import {
  toInternalLocationMetricDto,
  toPublicMetricPointDto,
} from "@/domains/locations/service/dto-mappers";
import {
  computeTrailingTrends,
  type MetricTimePoint,
  type TrailingTrendBundle,
} from "@/domains/locations/metrics/trends";
import type {
  AggregatedMetricRecord,
  MetricHistoryPoint,
} from "@/domains/locations/metrics/types";
import { prisma } from "@/lib/db";

export type LocationMetricRepository = {
  upsertMetric(record: AggregatedMetricRecord): Promise<LocationMetric>;
  appendHistory(point: MetricHistoryPoint): Promise<LocationMetricHistory>;
  findCurrentMetrics(input: {
    locationId: string;
    metricKey?: string;
    segmentKey?: string;
    displayOnly?: boolean;
  }): Promise<LocationMetric[]>;
  findHistorySeries(input: {
    locationId: string;
    metricKey: string;
    segmentKey: string;
    limit?: number;
  }): Promise<LocationMetricHistory[]>;
};

function toMetricCreateData(
  record: AggregatedMetricRecord,
): Prisma.LocationMetricCreateInput {
  return {
    location: { connect: { id: record.locationId } },
    metricKey: record.metricKey,
    category: record.category,
    value: record.value,
    unit: record.unit,
    period: record.period,
    source: record.source,
    sourceType: record.sourceType,
    priceKind: record.priceKind,
    segmentKey: record.segmentKey,
    segment: record.segment as Prisma.InputJsonValue,
    sampleCount: record.sampleCount,
    meanValue: record.meanValue,
    lowerQuartile: record.lowerQuartile,
    upperQuartile: record.upperQuartile,
    confidence: record.confidence,
    methodologyVersion: record.methodologyVersion,
    calculatedAt: record.calculatedAt,
    validFrom: record.validFrom,
    validTo: record.validTo,
  };
}

function toHistoryCreateData(
  point: MetricHistoryPoint,
): Prisma.LocationMetricHistoryCreateInput {
  return {
    location: { connect: { id: point.locationId } },
    locationMetric: point.locationMetricId
      ? { connect: { id: point.locationMetricId } }
      : undefined,
    metricKey: point.metricKey,
    category: point.category,
    priceKind: point.priceKind,
    segmentKey: point.segmentKey,
    period: point.period,
    value: point.value,
    unit: point.unit,
    sampleCount: point.sampleCount,
    meanValue: point.meanValue,
    lowerQuartile: point.lowerQuartile,
    upperQuartile: point.upperQuartile,
    confidence: point.confidence,
    methodologyVersion: point.methodologyVersion,
    calculatedAt: point.calculatedAt,
    validFrom: point.validFrom,
    validTo: point.validTo,
  };
}

export function createPrismaLocationMetricRepository(
  db: PrismaClient,
): LocationMetricRepository {
  return {
    async upsertMetric(record) {
      return db.locationMetric.upsert({
        where: {
          locationId_metricKey_period_segmentKey_priceKind_validFrom: {
            locationId: record.locationId,
            metricKey: record.metricKey,
            period: record.period,
            segmentKey: record.segmentKey,
            priceKind: record.priceKind,
            validFrom: record.validFrom,
          },
        },
        create: toMetricCreateData(record),
        update: {
          value: record.value,
          unit: record.unit,
          source: record.source,
          sourceType: record.sourceType,
          segment: record.segment as Prisma.InputJsonValue,
          sampleCount: record.sampleCount,
          meanValue: record.meanValue,
          lowerQuartile: record.lowerQuartile,
          upperQuartile: record.upperQuartile,
          confidence: record.confidence,
          methodologyVersion: record.methodologyVersion,
          calculatedAt: record.calculatedAt,
          validTo: record.validTo,
        },
      });
    },

    async appendHistory(point) {
      return db.locationMetricHistory.create({
        data: toHistoryCreateData(point),
      });
    },

    async findCurrentMetrics({ locationId, metricKey, segmentKey, displayOnly }) {
      const rows = await db.locationMetric.findMany({
        where: {
          locationId,
          metricKey,
          segmentKey,
        },
        orderBy: [{ calculatedAt: "desc" }],
      });

      if (!displayOnly) return rows;

      return rows.filter((row) => (row.confidence ?? 0) >= 0.2 && (row.sampleCount ?? 0) > 0);
    },

    async findHistorySeries({ locationId, metricKey, segmentKey, limit = 24 }) {
      return db.locationMetricHistory.findMany({
        where: { locationId, metricKey, segmentKey },
        orderBy: { calculatedAt: "asc" },
        take: limit,
      });
    },
  };
}

export class LocationMetricService {
  constructor(
    private readonly repository: LocationMetricRepository,
    private readonly db: PrismaClient = prisma,
  ) {}

  async persistAggregated(record: AggregatedMetricRecord): Promise<LocationMetric> {
    const saved = await this.repository.upsertMetric(record);

    await this.repository.appendHistory({
      locationId: record.locationId,
      locationMetricId: saved.id,
      metricKey: record.metricKey,
      category: record.category,
      priceKind: record.priceKind,
      segmentKey: record.segmentKey,
      period: record.period,
      value: record.value,
      unit: record.unit,
      sampleCount: record.sampleCount,
      meanValue: record.meanValue,
      lowerQuartile: record.lowerQuartile,
      upperQuartile: record.upperQuartile,
      confidence: record.confidence,
      methodologyVersion: record.methodologyVersion,
      calculatedAt: record.calculatedAt,
      validFrom: record.validFrom,
      validTo: record.validTo,
    });

    return saved;
  }

  async persistBatch(records: AggregatedMetricRecord[]): Promise<LocationMetric[]> {
    const saved: LocationMetric[] = [];
    for (const record of records) {
      saved.push(await this.persistAggregated(record));
    }
    return saved;
  }

  getDisplayableMetrics(input: {
    locationId: string;
    metricKey?: string;
    segmentKey?: string;
  }) {
    return this.repository.findCurrentMetrics({ ...input, displayOnly: true });
  }

  /**
   * Public API — safely aggregated, published, non-stale metrics only.
   * No source payloads, no unpublished drafts.
   */
  async getPublicMetrics(input: {
    locationId: string;
    period?: string;
    segmentKey?: string;
    metricKeys?: string[];
  }): Promise<PublicMetricPointDto[]> {
    const rows = await this.db.locationMetric.findMany({
      where: {
        locationId: input.locationId,
        period: input.period,
        segmentKey: input.segmentKey,
        metricKey: input.metricKeys ? { in: input.metricKeys } : undefined,
        publishedAt: { not: null },
        reviewRequired: false,
        confidence: { gte: 0.2 },
        sampleCount: { gt: 0 },
      },
      orderBy: { calculatedAt: "desc" },
    });

    const byKey = new Map<string, LocationMetric>();
    for (const row of rows) {
      if (!byKey.has(row.metricKey)) byKey.set(row.metricKey, row);
    }
    return [...byKey.values()].map((m) => toPublicMetricPointDto(m));
  }

  /**
   * Internal API — full metric rows including source quality, review flags, unpublished.
   * Never expose via public routes.
   */
  async getInternalMetrics(input: {
    locationId: string;
    period?: string;
    segmentKey?: string;
    includeUnpublished?: boolean;
  }): Promise<InternalLocationMetricDto[]> {
    const rows = await this.db.locationMetric.findMany({
      where: {
        locationId: input.locationId,
        period: input.period,
        segmentKey: input.segmentKey,
        ...(input.includeUnpublished ? {} : { publishedAt: { not: null } }),
      },
      orderBy: { calculatedAt: "desc" },
    });
    return rows.map((m) => toInternalLocationMetricDto(m));
  }

  getHistorySeries(input: {
    locationId: string;
    metricKey: string;
    segmentKey: string;
    limit?: number;
  }) {
    return this.repository.findHistorySeries(input);
  }

  async getTrends(input: {
    locationId: string;
    metricKey: string;
    segmentKey: string;
    limit?: number;
  }): Promise<TrailingTrendBundle> {
    const series = await this.repository.findHistorySeries(input);
    const points: MetricTimePoint[] = series.map((row) => ({
      period: row.period,
      calculatedAt: row.calculatedAt,
      value: row.value,
      sampleCount: row.sampleCount ?? 0,
      segmentKey: row.segmentKey,
    }));

    return computeTrailingTrends(input.metricKey, input.segmentKey, points);
  }
}

export function createLocationMetricService(
  db: PrismaClient = prisma,
): LocationMetricService {
  return new LocationMetricService(
    createPrismaLocationMetricRepository(db),
    db,
  );
}
