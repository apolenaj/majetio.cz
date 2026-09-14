/**
 * International cache keys (Rule 208).
 * CDN / internal caches MUST include market, locale, currency, version.
 */

export const INTERNATIONAL_CACHE_VERSION =
  process.env.NEXT_PUBLIC_I18N_CACHE_VERSION ?? "2026.07.21";

export type InternationalCacheKeyParts = {
  market: string;
  locale: string;
  currency: string;
  /** Optional resource discriminator (route, entity id, …). */
  resource?: string;
  version?: string;
};

/**
 * Stable cache key segment — never omit market/locale/currency/version.
 */
export function buildInternationalCacheKey(
  parts: InternationalCacheKeyParts,
): string {
  const market = parts.market.trim().toUpperCase() || "CZ";
  const locale = parts.locale.trim() || "cs-CZ";
  const currency = parts.currency.trim().toUpperCase() || "CZK";
  const version = parts.version ?? INTERNATIONAL_CACHE_VERSION;
  const resource = parts.resource?.trim() || "root";
  return [
    "m",
    market,
    "l",
    locale,
    "c",
    currency,
    "v",
    version,
    "r",
    resource,
  ].join(":");
}

/** HTTP header / Vary-friendly token list. */
export function internationalCacheVaryHeaders(): string[] {
  return [
    "x-majetio-market",
    "x-majetio-locale",
    "x-majetio-currency",
    "x-majetio-cache-version",
  ];
}
