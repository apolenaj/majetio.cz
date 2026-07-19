/**
 * Whitelisted search sorts (Prompt 8 Part 1).
 * Client may send presets or field names — never raw SQL ORDER BY fragments.
 */

import type { PropertySort, PropertySortField, SortDirection } from "../pagination";
import type { SearchSortPreset } from "../../schemas/search";
import { SEARCH_SORT_PRESETS } from "../../schemas/search";

const PRESET_MAP: Record<SearchSortPreset, PropertySort> = {
  newest: { field: "publishedAt", direction: "desc" },
  price_asc: { field: "askingPrice", direction: "asc" },
  price_desc: { field: "askingPrice", direction: "desc" },
  price_per_sqm: { field: "pricePerSqm", direction: "desc" },
  price_per_sqm_asc: { field: "pricePerSqm", direction: "asc" },
  area_desc: { field: "usableArea", direction: "desc" },
};

const FIELD_WHITELIST = new Set<PropertySortField>([
  "askingPrice",
  "pricePerSqm",
  "usableArea",
  "publishedAt",
  "updatedAt",
  "createdAt",
]);

export function resolveSearchSort(input: {
  sort?: string | null;
  sortField?: string | null;
  sortDirection?: string | null;
}): PropertySort {
  if (input.sort && (SEARCH_SORT_PRESETS as readonly string[]).includes(input.sort)) {
    return PRESET_MAP[input.sort as SearchSortPreset];
  }

  // Legacy aliases from older clients
  const alias = (input.sortField ?? "").toLowerCase();
  if (alias === "newest" || alias === "publishedat") {
    return PRESET_MAP.newest;
  }
  if (alias === "price" || alias === "askingprice") {
    return {
      field: "askingPrice",
      direction: input.sortDirection === "asc" ? "asc" : "desc",
    };
  }

  const field = FIELD_WHITELIST.has(input.sortField as PropertySortField)
    ? (input.sortField as PropertySortField)
    : "publishedAt";
  const direction: SortDirection = input.sortDirection === "asc" ? "asc" : "desc";
  return { field, direction };
}

/** Prisma orderBy object — keys only from whitelist. */
export function toPrismaOrderBy(sort: PropertySort): Record<string, "asc" | "desc"> {
  if (!FIELD_WHITELIST.has(sort.field)) {
    return { publishedAt: "desc" };
  }
  return { [sort.field]: sort.direction };
}
