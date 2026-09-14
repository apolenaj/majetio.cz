/**
 * Market / locale preference persistence (Rules 175–180).
 * Auth → profile; guest → cookies (+ localStorage mirror).
 * IP/geo may only *suggest* — never force-redirect.
 */

import {
  HOME_MARKET_CODE,
  tryMarketCode,
  type MarketCode,
} from "@/domains/markets/codes";
import {
  getLocaleDefinition,
  languageFromLocale,
  resolveLocaleForMarket,
} from "@/domains/i18n/locales";
import { marketRegistry } from "@/domains/markets/registry/market-registry";
import { MARKET_DEFAULT_CURRENCY } from "@/domains/markets/codes";

export const MARKET_PREF_COOKIE = "majetio_market";
export const LOCALE_PREF_COOKIE = "majetio_locale";
export const CURRENCY_PREF_COOKIE = "majetio_currency";

export const MARKET_PREF_STORAGE_KEY = "majetio.pref.market";
export const LOCALE_PREF_STORAGE_KEY = "majetio.pref.locale";
export const CURRENCY_PREF_STORAGE_KEY = "majetio.pref.currency";

export const PREF_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365; // 1 year

export type InternationalPreference = {
  marketCode: MarketCode;
  locale: string;
  currency: string;
  /** True when values came from explicit user choice (cookie/profile), not suggestion. */
  explicit: boolean;
  /** Optional soft suggestion from geo — never applied as redirect. */
  suggestedMarketCode: MarketCode | null;
};

export type PreferenceCookieBag = {
  name: string;
  value: string;
  path: string;
  maxAge: number;
  sameSite: "lax";
  secure: boolean;
};

export function buildPreferenceCookies(
  pref: Pick<InternationalPreference, "marketCode" | "locale" | "currency">,
): PreferenceCookieBag[] {
  const secure = process.env.NODE_ENV === "production";
  const base = {
    path: "/",
    maxAge: PREF_COOKIE_MAX_AGE_SEC,
    sameSite: "lax" as const,
    secure,
  };
  return [
    { ...base, name: MARKET_PREF_COOKIE, value: pref.marketCode },
    { ...base, name: LOCALE_PREF_COOKIE, value: pref.locale },
    { ...base, name: CURRENCY_PREF_COOKIE, value: pref.currency },
  ];
}

/**
 * Suggest market from edge geo header (e.g. CF-IPCountry / Vercel).
 * MUST NOT be used to auto-redirect — UI banner / soft prompt only.
 */
export function suggestMarketFromGeoCountry(
  countryHeader: string | null | undefined,
): MarketCode | null {
  if (!countryHeader?.trim()) return null;
  const code = tryMarketCode(countryHeader);
  if (!code) return null;
  // Only suggest if we have a registered market plugin
  return marketRegistry.get(code) ? code : null;
}

/**
 * Resolve preference from explicit sources. Never uses currency alone.
 * Geo suggestion is attached but does not override explicit/default.
 */
export function resolveInternationalPreference(input: {
  cookieMarket?: string | null;
  cookieLocale?: string | null;
  cookieCurrency?: string | null;
  profileMarket?: string | null;
  profileLocale?: string | null;
  geoCountryHeader?: string | null;
}): InternationalPreference {
  const suggestedMarketCode = suggestMarketFromGeoCountry(
    input.geoCountryHeader,
  );

  const fromProfile = tryMarketCode(input.profileMarket);
  const fromCookie = tryMarketCode(input.cookieMarket);
  const marketCode = fromProfile ?? fromCookie ?? HOME_MARKET_CODE;
  const explicit = Boolean(fromProfile || fromCookie);

  const market = marketRegistry.get(marketCode) ?? marketRegistry.getHomeMarket();
  const localeDef = resolveLocaleForMarket({
    marketDefaultLocale: market.defaultLocale,
    marketSupportedLocales: market.supportedLocales,
    userPreferredLocale: input.profileLocale ?? input.cookieLocale,
  });

  const currency =
    input.cookieCurrency?.trim().toUpperCase() ||
    market.defaultCurrency ||
    MARKET_DEFAULT_CURRENCY[marketCode as keyof typeof MARKET_DEFAULT_CURRENCY] ||
    "CZK";

  return {
    marketCode,
    locale: localeDef.locale,
    currency,
    explicit,
    suggestedMarketCode:
      suggestedMarketCode && suggestedMarketCode !== marketCode
        ? suggestedMarketCode
        : null,
  };
}

export function readGuestPrefsFromStorage(): {
  marketCode: string | null;
  locale: string | null;
  currency: string | null;
} {
  if (typeof window === "undefined") {
    return { marketCode: null, locale: null, currency: null };
  }
  try {
    return {
      marketCode: window.localStorage.getItem(MARKET_PREF_STORAGE_KEY),
      locale: window.localStorage.getItem(LOCALE_PREF_STORAGE_KEY),
      currency: window.localStorage.getItem(CURRENCY_PREF_STORAGE_KEY),
    };
  } catch {
    return { marketCode: null, locale: null, currency: null };
  }
}

export function writeGuestPrefsToStorage(pref: {
  marketCode: string;
  locale: string;
  currency: string;
}): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MARKET_PREF_STORAGE_KEY, pref.marketCode);
    window.localStorage.setItem(LOCALE_PREF_STORAGE_KEY, pref.locale);
    window.localStorage.setItem(CURRENCY_PREF_STORAGE_KEY, pref.currency);
  } catch {
    // private mode / quota — cookies remain source of truth
  }
}

export function htmlLangFromLocale(locale: string): string {
  return getLocaleDefinition(locale)?.htmlLang ?? languageFromLocale(locale);
}
