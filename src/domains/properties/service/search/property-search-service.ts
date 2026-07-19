/**
 * PropertySearchService — discovery query API (Prompt 8 Part 1).
 *
 * Safety guarantees:
 * - Zod-validated input
 * - Whitelisted sort only (no raw ORDER BY SQL)
 * - Enum-whitelisted filters
 * - Page size clamp
 * - Always scoped to ACTIVE + PUBLIC for anonymous discovery
 * - Prisma parameterized where (no string SQL concatenation)
 */

import { propertySearchInputSchema, type PropertySearchInput } from "../../schemas/search";
import {
  decodeCursor,
  encodeCursor,
  resolvePagination,
  type ResolvedPagination,
} from "../pagination";
import type { PropertyRecord } from "../dto";
import { buildSearchWhere, normalizeSearchFilters } from "./filters";
import { resolveSearchSort, toPrismaOrderBy } from "./sorts";
import { toSearchHitDto, type PropertySearchPageDto } from "./search-dto";

export type PropertySearchRepository = {
  search(input: {
    where: Record<string, unknown>;
    orderBy: Record<string, "asc" | "desc">;
    skip?: number;
    take: number;
    /** Fetch take+1 to detect hasMore without expensive count when possible. */
  }): Promise<{ items: PropertyRecord[]; total?: number }>;
};

export type PropertySearchService = {
  /**
   * Build a safe executable query plan (for debugging / Prisma wiring).
   */
  buildQuery(raw: unknown):
    | {
        ok: true;
        where: Record<string, unknown>;
        orderBy: Record<string, "asc" | "desc">;
        pagination: ResolvedPagination;
        warnings: string[];
        appliedFilters: Record<string, unknown>;
        sort: { field: string; direction: "asc" | "desc" };
      }
    | { ok: false; errors: string[]; warnings: string[] };

  /**
   * Execute search via injectable repository and return public DTOs.
   */
  search(raw: unknown): Promise<
    | { ok: true; page: PropertySearchPageDto }
    | { ok: false; errors: string[]; warnings: string[] }
  >;
};

function sortValueForCursor(
  record: PropertyRecord,
  field: string,
): string | number | null {
  switch (field) {
    case "askingPrice":
      return record.askingPrice ?? null;
    case "pricePerSqm":
      return record.pricePerSqm ?? null;
    case "usableArea":
      return record.usableArea ?? null;
    case "publishedAt":
      return record.publishedAt instanceof Date
        ? record.publishedAt.toISOString()
        : (record.publishedAt ?? null);
    case "createdAt":
      return null;
    case "updatedAt":
      return record.updatedAt instanceof Date
        ? record.updatedAt.toISOString()
        : (record.updatedAt ?? null);
    default:
      return null;
  }
}

function applyCursorToWhere(
  where: Record<string, unknown>,
  pagination: ResolvedPagination,
  sort: { field: string; direction: "asc" | "desc" },
): void {
  if (pagination.mode !== "cursor" || !pagination.cursor) return;
  const decoded = decodeCursor(pagination.cursor);
  if (!decoded) return;

  const cursorClause =
    sort.direction === "desc"
      ? {
          OR: [
            { [sort.field]: { lt: decoded.sortValue } },
            {
              AND: [{ [sort.field]: decoded.sortValue }, { id: { lt: decoded.id } }],
            },
          ],
        }
      : {
          OR: [
            { [sort.field]: { gt: decoded.sortValue } },
            {
              AND: [{ [sort.field]: decoded.sortValue }, { id: { gt: decoded.id } }],
            },
          ],
        };

  if (where.AND) {
    (where.AND as unknown[]).push(cursorClause);
  } else {
    where.AND = [cursorClause];
  }
}

export function createPropertySearchService(deps: {
  repository: PropertySearchRepository;
}): PropertySearchService {
  function buildQuery(raw: unknown) {
    const parsed = propertySearchInputSchema.safeParse(raw ?? {});
    if (!parsed.success) {
      return {
        ok: false as const,
        errors: parsed.error.issues.map(
          (i) => `${i.path.join(".") || "input"}: ${i.message}`,
        ),
        warnings: [] as string[],
      };
    }

    const input: PropertySearchInput = parsed.data;
    const normalized = normalizeSearchFilters(input);
    if (!normalized.ok) {
      return {
        ok: false as const,
        errors: normalized.errors,
        warnings: normalized.warnings,
      };
    }

    const sort = resolveSearchSort({
      sort: input.sort,
      sortField: input.sortField,
      sortDirection: input.sortDirection,
    });
    const pagination = resolvePagination(
      input.paginationMode === "cursor" || input.cursor
        ? { mode: "cursor", cursor: input.cursor, pageSize: input.pageSize }
        : { mode: "page", page: input.page, pageSize: input.pageSize },
    );

    const where = buildSearchWhere(normalized.filters);
    applyCursorToWhere(where, pagination, sort);
    const orderBy = toPrismaOrderBy(sort);

    return {
      ok: true as const,
      where,
      orderBy,
      pagination,
      warnings: normalized.warnings,
      appliedFilters: { ...normalized.filters },
      sort,
    };
  }

  return {
    buildQuery,

    async search(raw) {
      const plan = buildQuery(raw);
      if (!plan.ok) {
        return { ok: false, errors: plan.errors, warnings: plan.warnings };
      }

      const take = plan.pagination.take;
      const result = await deps.repository.search({
        where: plan.where,
        orderBy: plan.orderBy,
        skip: plan.pagination.mode === "page" ? plan.pagination.skip : undefined,
        take: take + 1,
      });

      const hasMore = result.items.length > take;
      const pageItems = hasMore ? result.items.slice(0, take) : result.items;
      const last = pageItems[pageItems.length - 1];

      const nextCursor =
        plan.pagination.mode === "cursor" && hasMore && last
          ? encodeCursor({
              id: last.id,
              sortValue: sortValueForCursor(last, plan.sort.field),
            })
          : null;

      const page: PropertySearchPageDto = {
        items: pageItems.map((r) => toSearchHitDto(r)),
        pagination: {
          mode: plan.pagination.mode,
          page: plan.pagination.mode === "page" ? plan.pagination.page : undefined,
          pageSize: plan.pagination.pageSize,
          total: result.total,
          nextCursor,
          hasMore,
        },
        sort: plan.sort,
        warnings: plan.warnings,
        appliedFilters: plan.appliedFilters,
      };

      return { ok: true, page };
    },
  };
}
