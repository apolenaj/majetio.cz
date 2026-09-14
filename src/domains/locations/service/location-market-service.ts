/**
 * LocationMarketService — precomputed market summaries (public).
 * Reads LocationMetric / LocationMarketSnapshot — never aggregates live over properties.
 */

import type { PrismaClient } from "@prisma/client";

import type { LocationMarketSummaryDto } from "@/domains/locations/dto";
import {
  buildMarketSummaryCacheKey,
  DEFAULT_PUBLIC_CACHE_TTL_MS,
  getCached,
  setCached,
} from "@/domains/locations/cache/location-cache";
import { LOCATION_INGESTION_METHODOLOGY_VERSION } from "@/domains/locations/ingestion/types";
import {
  toPublicLocationDto,
  toPublicMetricPointDto,
} from "@/domains/locations/service/dto-mappers";
import { emitLocationTelemetry } from "@/domains/locations/observability/telemetry";
import { prisma } from "@/lib/db";

export class LocationMarketService {
  constructor(private readonly db: PrismaClient = prisma) {}

  /**
   * Public market summary from precomputed metrics / snapshots.
   * Cache key: location + segment + period + methodology.
   */
  async getPublicMarketSummary(input: {
    locationSlug: string;
    period: string;
    segmentKey?: string;
    methodologyVersion?: string;
  }): Promise<LocationMarketSummaryDto | null> {
    const started = Date.now();
    const methodologyVersion =
      input.methodologyVersion ?? LOCATION_INGESTION_METHODOLOGY_VERSION;
    const segmentKey = input.segmentKey ?? "_all";
    const cacheKey = buildMarketSummaryCacheKey({
      locationIdOrSlug: input.locationSlug,
      segmentKey,
      period: input.period,
      methodologyVersion,
    });

    const cached = getCached<LocationMarketSummaryDto>(cacheKey);
    if (cached) return cached;

    try {
      const location = await this.db.location.findUnique({
        where: { slug: input.locationSlug },
      });
      if (!location) return null;

      // Prefer published snapshot (precomputed)
      const snapshot = await this.db.locationMarketSnapshot.findFirst({
        where: {
          locationId: location.id,
          period: input.period,
          segmentKey,
          publishedAt: { not: null },
        },
        orderBy: { calculatedAt: "desc" },
      });

      if (snapshot) {
        const selected = snapshot.selectedMetrics as Record<
          string,
          {
            value: number;
            sampleCount: number | null;
            confidence: number | null;
            freshness?: string;
            reviewRequired?: boolean;
            fallbackFromLocationId?: string | null;
          }
        >;
        const versions = snapshot.methodologyVersions as Record<string, string>;
        const metrics = Object.entries(selected).map(([metricKey, m]) => ({
          metricKey,
          label: metricKey,
          value: m.value,
          unit: null as string | null,
          period: input.period,
          sampleCount: m.sampleCount,
          confidence: m.confidence,
          freshness: (m.freshness as "FRESH" | "STALE" | "UNKNOWN") ?? "UNKNOWN",
          priceKind: "NONE" as const,
          segmentKey,
          methodologyVersion: versions[metricKey] ?? methodologyVersion,
          fallbackMessage: m.fallbackFromLocationId
            ? "Data vycházejí z širší oblasti."
            : null,
        }));

        const dto: LocationMarketSummaryDto = {
          kind: "public",
          location: toPublicLocationDto(location),
          period: input.period,
          segmentKey,
          methodologyVersion,
          metrics,
          usedFallback: snapshot.usedFallback,
          fallbackNotes: snapshot.fallbackNotes,
          calculatedAt: snapshot.calculatedAt.toISOString(),
          cacheKey,
        };
        setCached(cacheKey, dto, DEFAULT_PUBLIC_CACHE_TTL_MS);
        return dto;
      }

      // Fallback: published LocationMetric rows (still precomputed, not live)
      const rows = await this.db.locationMetric.findMany({
        where: {
          locationId: location.id,
          period: input.period,
          segmentKey,
          publishedAt: { not: null },
          reviewRequired: false,
          freshness: { not: "STALE" },
        },
        orderBy: { calculatedAt: "desc" },
      });

      // Dedupe by metricKey (latest)
      const byKey = new Map<string, (typeof rows)[0]>();
      for (const row of rows) {
        if (!byKey.has(row.metricKey)) byKey.set(row.metricKey, row);
      }

      const metrics = [...byKey.values()].map((m) => toPublicMetricPointDto(m));
      const dto: LocationMarketSummaryDto = {
        kind: "public",
        location: toPublicLocationDto(location),
        period: input.period,
        segmentKey,
        methodologyVersion,
        metrics,
        usedFallback: metrics.some((m) => m.fallbackMessage != null),
        fallbackNotes: null,
        calculatedAt: new Date().toISOString(),
        cacheKey,
      };
      setCached(cacheKey, dto, DEFAULT_PUBLIC_CACHE_TTL_MS);
      return dto;
    } catch (err) {
      emitLocationTelemetry({
        type: "location_query_error",
        service: "LocationMarketService",
        code: err instanceof Error ? err.name : "UNKNOWN",
        latencyMs: Date.now() - started,
      });
      throw err;
    }
  }
}

export function createLocationMarketService(
  db: PrismaClient = prisma,
): LocationMarketService {
  return new LocationMarketService(db);
}
