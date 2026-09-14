/**
 * URL-driven table state for admin lists (193–202).
 * page, pageSize, sort, order, + free-form filters stay in query string.
 */

export type SortOrder = "asc" | "desc";

export type AdminTableState = {
  page: number;
  pageSize: number;
  sort: string | null;
  order: SortOrder;
  filters: Record<string, string>;
};

export const ADMIN_DEFAULT_PAGE_SIZE = 25;
export const ADMIN_MAX_PAGE_SIZE = 100;

function firstString(
  sp: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const v = sp[key];
  return typeof v === "string" ? v : undefined;
}

export function parseAdminTableState(
  sp: Record<string, string | string[] | undefined>,
  options?: {
    defaultSort?: string;
    defaultOrder?: SortOrder;
    defaultPageSize?: number;
    filterKeys?: string[];
  },
): AdminTableState {
  const pageRaw = Number(firstString(sp, "page") ?? "1");
  const page = Number.isFinite(pageRaw) ? Math.max(1, Math.floor(pageRaw)) : 1;

  const sizeRaw = Number(
    firstString(sp, "pageSize") ??
      String(options?.defaultPageSize ?? ADMIN_DEFAULT_PAGE_SIZE),
  );
  const pageSize = Number.isFinite(sizeRaw)
    ? Math.min(ADMIN_MAX_PAGE_SIZE, Math.max(5, Math.floor(sizeRaw)))
    : ADMIN_DEFAULT_PAGE_SIZE;

  const orderRaw = firstString(sp, "order");
  const order: SortOrder =
    orderRaw === "asc" || orderRaw === "desc"
      ? orderRaw
      : (options?.defaultOrder ?? "desc");

  const sort = firstString(sp, "sort") ?? options?.defaultSort ?? null;

  const filters: Record<string, string> = {};
  for (const key of options?.filterKeys ?? []) {
    const v = firstString(sp, key);
    if (v != null && v !== "") filters[key] = v;
  }

  return { page, pageSize, sort, order, filters };
}

export function adminTableSkip(state: AdminTableState): number {
  return (state.page - 1) * state.pageSize;
}

export function adminTableTotalPages(total: number, pageSize: number): number {
  if (total <= 0) return 1;
  return Math.max(1, Math.ceil(total / pageSize));
}

/** Build href preserving filters while overriding page/sort/order. */
export function buildAdminTableHref(
  pathname: string,
  current: AdminTableState,
  patch: Partial<{
    page: number;
    pageSize: number;
    sort: string | null;
    order: SortOrder;
    filters: Record<string, string | undefined>;
  }>,
): string {
  const params = new URLSearchParams();
  const page = patch.page ?? current.page;
  const pageSize = patch.pageSize ?? current.pageSize;
  const sort = patch.sort !== undefined ? patch.sort : current.sort;
  const order = patch.order ?? current.order;
  const filters = { ...current.filters, ...(patch.filters ?? {}) };

  if (page > 1) params.set("page", String(page));
  if (pageSize !== ADMIN_DEFAULT_PAGE_SIZE) {
    params.set("pageSize", String(pageSize));
  }
  if (sort) params.set("sort", sort);
  if (order !== "desc") params.set("order", order);
  for (const [k, v] of Object.entries(filters)) {
    if (v != null && v !== "") params.set(k, v);
  }

  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function toggleSortOrder(
  currentSort: string | null,
  currentOrder: SortOrder,
  nextSort: string,
): { sort: string; order: SortOrder } {
  if (currentSort === nextSort) {
    return { sort: nextSort, order: currentOrder === "asc" ? "desc" : "asc" };
  }
  return { sort: nextSort, order: "asc" };
}
