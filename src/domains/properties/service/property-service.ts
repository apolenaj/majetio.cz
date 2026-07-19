/**
 * PropertyService — public read API (Prompt 7 Parts 4–5).
 */

import {
  toPublicPropertyDto,
  toPublicPropertyListItemDto,
  type PropertyRecord,
  type PublicPropertyDto,
  type PublicPropertyListItemDto,
  type ToPublicDtoOptions,
} from "./dto";
import { canViewProperty, resolveViewerRole, type PropertyViewer } from "./authorization";
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
    opts?: ToPublicDtoOptions & { viewer?: PropertyViewer },
  ): Promise<PublicPropertyDto | null>;
  getPublicById(
    id: string,
    opts?: ToPublicDtoOptions & { viewer?: PropertyViewer },
  ): Promise<PublicPropertyDto | null>;
  searchPublic(input: {
    filters?: PropertySearchFilters;
    sortField?: string | null;
    sortDirection?: string | null;
    pagination?: PaginationInput;
    viewer?: PropertyViewer;
  }): Promise<{
    items: PublicPropertyListItemDto[];
    page?: number;
    pageSize: number;
    total?: number;
    nextCursor: string | null;
    query: PropertySearchQuery;
  }>;
};

function viewerOpts(
  record: PropertyRecord,
  opts?: ToPublicDtoOptions & { viewer?: PropertyViewer },
): ToPublicDtoOptions {
  const viewer = opts?.viewer ?? {
    userId: opts?.viewerUserId,
    role: opts?.viewerRole,
  };
  return {
    viewerRole: opts?.viewerRole ?? resolveViewerRole(record, viewer),
    viewerUserId: viewer.userId,
  };
}

export function createPropertyService(deps: {
  repository: PropertyRepository;
  searchProvider?: PropertySearchProvider;
}): PropertyService {
  const searchProvider = deps.searchProvider ?? createPropertySearchProvider();

  return {
    async getPublicBySlug(slug, opts) {
      const record = await deps.repository.findBySlug(slug);
      if (!record) return null;
      const viewer = opts?.viewer ?? {
        userId: opts?.viewerUserId,
        role: opts?.viewerRole,
      };
      if (!canViewProperty(record, viewer)) return null;
      return toPublicPropertyDto(record, viewerOpts(record, opts));
    },

    async getPublicById(id, opts) {
      const record = await deps.repository.findById(id);
      if (!record) return null;
      const viewer = opts?.viewer ?? {
        userId: opts?.viewerUserId,
        role: opts?.viewerRole,
      };
      if (!canViewProperty(record, viewer)) return null;
      return toPublicPropertyDto(record, viewerOpts(record, opts));
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
      const viewer = input.viewer ?? {};
      const items = result.items
        .filter((r) => canViewProperty(r, viewer))
        .map((r) =>
          toPublicPropertyListItemDto(r, {
            viewerRole: resolveViewerRole(r, viewer),
          }),
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
