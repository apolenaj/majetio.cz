/**
 * Location Metric Registry — canonical keys, categories, aggregation rules.
 * Asking vs transaction prices are ALWAYS separate metric keys + priceKind.
 */

import type {
  LocationMetricCategory,
  LocationMetricPriceKind,
} from "@prisma/client";

export const LOCATION_METRICS_METHODOLOGY_VERSION = "location-metrics.v2026.07";

export type MetricStatistic = "median" | "mean" | "sum" | "rate" | "count";

export type LocationMetricDefinition = {
  key: string;
  category: LocationMetricCategory;
  labelCs: string;
  unit: string;
  priceKind: LocationMetricPriceKind;
  preferredStatistic: MetricStatistic;
  minSampleCount: number;
  suppressBelowSampleCount: number;
  supportsSegmentation: boolean;
  description: string;
};

export const LOCATION_METRIC_CATEGORIES: Record<
  LocationMetricCategory,
  { labelCs: string; description: string }
> = {
  PROPERTY_MARKET: {
    labelCs: "Trh nemovitostí",
    description: "Ceny, nabídka a likvidita prodejního trhu.",
  },
  RENTAL_MARKET: {
    labelCs: "Nájemní trh",
    description: "Nájmy, obsazenost a obrat pronájmů.",
  },
  INVESTMENT: {
    labelCs: "Investice",
    description: "Hrubý výnos, cap rate, investiční indexy.",
  },
  INFRASTRUCTURE: {
    labelCs: "Infrastruktura",
    description: "Dostupnost, doprava, občanská vybavenost.",
  },
  DEVELOPMENT: {
    labelCs: "Výstavba",
    description: "Development pipeline, novostavby, povolení.",
  },
};

