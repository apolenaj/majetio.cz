/**
 * Property search foundation (Prompt 7 Part 4).
 * Builds safe filter/sort/pagination query objects — wire to Prisma in server layer later.
 */

import {
  decodeCursor,
  encodeCursor,
  resolvePagination,
  resolvePropertySort,
  type PaginationInput,
  type PropertySort,
  type ResolvedPagination,
} from "./pagination";

export type PropertySearchFilters = {
  status?: string | string[];
  visibility?: string | string[];
  transactionType?: string;
  propertyType?: string | string[];
  city?: string;
  district?: string;
  region?: string;
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  query?: string;
};

export type PropertySearchQuery = {
  filters: PropertySearchFilters;
  sort: PropertySort;
  pagination: ResolvedPagination;
  /** Prisma-oriented where fragment (plain object). */
  where: Record<string, unknown>;
  orderBy: Record<string, "asc" | "desc">;
};

export type PropertySearchProvider = {
  buildQuery(input: {
    filters?: PropertySearchFilters;
    sortField?: string | null;
    sortDirection?: string | null;
    pagination?: PaginationInput;
  }): PropertySearchQuery;

  /**
   * Encode next cursor from the last item of a page (cursor mode).
   */
  nextCursor(input: {
    lastItem: { id: string; sortValue: string | number | null };
    hasMore: boolean;
  }): string | null;
};

function asInFilter(value: string | string[] | undefined): unknown {
  if (value == null) return undefined;
  return Array.isArray(value) ? { in: value } : value;
}

function buildWhere(filters: PropertySearchFilters): Record<string, unknown> {
  const where: Record<string, unknown> = {};

  const status = asInFilter(filters.status ?? "ACTIVE");
  if (status !== undefined) where.status = status;

  const visibility = asInFilter(filters.visibility ?? "PUBLIC");
  if (visibility !== undefined) where.visibility = visibility;

  if (filters.transactionType) where.transactionType = filters.transactionType;

  const propertyType = asInFilter(filters.propertyType);
  if (propertyType !== undefined) where.propertyType = propertyType;

  if (filters.city) where.publicCity = filters.city;
  if (filters.district) where.publicDistrict = filters.district;
  if (filters.region) where.publicRegion = filters.region;

  if (filters.priceMin != null || filters.priceMax != null) {
    where.askingPrice = {
      ...(filters.priceMin != null ? { gte: filters.priceMin } : {}),
      ...(filters.priceMax != null ? { lte: filters.priceMax } : {}),
    };
  }

  if (filters.areaMin != null || filters.areaMax != null) {
    where.usableArea = {
      ...(filters.areaMin != null ? { gte: filters.areaMin } : {}),
      ...(filters.areaMax != null ? { lte: filters.areaMax } : {}),
    };
  }

  if (filters.query?.trim()) {
    const q = filters.query.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { publicCity: { contains: q, mode: "insensitive" } },
      { publicDistrict: { contains: q, mode: "insensitive" } },
      { publicLabel: { contains: q, mode: "insensitive" } },
    ];
  }

  return where;
}

export function createPropertySearchProvider(): PropertySearchProvider {
  return {
    buildQuery(input) {
      const filters = input.filters ?? {};
      const sort = resolvePropertySort(input.sortField, input.sortDirection);
      const pagination = resolvePagination(input.pagination);
      const where = buildWhere(filters);

      if (pagination.mode === "cursor") {
        const decoded = decodeCursor(pagination.cursor);
        if (decoded) {
          const cursorClause =
            sort.direction === "desc"
              ? {
                  OR: [
                    { [sort.field]: { lt: decoded.sortValue } },
                    {
                      AND: [
                        { [sort.field]: decoded.sortValue },
                        { id: { lt: decoded.id } },
                      ],
                    },
                  ],
                }
              : {
                  OR: [
                    { [sort.field]: { gt: decoded.sortValue } },
                    {
                      AND: [
                        { [sort.field]: decoded.sortValue },
                        { id: { gt: decoded.id } },
                      ],
                    },
                  ],
                };
          Object.assign(where, cursorClause);
        }
      }

      return {
        filters,
        sort,
        pagination,
        where,
        orderBy: { [sort.field]: sort.direction },
      };
    },

    nextCursor({ lastItem, hasMore }) {
      if (!hasMore) return null;
      return encodeCursor(lastItem);
    },
  };
}
