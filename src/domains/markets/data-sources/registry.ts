/**
 * MarketDataSourceRegistry — evidence of data origin per market (Prompt 17.5).
 */

export const MARKET_DATA_SOURCE_CATEGORIES = [
  "OFFICIAL_PUBLIC",
  "LICENSED",
  "PARTNER",
  "INTERNAL_DERIVED",
  "USER_GENERATED",
  "SCRAPED_RESTRICTED",
] as const;

export type MarketDataSourceCategory =
  (typeof MARKET_DATA_SOURCE_CATEGORIES)[number];

export type MarketDataSourceAllowedUsage = {
  display: boolean;
  commercial: boolean;
  derivative: boolean;
  /** SEO / public landing pages may cite this source. */
  seoCitation: boolean;
};

export type MarketDataSource = {
  key: string;
  marketCode: string;
  nameEn: string;
  category: MarketDataSourceCategory;
  urlOrReference: string;
  license: string;
  covers: readonly (
    | "LISTINGS"
    | "TRANSACTIONS"
    | "BOUNDARIES"
    | "DEMOGRAPHICS"
    | "REGULATORY"
    | "FX"
  )[];
  updateFrequency:
    | "REALTIME"
    | "DAILY"
    | "WEEKLY"
    | "MONTHLY"
    | "QUARTERLY"
    | "YEARLY"
    | "AD_HOC";
  reliability: number;
  allowedUsage: MarketDataSourceAllowedUsage;
  verifiedAt: string | null;
};

export const MARKET_DATA_SOURCE_REGISTRY: readonly MarketDataSource[] = [
  {
    key: "cz.listings.partner",
    marketCode: "CZ",
    nameEn: "CZ partner listing feeds",
    category: "PARTNER",
    urlOrReference: "internal:cz-listings",
    license: "Partner agreement",
    covers: ["LISTINGS"],
    updateFrequency: "DAILY",
    reliability: 0.8,
    allowedUsage: {
      display: true,
      commercial: true,
      derivative: true,
      seoCitation: true,
    },
    verifiedAt: "2026-07-01T00:00:00.000Z",
  },
  {
    key: "cz.official.stats",
    marketCode: "CZ",
    nameEn: "CZSO / official statistics",
    category: "OFFICIAL_PUBLIC",
    urlOrReference: "https://www.czso.cz",
    license: "Open data / public",
    covers: ["DEMOGRAPHICS", "BOUNDARIES"],
    updateFrequency: "QUARTERLY",
    reliability: 0.92,
    allowedUsage: {
      display: true,
      commercial: true,
      derivative: true,
      seoCitation: true,
    },
    verifiedAt: "2026-07-01T00:00:00.000Z",
  },
  {
    key: "cz.transactions.licensed",
    marketCode: "CZ",
    nameEn: "Licensed CZ transaction feed",
    category: "LICENSED",
    urlOrReference: "internal:cz-tx",
    license: "Restricted commercial",
    covers: ["TRANSACTIONS"],
    updateFrequency: "MONTHLY",
    reliability: 0.88,
    allowedUsage: {
      display: true,
      commercial: true,
      derivative: false,
      seoCitation: false,
    },
    verifiedAt: "2026-07-01T00:00:00.000Z",
  },
  {
    key: "ae.listings.research",
    marketCode: "AE",
    nameEn: "UAE listings (research placeholder)",
    category: "PARTNER",
    urlOrReference: "internal:ae-listings-research",
    license: "TBD — not production",
    covers: ["LISTINGS"],
    updateFrequency: "AD_HOC",
    reliability: 0.3,
    allowedUsage: {
      display: false,
      commercial: false,
      derivative: false,
      seoCitation: false,
    },
    verifiedAt: null,
  },
  {
    key: "global.fx.ecb_style",
    marketCode: "*",
    nameEn: "FX rate snapshots",
    category: "INTERNAL_DERIVED",
    urlOrReference: "internal:fx-snapshots",
    license: "Majetio derived / provider TBD",
    covers: ["FX"],
    updateFrequency: "DAILY",
    reliability: 0.85,
    allowedUsage: {
      display: true,
      commercial: true,
      derivative: true,
      seoCitation: true,
    },
    verifiedAt: "2026-07-01T00:00:00.000Z",
  },
] as const;

export function listMarketDataSources(marketCode: string): MarketDataSource[] {
  const code = marketCode.toUpperCase();
  return MARKET_DATA_SOURCE_REGISTRY.filter(
    (s) => s.marketCode === code || s.marketCode === "*",
  );
}

export function getMarketDataSource(key: string): MarketDataSource | null {
  return MARKET_DATA_SOURCE_REGISTRY.find((s) => s.key === key) ?? null;
}

export function marketHasMinimumSeoDataCoverage(marketCode: string): boolean {
  const sources = listMarketDataSources(marketCode).filter(
    (s) => s.allowedUsage.seoCitation && s.reliability >= 0.7,
  );
  const covers = new Set(sources.flatMap((s) => s.covers));
  return covers.has("LISTINGS") || covers.has("DEMOGRAPHICS");
}
