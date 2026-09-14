/**
 * MarketSearchFilterRegistry (Prompt 17.3).
 * Shared filters + market-specific extras from MarketPlugin — no country ifs in UI.
 */

import { getMarketPlugin } from "@/domains/markets/plugins";

export type SearchFilterControl =
  | "range"
  | "multi_select"
  | "single_select"
  | "boolean"
  | "text";

export type SearchFilterDefinition = {
  key: string;
  labelKey: string;
  control: SearchFilterControl;
  /** Shared across markets when true. */
  shared: boolean;
  enabled: boolean;
  order: number;
  /** Optional URL param alias (CZ legacy). */
  urlKey?: string;
};

export const SHARED_SEARCH_FILTERS: readonly SearchFilterDefinition[] = [
  {
    key: "query",
    labelKey: "search.filter.query",
    control: "text",
    shared: true,
    enabled: true,
    order: 5,
    urlKey: "q",
  },
  {
    key: "price",
    labelKey: "search.filter.price",
    control: "range",
    shared: true,
    enabled: true,
    order: 10,
    urlKey: "cena",
  },
  {
    key: "propertyType",
    labelKey: "search.filter.property_type",
    control: "multi_select",
    shared: true,
    enabled: true,
    order: 20,
    urlKey: "typ",
  },
  {
    key: "area",
    labelKey: "search.filter.area",
    control: "range",
    shared: true,
    enabled: true,
    order: 30,
    urlKey: "plocha",
  },
  {
    key: "marketChannel",
    labelKey: "search.filter.market_channel",
    control: "single_select",
    shared: true,
    enabled: true,
    order: 35,
  },
] as const;

/** Catalog — markets pick keys via searchFilterExtraKeys. */
export const SEARCH_FILTER_EXTRAS_CATALOG: Record<string, SearchFilterDefinition> =
  {
    layout: {
      key: "layout",
      labelKey: "search.filter.layout_disposition",
      control: "multi_select",
      shared: false,
      enabled: true,
      order: 25,
      urlKey: "dispozice",
    },
    ownership: {
      key: "ownership",
      labelKey: "search.filter.ownership",
      control: "multi_select",
      shared: false,
      enabled: true,
      order: 40,
    },
    condition: {
      key: "condition",
      labelKey: "search.filter.condition",
      control: "multi_select",
      shared: false,
      enabled: true,
      order: 45,
    },
    energy: {
      key: "energy",
      labelKey: "search.filter.energy",
      control: "multi_select",
      shared: false,
      enabled: true,
      order: 50,
      urlKey: "energie",
    },
    bedrooms: {
      key: "bedrooms",
      labelKey: "search.filter.bedrooms",
      control: "multi_select",
      shared: false,
      enabled: true,
      order: 25,
    },
    bathrooms: {
      key: "bathrooms",
      labelKey: "search.filter.bathrooms",
      control: "multi_select",
      shared: false,
      enabled: true,
      order: 26,
    },
    freehold: {
      key: "freehold",
      labelKey: "search.filter.freehold",
      control: "boolean",
      shared: false,
      enabled: true,
      order: 40,
    },
    offPlan: {
      key: "offPlan",
      labelKey: "search.filter.off_plan",
      control: "boolean",
      shared: false,
      enabled: true,
      order: 41,
    },
    serviceChargeMax: {
      key: "serviceChargeMax",
      labelKey: "search.filter.service_charge",
      control: "range",
      shared: false,
      enabled: true,
      order: 42,
    },
    paymentPlan: {
      key: "paymentPlan",
      labelKey: "search.filter.payment_plan",
      control: "boolean",
      shared: false,
      enabled: true,
      order: 43,
    },
  };

export function resolveSearchFiltersForMarket(
  marketCode: string,
  extraKeys?: readonly string[],
): SearchFilterDefinition[] {
  const plugin = getMarketPlugin(marketCode);
  const keys = extraKeys ?? plugin?.property.searchFilterExtraKeys ?? [];
  const byKey = new Map<string, SearchFilterDefinition>();
  for (const f of SHARED_SEARCH_FILTERS) byKey.set(f.key, f);
  for (const key of keys) {
    const def = SEARCH_FILTER_EXTRAS_CATALOG[key];
    if (def) byKey.set(def.key, def);
  }
  return [...byKey.values()]
    .filter((f) => f.enabled)
    .sort((a, b) => a.order - b.order);
}

export function isSearchFilterEnabled(
  marketCode: string,
  key: string,
): boolean {
  return resolveSearchFiltersForMarket(marketCode).some((f) => f.key === key);
}
