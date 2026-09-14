/**
 * Exchange-rate snapshot for multi-currency inputs → scenario base currency.
 * Canonical implementation: `@/domains/finance/fx` (Prompt 17.2).
 * This module keeps scenario back-compat (fromCurrency/toCurrency/asOf).
 */

import {
  convertMajorToBaseWithSnapshot as convertMajor,
  normalizeExchangeRateSnapshot,
  toLegacyExchangeRateSnapshot,
  type ExchangeRateSnapshot as CanonicalSnapshot,
  type LegacyExchangeRateSnapshot,
} from "@/domains/finance/fx";

/** @deprecated Prefer CanonicalSnapshot from finance/fx — kept for scenario JSON. */
export type ExchangeRateSnapshot = LegacyExchangeRateSnapshot;

export type CurrencyConversionResult = {
  amountMajorInBase: number;
  snapshot: ExchangeRateSnapshot;
};

/**
 * Convert major amount using a frozen snapshot (never live FX without snapshot).
 * Historical scenarios must keep the snapshot they were created with.
 */
export function convertWithSnapshot(input: {
  amountMajor: number;
  fromCurrency: string;
  baseCurrency: string;
  snapshot: ExchangeRateSnapshot | CanonicalSnapshot;
}): CurrencyConversionResult {
  const result = convertMajor({
    amountMajor: input.amountMajor,
    fromCurrency: input.fromCurrency,
    baseCurrency: input.baseCurrency,
    snapshot: input.snapshot,
  });
  return {
    amountMajorInBase: result.amountMajorInBase,
    snapshot: toLegacyExchangeRateSnapshot(
      normalizeExchangeRateSnapshot(result.snapshot),
    ),
  };
}
