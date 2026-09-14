/**
 * Majetio Core — multi-market primitives (Prompt 17.1).
 * One platform; markets are plugins — never fork the app per country.
 */

export type {
  MarketCode,
  CountryCode,
  LocaleCode,
  MarketCodeLiteral,
} from "@/domains/markets/codes";

export {
  MARKET_CODES,
  HOME_MARKET_CODE,
  isMarketCode,
  toMarketCode,
  tryMarketCode,
  isCountryCode,
  toCountryCode,
  tryCountryCode,
  isLocaleCode,
  toLocaleCode,
  tryLocaleCode,
  marketCodeFromCurrency,
  resolveExplicitMarketCode,
  MARKET_DEFAULT_COUNTRY,
  MARKET_DEFAULT_CURRENCY,
} from "@/domains/markets/codes";

export const LAUNCH_STATUSES = [
  "PLANNED",
  "RESEARCH",
  "BETA",
  "LIVE",
  "PAUSED",
] as const;

export type LaunchStatus = (typeof LAUNCH_STATUSES)[number];

/** Public UI may treat market as "active" only for these statuses (+ enabled + data). */
export const PUBLIC_LAUNCH_STATUSES: readonly LaunchStatus[] = [
  "BETA",
  "LIVE",
] as const;

export const CAPABILITY_STATUSES = [
  "FULL",
  "BETA",
  "LIMITED",
  "MANUAL_ONLY",
  "NOT_AVAILABLE",
] as const;

export type CapabilityStatus = (typeof CAPABILITY_STATUSES)[number];

export const MEASUREMENT_SYSTEMS = ["METRIC", "IMPERIAL"] as const;
export type MeasurementSystem = (typeof MEASUREMENT_SYSTEMS)[number];

/** Canonical capability keys shared across markets. */
export const MARKET_CAPABILITY_KEYS = [
  "PROPERTY_SEARCH",
  "VALUATION",
  "INVESTMENT_ENGINE",
  "MORTGAGE_CALCULATOR",
  "MORTGAGE_LEAD_HANDOFF",
  "COMPARISON",
  "LOCATION_INTELLIGENCE",
  "LISTING_BOOST",
  "B2B_CRM",
  "QUALIFIED_LEADS",
  "TAX_ESTIMATES",
  "TRANSACTION_COST_ESTIMATES",
  "PROFESSIONAL_SERVICES",
] as const;

export type MarketCapabilityKey = (typeof MARKET_CAPABILITY_KEYS)[number];

export type MarketRegionDefinition = {
  /** e.g. bali — never a separate ISO country market. */
  regionCode: string;
  displayNameEn: string;
  displayNameLocal?: string;
  /** Parent marketCode (e.g. ID). */
  parentMarketCode: string;
  timezone?: string;
  /** Optional locale bias within parent market. */
  defaultLocale?: string;
  notesEn?: string;
};

export type MarketDefinition = {
  /** Branded MarketCode string (CZ, AE, …) — always explicit. */
  marketCode: string;
  /** ISO 3166-1 alpha-2. */
  countryCode: string;
  displayNameEn: string;
  displayNameLocal: string;
  /** BCP 47. */
  defaultLocale: string;
  supportedLocales: readonly string[];
  /** ISO 4217 — informational; never use as market key. */
  defaultCurrency: string;
  timezone: string;
  measurementSystem: MeasurementSystem;
  /** Soft kill-switch independent of launchStatus. */
  enabled: boolean;
  launchStatus: LaunchStatus;
  /** Semantic version of regulatory / tax tables for this market. */
  regulatoryConfigVersion: string;
  /** True when enough catalog/demo/live data exists for public surfaces. */
  hasMinimumPublicData: boolean;
  /** Optional sub-regions (Bali under ID). */
  regions?: readonly MarketRegionDefinition[];
  notesEn?: string;
};

export type MarketPublicSurface = {
  marketCode: string;
  displayNameEn: string;
  displayNameLocal: string;
  defaultLocale: string;
  defaultCurrency: string;
  launchStatus: LaunchStatus;
  /** Only true when allowed for public UI. */
  publiclyActive: boolean;
  reasonIfHidden: string | null;
};
