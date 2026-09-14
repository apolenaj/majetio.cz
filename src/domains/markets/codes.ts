/**
 * MarketCode / CountryCode / LocaleCode — strict identity types (Rules 181–185).
 *
 * Market is ALWAYS explicit in code. Never derive market from currency alone
 * (e.g. EUR ≠ a single market — ES/IT/HR/SK all use EUR).
 */

declare const __marketCodeBrand: unique symbol;
declare const __countryCodeBrand: unique symbol;
declare const __localeCodeBrand: unique symbol;

/** Branded Majetio market identifier (not always equal to ISO country). */
export type MarketCode = string & { readonly [__marketCodeBrand]: true };

/** ISO 3166-1 alpha-2 country code. */
export type CountryCode = string & { readonly [__countryCodeBrand]: true };

/** BCP 47 locale tag (e.g. cs-CZ, en-AE, ar-AE). */
export type LocaleCode = string & { readonly [__localeCodeBrand]: true };

/**
 * Canonical market codes in the Market Registry.
 * Bali is a *region* under ID — never a MarketCode.
 */
export const MARKET_CODES = [
  "CZ",
  "SK",
  "ES",
  "IT",
  "HR",
  "AE",
  "SA",
  "ID",
] as const;

export type MarketCodeLiteral = (typeof MARKET_CODES)[number];

/** Home / primary market for Majetio.cz Core deploy. */
export const HOME_MARKET_CODE = "CZ" as MarketCode;

const MARKET_SET = new Set<string>(MARKET_CODES);

/** Loose ISO 3166-1 alpha-2 check (A–Z × 2). */
const ISO_3166_ALPHA2 = /^[A-Z]{2}$/;

/**
 * BCP 47 language tag (simplified): language[-Script][-REGION]…
 * Examples: cs, cs-CZ, en-GB, ar-AE, zh-Hans-CN
 */
const BCP47_LOCALE =
  /^[A-Za-z]{2,3}(-[A-Za-z]{4})?(-[A-Za-z]{2}|\d{3})?(-[A-Za-z0-9]{5,8})*$/;

export function isMarketCode(value: string): value is MarketCode {
  return MARKET_SET.has(value.trim().toUpperCase());
}

export function toMarketCode(value: string): MarketCode {
  const upper = value.trim().toUpperCase();
  if (!MARKET_SET.has(upper)) {
    throw new Error(
      `Unknown MarketCode "${value}". Registered: ${MARKET_CODES.join(", ")}.`,
    );
  }
  return upper as MarketCode;
}

export function tryMarketCode(value: string | null | undefined): MarketCode | null {
  if (value == null || !value.trim()) return null;
  const upper = value.trim().toUpperCase();
  return MARKET_SET.has(upper) ? (upper as MarketCode) : null;
}

export function isCountryCode(value: string): value is CountryCode {
  return ISO_3166_ALPHA2.test(value.trim().toUpperCase());
}

export function toCountryCode(value: string): CountryCode {
  const upper = value.trim().toUpperCase();
  if (!ISO_3166_ALPHA2.test(upper)) {
    throw new Error(
      `Invalid ISO 3166-1 alpha-2 CountryCode "${value}".`,
    );
  }
  return upper as CountryCode;
}

export function tryCountryCode(
  value: string | null | undefined,
): CountryCode | null {
  if (value == null || !value.trim()) return null;
  const upper = value.trim().toUpperCase();
  return ISO_3166_ALPHA2.test(upper) ? (upper as CountryCode) : null;
}

export function isLocaleCode(value: string): value is LocaleCode {
  return BCP47_LOCALE.test(value.trim());
}

export function toLocaleCode(value: string): LocaleCode {
  const trimmed = value.trim();
  if (!BCP47_LOCALE.test(trimmed)) {
    throw new Error(`Invalid BCP 47 LocaleCode "${value}".`);
  }
  return trimmed as LocaleCode;
}

export function tryLocaleCode(
  value: string | null | undefined,
): LocaleCode | null {
  if (value == null || !value.trim()) return null;
  const trimmed = value.trim();
  return BCP47_LOCALE.test(trimmed) ? (trimmed as LocaleCode) : null;
}

/**
 * FORBIDDEN: inferring market from currency.
 * EUR is shared by SK/ES/IT/HR — callers must pass MarketCode explicitly.
 */
export function marketCodeFromCurrency(_currency: string): never {
  throw new Error(
    "Never derive MarketCode from currency alone (Rule 185). " +
      "Pass an explicit MarketCode (e.g. from host, user profile, or entity.marketCode).",
  );
}

/**
 * Resolve market only from explicit sources — never from currency.
 */
export function resolveExplicitMarketCode(input: {
  marketCode?: string | null;
  /** @deprecated Prefer marketCode — legacy Lead.marketCountry */
  marketCountry?: string | null;
  fallback?: MarketCode;
}): MarketCode {
  const fromCode = tryMarketCode(input.marketCode);
  if (fromCode) return fromCode;
  const fromCountry = tryMarketCode(input.marketCountry);
  if (fromCountry) return fromCountry;
  return input.fallback ?? HOME_MARKET_CODE;
}

/** Default country for a registered market (usually equal to marketCode). */
export const MARKET_DEFAULT_COUNTRY: Record<MarketCodeLiteral, CountryCode> = {
  CZ: "CZ" as CountryCode,
  SK: "SK" as CountryCode,
  ES: "ES" as CountryCode,
  IT: "IT" as CountryCode,
  HR: "HR" as CountryCode,
  AE: "AE" as CountryCode,
  SA: "SA" as CountryCode,
  ID: "ID" as CountryCode,
};

/** Default ISO 4217 currency per market — informational; not a market key. */
export const MARKET_DEFAULT_CURRENCY: Record<MarketCodeLiteral, string> = {
  CZ: "CZK",
  SK: "EUR",
  ES: "EUR",
  IT: "EUR",
  HR: "EUR",
  AE: "AED",
  SA: "SAR",
  ID: "IDR",
};

/** Safe lookup for branded MarketCode without indexing Record by branded string. */
export function getMarketDefaultCurrency(code: MarketCode): string {
  for (const key of MARKET_CODES) {
    if (key === code) return MARKET_DEFAULT_CURRENCY[key];
  }
  return "CZK";
}
