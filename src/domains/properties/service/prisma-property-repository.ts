/**
 * Prisma-backed PropertyRepository for public catalog + detail.
 */

import { prisma } from "@/lib/db";
import { isDemoPropertyContentAllowed } from "@/lib/demo-content-gate";
import type { PropertySearchQuery } from "@/domains/properties/service/search-provider";
import type { PropertyRepository } from "@/domains/properties/service/property-service";
import type { PropertyRecord } from "@/domains/properties/service/dto";
import { DEMO_PROPERTY_RECORDS } from "@/content/demo-canonical-properties";
import {
  mapPrismaPropertyToRecord,
  propertyDetailInclude,
  publicDiscoveryWhere,
} from "./prisma-mapper";

function demoFindBySlug(slug: string): PropertyRecord | null {
  if (!isDemoPropertyContentAllowed()) return null;
  return DEMO_PROPERTY_RECORDS.find((p) => p.slug === slug) ?? null;
}

function demoFindById(id: string): PropertyRecord | null {
  if (!isDemoPropertyContentAllowed()) return null;
  return DEMO_PROPERTY_RECORDS.find((p) => p.id === id) ?? null;
}

export function createPrismaPropertyRepository(): PropertyRepository {
  return {
    async findBySlug(slug) {
      try {
        const row = await prisma.property.findUnique({
          where: { slug },
          include: propertyDetailInclude,
        });
        if (row) return mapPrismaPropertyToRecord(row);
      } catch {
        // DB unavailable — fall through to demo when allowed
      }
      return demoFindBySlug(slug);
    },

    async findById(id) {
      try {
        const row = await prisma.property.findUnique({
          where: { id },
          include: propertyDetailInclude,
        });
        if (row) return mapPrismaPropertyToRecord(row);
      } catch {
        // ignore
      }
      return demoFindById(id);
    },

    async search(query: PropertySearchQuery) {
      const pageSize = query.pagination.pageSize;
      const page =
        query.pagination.mode === "page" ? Math.max(1, query.pagination.page) : 1;
      const skip = (page - 1) * pageSize;

      const where = {
        ...publicDiscoveryWhere({
          includeDemo: isDemoPropertyContentAllowed(),
        }),
        ...(query.filters.city
          ? {
              OR: [
                {
                  publicCity: {
                    contains: query.filters.city,
                    mode: "insensitive" as const,
                  },
                },
                {
                  publicLabel: {
                    contains: query.filters.city,
                    mode: "insensitive" as const,
                  },
                },
              ],
            }
          : {}),
        ...(query.filters.propertyType?.length
          ? {
              propertyType: {
                in: query.filters.propertyType as never[],
              },
            }
          : {}),
        ...(query.filters.transactionType
          ? { transactionType: query.filters.transactionType as never }
          : {}),
        ...(query.filters.priceMin != null || query.filters.priceMax != null
          ? {
              askingPrice: {
                ...(query.filters.priceMin != null
                  ? { gte: query.filters.priceMin }
                  : {}),
                ...(query.filters.priceMax != null
                  ? { lte: query.filters.priceMax }
                  : {}),
              },
            }
          : {}),
      };

      const orderBy =
        query.sort.field === "askingPrice"
          ? { askingPrice: query.sort.direction === "asc" ? "asc" as const : "desc" as const }
          : query.sort.field === "usableArea"
            ? { usableArea: query.sort.direction === "asc" ? "asc" as const : "desc" as const }
            : { publishedAt: "desc" as const };

      try {
        const [rows, total] = await Promise.all([
          prisma.property.findMany({
            where,
            include: propertyDetailInclude,
            orderBy,
            skip,
            take: pageSize + 1,
          }),
          prisma.property.count({ where }),
        ]);
        const hasMore = rows.length > pageSize;
        const items = rows.slice(0, pageSize).map(mapPrismaPropertyToRecord);
        return { items, total, hasMore };
      } catch {
        return { items: [], total: 0, hasMore: false };
      }
    },
  };
}

/**
 * Load ACTIVE public listings for discovery UI filters (in-memory apply).
 * Merges DB listings with in-memory demo records when allowed (demo not yet in DB).
 */
export async function listDiscoveryPropertyRecords(limit = 200): Promise<PropertyRecord[]> {
  const dbItems: PropertyRecord[] = [];
  try {
    let rows;
    try {
      rows = await prisma.property.findMany({
        where: publicDiscoveryWhere({
          includeDemo: isDemoPropertyContentAllowed(),
        }),
        include: { ...propertyDetailInclude, investmentSnapshot: true },
        orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
        take: limit,
      });
    } catch {
      rows = await prisma.property.findMany({
        where: publicDiscoveryWhere({
          includeDemo: isDemoPropertyContentAllowed(),
        }),
        include: propertyDetailInclude,
        orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
        take: limit,
      });
    }
    for (const row of rows) {
      dbItems.push(mapPrismaPropertyToRecord(row));
    }
  } catch {
    // DB down
  }

  if (!isDemoPropertyContentAllowed()) {
    return dbItems.filter((r) => !r.isDemo);
  }

  const dbSlugs = new Set(dbItems.map((r) => r.slug));
  const demoOnly = DEMO_PROPERTY_RECORDS.filter(
    (r) =>
      r.status === "ACTIVE" &&
      r.visibility === "PUBLIC" &&
      !dbSlugs.has(r.slug),
  );
  return [...dbItems, ...demoOnly];
}
