/**
 * LocationService — public location lookups (no private addresses).
 */

import type { PrismaClient } from "@prisma/client";
import { cache } from "react";

import type { PublicLocationDto } from "@/domains/locations/dto";
import { toPublicLocationDto } from "@/domains/locations/service/dto-mappers";
import { emitLocationTelemetry } from "@/domains/locations/observability/telemetry";
import { prisma } from "@/lib/db";

const SELECT = {
  id: true,
  slug: true,
  name: true,
  publicLabel: true,
  type: true,
  countryCode: true,
  centroidLat: true,
  centroidLon: true,
  latitude: true,
  longitude: true,
} as const;

export class LocationService {
  constructor(private readonly db: PrismaClient = prisma) {}

  async getPublicBySlug(slug: string): Promise<PublicLocationDto | null> {
    const started = Date.now();
    try {
      const row = await this.db.location.findUnique({
        where: { slug },
        select: SELECT,
      });
      return row ? toPublicLocationDto(row) : null;
    } catch (err) {
      emitLocationTelemetry({
        type: "location_query_error",
        service: "LocationService",
        code: err instanceof Error ? err.name : "UNKNOWN",
        latencyMs: Date.now() - started,
      });
      throw err;
    }
  }

  async getPublicById(id: string): Promise<PublicLocationDto | null> {
    const row = await this.db.location.findUnique({
      where: { id },
      select: SELECT,
    });
    return row ? toPublicLocationDto(row) : null;
  }

  async listPublicBySlugs(slugs: string[]): Promise<PublicLocationDto[]> {
    const unique = [...new Set(slugs.map((s) => s.trim().toLowerCase()))];
    if (unique.length === 0) return [];
    const rows = await this.db.location.findMany({
      where: { slug: { in: unique } },
      select: SELECT,
    });
    const bySlug = new Map(rows.map((r) => [r.slug, toPublicLocationDto(r)]));
    return unique.map((s) => bySlug.get(s)).filter((x): x is PublicLocationDto => x != null);
  }
}

export function createLocationService(db: PrismaClient = prisma): LocationService {
  return new LocationService(db);
}

/** Per-request dedupe for RSC. */
export const getPublicLocationBySlugCached = cache(async (slug: string) => {
  return createLocationService().getPublicBySlug(slug);
});
