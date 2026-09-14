/**
 * LocationComparisonService — public side-by-side comparison from precomputed metrics.
 */

import type { PrismaClient } from "@prisma/client";

import type { LocationComparisonDto } from "@/domains/locations/dto";
import {
  buildComparisonCacheKey,
  DEFAULT_PUBLIC_CACHE_TTL_MS,
  getCached,
  setCached,
} from "@/domains/locations/cache/location-cache";
import { LOCATION_INGESTION_METHODOLOGY_VERSION } from "@/domains/locations/ingestion/types";
import { loadLocationComparison } from "@/domains/locations/service/location-page-service";
import { createLocationService } from "@/domains/locations/service/location-service";
import { segmentLabelFromKey } from "@/domains/locations/service/dto-mappers";
import { emitLocationTelemetry } from "@/domains/locations/observability/telemetry";
import { prisma } from "@/lib/db";

export class LocationComparisonService {
  constructor(private readonly db: PrismaClient = prisma) {}

  async comparePublic(input: {
    slugs: string[];
    segmentKey?: string;
    period?: string;
    methodologyVersion?: string;
  }): Promise<LocationComparisonDto | null> {
    const started = Date.now();
    const methodologyVersion =
      input.methodologyVersion ?? LOCATION_INGESTION_METHODOLOGY_VERSION;
    const period = input.period ?? "trailing_12m";
    const segmentKey = input.segmentKey ?? "_all";
    const cacheKey = buildComparisonCacheKey({
      slugs: input.slugs,
      segmentKey,
      period,
      methodologyVersion,
    });

    const cached = getCached<LocationComparisonDto>(cacheKey);
    if (cached) return cached;

    try {
      const locations = await createLocationService(this.db).listPublicBySlugs(
        input.slugs,
      );
      if (locations.length < 2) return null;

      // Prefer demo/page comparison builder (uses precomputed profiles)
      const comparison = await loadLocationComparison({
        slugs: locations.map((l) => l.slug),
        segmentKey: segmentKey === "_all" ? undefined : segmentKey,
      });
      if (!comparison) return null;

      const dto: LocationComparisonDto = {
        kind: "public",
        period: comparison.periodLabel,
        segmentKey: comparison.segment.key,
        segmentLabel:
          comparison.segment.label ?? segmentLabelFromKey(comparison.segment.key),
        methodologyHref: comparison.methodologyHref,
        locations,
        rows: comparison.rows,
      };
      setCached(cacheKey, dto, DEFAULT_PUBLIC_CACHE_TTL_MS);
      return dto;
    } catch (err) {
      emitLocationTelemetry({
        type: "location_query_error",
        service: "LocationComparisonService",
        code: err instanceof Error ? err.name : "UNKNOWN",
        latencyMs: Date.now() - started,
      });
      throw err;
    }
  }
}

export function createLocationComparisonService(
  db: PrismaClient = prisma,
): LocationComparisonService {
  return new LocationComparisonService(db);
}
