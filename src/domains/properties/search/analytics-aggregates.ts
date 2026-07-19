/**
 * Privacy-safe discovery analytics helpers (Prompt 8 Part 5).
 * Never send exact CZK amounts, street addresses, or free-text that may contain PII.
 */

import type { PropertyUrlFilterState } from "@/domains/properties/search/url-state";
import { countActiveFilters } from "@/domains/properties/search/url-state";

export type PriceBucket =
  | "none"
  | "under_3m"
  | "3_5m"
  | "5_8m"
  | "8_12m"
  | "over_12m";

export type AreaBucket = "none" | "under_40" | "40_70" | "70_100" | "over_100";

/** Map exact CZK → coarse bucket (aggregates only). */
export function priceToBucket(czk: number | null | undefined): PriceBucket {
  if (czk == null || !Number.isFinite(czk) || czk <= 0) return "none";
  if (czk < 3_000_000) return "under_3m";
  if (czk < 5_000_000) return "3_5m";
  if (czk < 8_000_000) return "5_8m";
  if (czk < 12_000_000) return "8_12m";
  return "over_12m";
}

export function areaToBucket(sqm: number | null | undefined): AreaBucket {
  if (sqm == null || !Number.isFinite(sqm) || sqm <= 0) return "none";
  if (sqm < 40) return "under_40";
  if (sqm < 70) return "40_70";
  if (sqm < 100) return "70_100";
  return "over_100";
}

/** Fold city text to a short slug token for analytics (no free-form address). */
export function locationToken(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const fold = raw
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  return fold || null;
}

export type SearchFilterAggregate = {
  has_query: boolean;
  location_token: string | null;
  price_max_bucket: PriceBucket;
  price_min_bucket: PriceBucket;
  property_types: string[];
  layout_count: number;
  filter_count: number;
  sort: string;
};

export function aggregateSearchFilters(
  state: PropertyUrlFilterState,
): SearchFilterAggregate {
  return {
    has_query: Boolean(state.q?.trim()),
    location_token: locationToken(state.lokalita ?? state.q),
    price_max_bucket: priceToBucket(state.cenaDo),
    price_min_bucket: priceToBucket(state.cenaOd),
    property_types: [...state.typ].slice(0, 5),
    layout_count: state.dispozice.length,
    filter_count: countActiveFilters(state),
    sort: state.razeni ?? "newest",
  };
}
