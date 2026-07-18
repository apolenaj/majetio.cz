/**
 * PropertyService — public read API foundation (Prompt 7 Part 4).
 * Maps records → DTOs; search via PropertySearchProvider.
 * Persistence adapters are injectable for tests / future Prisma wiring.
 */

import {
  toPublicPropertyDto,
  toPublicPropertyListItemDto,
  type PropertyRecord,
  type PublicPropertyDto,
  type PublicPropertyListItemDto,
  type ToPublicDtoOptions,
} from "./dto";
import {
  createPropertySearchProvider,
  type PropertySearchFilters,
  type PropertySearchProvider,
  type PropertySearchQuery,
} from "./search-provider";
import type { PaginationInput } from "./pagination";

export type PropertyRepository = {
  findBySlug(slug: string): Promise<PropertyRecord | null>;
  findById(id: string): Promise<PropertyRecord | null>;
  search(query: PropertySearchQuery): Promise<{
    items: PropertyRecord[];
    total?: number;
    hasMore: boolean;
  }>;
};

export type PropertyService = {
  getPublicBySlug(
    slug: string,
    opts?: ToPublicDtoOptions,
  ): Promise<PublicPropertyDto | null>;
  getPublicById(
    id: string,
    opts?: ToPublicDtoOptions,
  ): Promise<PublicPropertyDto | null>;
  searchPublic(input: {
    filters?: PropertySearchFilters;
    sortField?: string | null;
    sortDirection?: string | null;
    pagination?: PaginationInput;
    viewerRole?: ToPublicDtoOptions["viewerRole"];
  }): Promise<{
    items: PublicPropertyListItemDto[];
    page?: number;
    pageSize: number;
    total?: number;
    nextCursor: string | null;
    query: PropertySearchQuery;
  }>;
};

export function createPropertyService(deps: {
  repository: PropertyRepository;
  searchProvider?: PropertySearchProvider;
}): PropertyService {
  const searchProvider = deps.searchProvider ?? createPropertySearchProvider();

  return {
    async getPublicBySlug(slug, opts) {
      const record = await deps.repository.findBySlug(slug);
      if (!record) return null;
      if (record.visibility === "PRIVATE" && (opts?.viewerRole ?? "PUBLIC") === "PUBLIC") {
        return null;
      }
      return toPublicPropertyDto(record, opts);
    },

    async getPublicById(id, opts) {
      const record = await deps.repository.findById(id);
      if (!record) return null;
      if (record.visibility === "PRIVATE" && (opts?.viewerRole ?? "PUBLIC") === "PUBLIC") {
        return null;
      }
      return toPublicPropertyDto(record, opts);
    },

    async searchPublic(input) {
      const query = searchProvider.buildQuery({
        filters: {
          visibility: "PUBLIC",
          status: "ACTIVE",
          ...input.filters,
        },
        sortField: input.sortField,
        sortDirection: input.sortDirection,
        pagination: input.pagination,
      });

      const result = await deps.repository.search(query);
      const items = result.items.map((r) =>
        toPublicPropertyListItemDto(r, { viewerRole: input.viewerRole ?? "PUBLIC" }),
      );

      const last = result.items[result.items.length - 1];
      const sortField = query.sort.field;
      const sortValue =
        last == null
          ? null
          : sortField === "askingPrice"
            ? (last.askingPrice ?? null)
            : sortField === "pricePerSqm"
              ? (last.pricePerSqm ?? null)
              : sortField === "usableArea"
                ? (last.usableArea ?? null)
                : sortField === "publishedAt"
                  ? (last.publishedAt ?? null)
                  : sortField === "createdAt"
                    ? null
                    : (last.updatedAt ?? null);
      const nextCursor =
        query.pagination.mode === "cursor" && last
          ? searchProvider.nextCursor({
              lastItem: {
                id: last.id,
                sortValue:
                  sortValue instanceof Date ? sortValue.toISOString() : sortValue,
              },
              hasMore: result.hasMore,
            })
          : null;

      return {
        items,
        page: query.pagination.mode === "page" ? query.pagination.page : undefined,
        pageSize: query.pagination.pageSize,
        total: result.total,
        nextCursor,
        query,
      };
    },
  };
}
