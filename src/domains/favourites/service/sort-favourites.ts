/**
 * Pure sort/filter helpers for favourites list (unit-testable, no Prisma).
 */

import type { FavouriteStatusValue } from "@/domains/favourites/status";
import type { FavouriteListItemDto } from "@/domains/favourites/types";

export const FAVOURITES_DEFAULT_PAGE_SIZE = 24;
export const FAVOURITES_MAX_PAGE_SIZE = 50;

export type FavouriteListSort =
  | "recently_saved"
  | "activity"
  | "price_asc"
  | "price_desc"
  | "price_drop"
  | "status"
  | "match";

/** Decision pipeline order: Favorit → Prohlídka → Zvažuji → Vyřazeno */
export const FAVOURITE_STATUS_SORT_RANK: Record<FavouriteStatusValue, number> = {
  FAVORITE: 0,
  VIEWING: 1,
  CONSIDERING: 2,
  REJECTED: 3,
};

export type FavouriteSlimSortRow = {
  id: string;
  status: FavouriteStatusValue;
  createdAt: string | Date;
  updatedAt: string | Date;
  priority: number | null;
  priceAtSave: number | null;
  askingPrice: number | null;
  matchScore: number | null;
};

function ts(value: string | Date): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

function priceChangeCzk(row: FavouriteSlimSortRow): number | null {
  if (row.askingPrice == null || row.priceAtSave == null || row.priceAtSave <= 0) {
    return null;
  }
  return row.askingPrice - row.priceAtSave;
}

export function compareFavouriteSortRows(
  a: FavouriteSlimSortRow,
  b: FavouriteSlimSortRow,
  sort: FavouriteListSort,
): number {
  const byPriority = (a.priority ?? 9999) - (b.priority ?? 9999);
  if (byPriority !== 0 && sort !== "status") {
    // Keep manual priority as soft secondary except when sorting by status
  }

  switch (sort) {
    case "recently_saved": {
      const d = ts(b.createdAt) - ts(a.createdAt);
      return d !== 0 ? d : byPriority;
    }
    case "activity": {
      const d = ts(b.updatedAt) - ts(a.updatedAt);
      return d !== 0 ? d : byPriority;
    }
    case "price_asc": {
      const ap = a.askingPrice ?? Number.POSITIVE_INFINITY;
      const bp = b.askingPrice ?? Number.POSITIVE_INFINITY;
      return ap - bp || byPriority;
    }
    case "price_desc": {
      const ap = a.askingPrice ?? Number.NEGATIVE_INFINITY;
      const bp = b.askingPrice ?? Number.NEGATIVE_INFINITY;
      return bp - ap || byPriority;
    }
    case "price_drop": {
      // Biggest drop first (most negative Δ). Increases / missing last.
      const ac = priceChangeCzk(a);
      const bc = priceChangeCzk(b);
      if (ac == null && bc == null) return byPriority;
      if (ac == null) return 1;
      if (bc == null) return -1;
      if (ac !== bc) return ac - bc;
      return byPriority;
    }
    case "status": {
      const ar = FAVOURITE_STATUS_SORT_RANK[a.status] ?? 99;
      const br = FAVOURITE_STATUS_SORT_RANK[b.status] ?? 99;
      if (ar !== br) return ar - br;
      return ts(b.updatedAt) - ts(a.updatedAt);
    }
    case "match": {
      const am = a.matchScore;
      const bm = b.matchScore;
      if (am == null && bm == null) return byPriority;
      if (am == null) return 1;
      if (bm == null) return -1;
      if (bm !== am) return bm - am;
      return byPriority;
    }
    default:
      return byPriority;
  }
}

export function sortFavouriteSlimRows<T extends FavouriteSlimSortRow>(
  rows: T[],
  sort: FavouriteListSort,
): T[] {
  return [...rows].sort((a, b) => compareFavouriteSortRows(a, b, sort));
}

export function sortFavouriteListItems(
  items: FavouriteListItemDto[],
  sort: FavouriteListSort,
): FavouriteListItemDto[] {
  const slim = items.map((item) => ({
    id: item.id,
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    priority: item.priority,
    priceAtSave: item.priceAtSave,
    askingPrice: item.property.askingPrice,
    matchScore: item.matchScore,
    item,
  }));
  return sortFavouriteSlimRows(slim, sort).map((r) => r.item);
}

export function clampFavouritePageSize(pageSize?: number): number {
  if (pageSize == null || !Number.isFinite(pageSize)) {
    return FAVOURITES_DEFAULT_PAGE_SIZE;
  }
  return Math.min(
    FAVOURITES_MAX_PAGE_SIZE,
    Math.max(1, Math.floor(pageSize)),
  );
}
