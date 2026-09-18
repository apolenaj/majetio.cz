/**
 * Safe pagination + sort helpers (Prompt 7 Part 4).
 */

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

export type PaginationMode = "page" | "cursor";

export type PagePaginationInput = {
  mode?: "page";
  page?: number;
  pageSize?: number;
};

export type CursorPaginationInput = {
  mode: "cursor";
  cursor?: string | null;
  pageSize?: number;
};

export type PaginationInput = PagePaginationInput | CursorPaginationInput;

export type PagePagination = {
  mode: "page";
  page: number;
  pageSize: number;
  skip: number;
  take: number;
};

export type CursorPagination = {
  mode: "cursor";
  cursor: string | null;
  pageSize: number;
  take: number;
};

export type ResolvedPagination = PagePagination | CursorPagination;

/** Whitelist only — never pass raw client sort fields to Prisma orderBy. */
export const PROPERTY_SORT_FIELDS = [
  "askingPrice",
  "pricePerSqm",
  "usableArea",
  "publishedAt",
  "updatedAt",
  "createdAt",
] as const;

export type PropertySortField = (typeof PROPERTY_SORT_FIELDS)[number];
export type SortDirection = "asc" | "desc";

export const SNAPSHOT_SORT_FIELDS = [
  "estimatedRentMonthlyCzk",
  "grossYieldPct",
  "netYieldPct",
  "monthlyCashflowCzk",
  "cashOnCashPct",
  "paybackYears",
  "tenantDemandScore",
  "estimatedOccupancyMinPct",
  "renovationCostMinCzk",
  "discountToEstimatedValuePct",
  "majetioScore",
] as const;

export type SnapshotSortField = (typeof SNAPSHOT_SORT_FIELDS)[number];

export type PropertySort = {
  field: PropertySortField;
  direction: SortDirection;
  /** When set, Prisma orders by the cached snapshot. Null metrics sort last. */
  snapshot?: { field: SnapshotSortField; direction: SortDirection };
};

export function clampPageSize(size: number | undefined): number {
  if (size == null || !Number.isFinite(size)) return DEFAULT_PAGE_SIZE;
  return Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(size)));
}

export function resolvePagination(input: PaginationInput = {}): ResolvedPagination {
  const pageSize = clampPageSize(input.pageSize);
  if (input.mode === "cursor") {
    return {
      mode: "cursor",
      cursor: input.cursor ?? null,
      pageSize,
      take: pageSize,
    };
  }
  const page = Math.max(1, Math.floor(input.page ?? 1));
  return {
    mode: "page",
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function resolvePropertySort(
  field?: string | null,
  direction?: string | null,
): PropertySort {
  const safeField = PROPERTY_SORT_FIELDS.includes(field as PropertySortField)
    ? (field as PropertySortField)
    : "updatedAt";
  const safeDir: SortDirection = direction === "asc" ? "asc" : "desc";
  return { field: safeField, direction: safeDir };
}

export function encodeCursor(payload: { id: string; sortValue: string | number | null }): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeCursor(
  cursor: string | null | undefined,
): { id: string; sortValue: string | number | null } | null {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as {
      id?: string;
      sortValue?: string | number | null;
    };
    if (!parsed.id) return null;
    return { id: parsed.id, sortValue: parsed.sortValue ?? null };
  } catch {
    return null;
  }
}