export const LOCATION_METRIC_REGISTRY = {
  "property_market.median_asking_price_sqm": {
    key: "property_market.median_asking_price_sqm",
    category: "PROPERTY_MARKET",
    labelCs: "Medián nabídkové ceny za m²",
    unit: "CZK/m²",
    priceKind: "ASKING",
    preferredStatistic: "median",
    minSampleCount: 15,
    suppressBelowSampleCount: 8,
    supportsSegmentation: true,
    description: "Medián nabídkových cen aktivních listingů.",
  },
  "property_market.mean_asking_price_sqm": {
    key: "property_market.mean_asking_price_sqm",
    category: "PROPERTY_MARKET",
    labelCs: "Průměr nabídkové ceny za m² (doplňkový)",
    unit: "CZK/m²",
    priceKind: "ASKING",
    preferredStatistic: "mean",
    minSampleCount: 15,
    suppressBelowSampleCount: 8,
    supportsSegmentation: true,
    description: "Aritmetický průměr — vždy vedle mediánu.",
  },
  "property_market.active_listings_count": {
    key: "property_market.active_listings_count",
    category: "PROPERTY_MARKET",
    labelCs: "Počet aktivních inzerátů",
    unit: "count",
    priceKind: "NONE",
    preferredStatistic: "count",
    minSampleCount: 1,
    suppressBelowSampleCount: 1,
    supportsSegmentation: true,
    description: "Proxy nabídky.",
  },
  "property_market.median_days_on_market": {
    key: "property_market.median_days_on_market",
    category: "PROPERTY_MARKET",
    labelCs: "Medián days on market",
    unit: "days",
    priceKind: "NONE",
    preferredStatistic: "median",
    minSampleCount: 10,
    suppressBelowSampleCount: 5,
    supportsSegmentation: true,
    description: "Likvidita — medián DOM s trimmed outliers.",
  },
  "property_market.price_reduction_rate": {
    key: "property_market.price_reduction_rate",
    category: "PROPERTY_MARKET",
    labelCs: "Podíl listingů se slevou",
    unit: "ratio",
    priceKind: "NONE",
    preferredStatistic: "rate",
    minSampleCount: 20,
    suppressBelowSampleCount: 10,
    supportsSegmentation: true,
    description: "Proxy poptávky.",
  },
  "property_market.median_transaction_price_sqm": {
    key: "property_market.median_transaction_price_sqm",
    category: "PROPERTY_MARKET",
    labelCs: "Medián transakční ceny za m²",
    unit: "CZK/m²",
    priceKind: "TRANSACTION",
    preferredStatistic: "median",
    minSampleCount: 12,
    suppressBelowSampleCount: 6,
    supportsSegmentation: true,
    description: "Realizované prodeje — nikdy nemíchat s asking.",
  },
  "property_market.transaction_count": {
    key: "property_market.transaction_count",
    category: "PROPERTY_MARKET",
    labelCs: "Počet transakcí",
    unit: "count",
    priceKind: "TRANSACTION",
    preferredStatistic: "count",
    minSampleCount: 1,
    suppressBelowSampleCount: 1,
    supportsSegmentation: true,
    description: "Počet realizovaných prodejů.",
  },
  "rental_market.median_asking_rent_sqm": {
    key: "rental_market.median_asking_rent_sqm",
    category: "RENTAL_MARKET",
    labelCs: "Medián nabídkového nájmu za m²",
    unit: "CZK/m²/mo",
    priceKind: "ASKING",
    preferredStatistic: "median",
    minSampleCount: 12,
    suppressBelowSampleCount: 6,
    supportsSegmentation: true,
    description: "Medián inzerovaných nájmů.",
  },
  "rental_market.rent_listings_turnover": {
    key: "rental_market.rent_listings_turnover",
    category: "RENTAL_MARKET",
    labelCs: "Obrat nájemních inzerátů",
    unit: "ratio",
    priceKind: "NONE",
    preferredStatistic: "rate",
    minSampleCount: 15,
    suppressBelowSampleCount: 8,
    supportsSegmentation: true,
    description: "Proxy obsazenosti pronájmů.",
  },
  "investment.gross_rental_yield": {
    key: "investment.gross_rental_yield",
    category: "INVESTMENT",
    labelCs: "Hrubý nájemní výnos",
    unit: "percent",
    priceKind: "NONE",
    preferredStatistic: "rate",
    minSampleCount: 12,
    suppressBelowSampleCount: 8,
    supportsSegmentation: true,
    description: "Roční nájem / asking cena — segmentově.",
  },
  "infrastructure.transit_score": {
    key: "infrastructure.transit_score",
    category: "INFRASTRUCTURE",
    labelCs: "Skóre dopravní dostupnosti",
    unit: "index",
    priceKind: "NONE",
    preferredStatistic: "mean",
    minSampleCount: 1,
    suppressBelowSampleCount: 1,
    supportsSegmentation: false,
    description: "Index dostupnosti MHD.",
  },
  "development.units_under_construction": {
    key: "development.units_under_construction",
    category: "DEVELOPMENT",
    labelCs: "Jednotky ve výstavbě",
    unit: "count",
    priceKind: "NONE",
    preferredStatistic: "count",
    minSampleCount: 1,
    suppressBelowSampleCount: 1,
    supportsSegmentation: false,
    description: "Development pipeline.",
  },
} as const satisfies Record<string, LocationMetricDefinition>;

export type LocationMetricKey = keyof typeof LOCATION_METRIC_REGISTRY;

export function getMetricDefinition(key: string): LocationMetricDefinition | null {
  return (
    (LOCATION_METRIC_REGISTRY as Record<string, LocationMetricDefinition>)[key] ??
    null
  );
}

export const DEFAULT_METRIC_AGGREGATION_CONFIG = {
  methodologyVersion: LOCATION_METRICS_METHODOLOGY_VERSION,
  domOutlierUpperPercentile: 0.95,
  domOutlierLowerPercentile: 0.05,
  trailingWindows: [3, 12] as const,
} as const;

export type MetricAggregationConfig = typeof DEFAULT_METRIC_AGGREGATION_CONFIG;
