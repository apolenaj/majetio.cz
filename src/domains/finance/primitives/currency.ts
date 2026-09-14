/**
 * ISO 4217 currency support for Money (Prompt 11A + 17.2).
 * Majetio.com markets: CZK, EUR, AED, SAR, IDR, USD (+ GBP/CHF legacy).
 */

export const CURRENCY_CODES = [
  "CZK",
  "EUR",
  "USD",
  "GBP",
  "CHF",
  "AED",
  "SAR",
  "IDR",
] as const;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];

/** Currencies required for Prompt 17.2 market expansion. */
export const MAJETIO_MARKET_CURRENCIES = [
  "CZK",
  "EUR",
  "AED",
  "SAR",
  "IDR",
  "USD",
] as const satisfies readonly CurrencyCode[];

/** Minor units (exponent) per ISO 4217. */
const MINOR_UNITS: Record<CurrencyCode, number> = {
  CZK: 2,
  EUR: 2,
  USD: 2,
  GBP: 2,
  CHF: 2,
  AED: 2,
  SAR: 2,
  /** ISO uses 2; UI often rounds to whole rupiah — scale stays 2 in engine. */
  IDR: 2,
};

export function isCurrencyCode(value: string): value is CurrencyCode {
  return (CURRENCY_CODES as readonly string[]).includes(value.toUpperCase());
}

export function assertCurrencyCode(value: string): CurrencyCode {
  const upper = value.toUpperCase();
  if (!isCurrencyCode(upper)) {
    throw new Error(`Unsupported currency code: ${value}`);
  }
  return upper;
}

/** Number of decimal digits for the currency's minor unit (e.g. 2 → haléře/cents). */
export function currencyMinorDigits(currency: CurrencyCode): number {
  return MINOR_UNITS[currency];
}

export function currencyScaleFactor(currency: CurrencyCode): number {
  return 10 ** currencyMinorDigits(currency);
}

/**
 * Financial Engine rule (17.2): every calculation scenario has exactly one baseCurrency.
 * Mixing currencies without an ExchangeRateSnapshot is forbidden.
 */
export function assertSameCurrency(
  a: CurrencyCode,
  b: CurrencyCode,
  context = "money operation",
): void {
  if (a !== b) {
    throw new Error(
      `Currency mix forbidden without FX conversion (${context}): ${a} vs ${b}`,
    );
  }
}
