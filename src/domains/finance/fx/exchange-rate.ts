/**
 * FX / ExchangeRateSnapshot (Prompt 17.2).
 *
 * Historical calculations MUST pin the rate they used.
 * Never recompute past scenarios when live FX moves.
 */

import Decimal from "decimal.js";

import {
  assertCurrencyCode,
  assertSameCurrency,
  type CurrencyCode,
} from "@/domains/finance/primitives/currency";
import { Money } from "@/domains/finance/primitives/money";
import { toDecimal } from "@/domains/finance/primitives/rounding";

export type ExchangeRateSource =
  | "identity"
  | "manual"
  | "ecb"
  | "cnb"
  | "provider"
  | "scenario_freeze"
  | string;

/**
 * Canonical FX snapshot — pair is base → quote (units of quote per 1 base).
 * Naming aligned with Prompt 17.2: baseCurrency, quoteCurrency, rate, source, observedAt.
 */
export type ExchangeRateSnapshot = {
  baseCurrency: CurrencyCode;
  quoteCurrency: CurrencyCode;
  /** Units of quoteCurrency per 1 unit of baseCurrency (decimal string). */
  rate: string;
  source: ExchangeRateSource;
  /** ISO-8601 UTC instant when the rate was observed. */
  observedAt: string;
  /** Optional provider id / batch key. */
  providerRef?: string | null;
};

/** Legacy scenario JSON shape (fromCurrency/toCurrency/asOf) — still accepted. */
export type LegacyExchangeRateSnapshot = {
  fromCurrency: string;
  toCurrency: string;
  rate: string;
  source: string;
  asOf: string;
};

export function isLegacyExchangeRateSnapshot(
  value: unknown,
): value is LegacyExchangeRateSnapshot {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    "fromCurrency" in (value as object) &&
    "toCurrency" in (value as object) &&
    "asOf" in (value as object)
  );
}

export function normalizeExchangeRateSnapshot(
  raw: ExchangeRateSnapshot | LegacyExchangeRateSnapshot,
): ExchangeRateSnapshot {
  if (isLegacyExchangeRateSnapshot(raw) && !("baseCurrency" in raw)) {
    return {
      baseCurrency: assertCurrencyCode(raw.fromCurrency),
      quoteCurrency: assertCurrencyCode(raw.toCurrency),
      rate: raw.rate,
      source: raw.source,
      observedAt: raw.asOf,
    };
  }
  const s = raw as ExchangeRateSnapshot;
  return {
    baseCurrency: assertCurrencyCode(s.baseCurrency),
    quoteCurrency: assertCurrencyCode(s.quoteCurrency),
    rate: s.rate,
    source: s.source,
    observedAt: s.observedAt,
    providerRef: s.providerRef ?? null,
  };
}

/** Back-compat for scenario code that still expects from/to/asOf. */
export function toLegacyExchangeRateSnapshot(
  snapshot: ExchangeRateSnapshot,
): LegacyExchangeRateSnapshot {
  return {
    fromCurrency: snapshot.baseCurrency,
    toCurrency: snapshot.quoteCurrency,
    rate: snapshot.rate,
    source: String(snapshot.source),
    asOf: snapshot.observedAt,
  };
}

export function identityExchangeRateSnapshot(
  currency: CurrencyCode,
  observedAt = new Date().toISOString(),
): ExchangeRateSnapshot {
  return {
    baseCurrency: currency,
    quoteCurrency: currency,
    rate: "1",
    source: "identity",
    observedAt,
  };
}

export function assertValidExchangeRateSnapshot(
  snapshot: ExchangeRateSnapshot,
): void {
  const rate = toDecimal(snapshot.rate);
  if (!rate.isFinite() || rate.lte(0)) {
    throw new Error("Invalid exchange rate in snapshot (must be > 0).");
  }
  assertCurrencyCode(snapshot.baseCurrency);
  assertCurrencyCode(snapshot.quoteCurrency);
  if (!snapshot.observedAt || Number.isNaN(Date.parse(snapshot.observedAt))) {
    throw new Error("ExchangeRateSnapshot.observedAt must be a valid ISO UTC time.");
  }
}

/**
 * Convert Money using a frozen snapshot into quoteCurrency.
 * Never uses live FX — caller must supply the pinned snapshot.
 */
export function convertMoneyWithSnapshot(input: {
  amount: Money;
  snapshot: ExchangeRateSnapshot | LegacyExchangeRateSnapshot;
}): Money {
  const snapshot = normalizeExchangeRateSnapshot(input.snapshot);
  assertValidExchangeRateSnapshot(snapshot);

  if (input.amount.currency === snapshot.quoteCurrency) {
    if (snapshot.baseCurrency === snapshot.quoteCurrency) {
      return input.amount;
    }
    // Already in quote — only valid if amount currency matches quote
    return input.amount;
  }

  if (input.amount.currency !== snapshot.baseCurrency) {
    throw new Error(
      `Snapshot base ${snapshot.baseCurrency} does not match amount currency ${input.amount.currency}`,
    );
  }

  const rate = toDecimal(snapshot.rate);
  const major = input.amount.major.mul(rate);
  return Money.fromMajor(major.toString(), snapshot.quoteCurrency);
}

/**
 * Scenario helper: amount in fromCurrency → baseCurrency via snapshot.
 */
export function convertMajorToBaseWithSnapshot(input: {
  amountMajor: number;
  fromCurrency: string;
  baseCurrency: string;
  snapshot: ExchangeRateSnapshot | LegacyExchangeRateSnapshot;
}): {
  amountMajorInBase: number;
  snapshot: ExchangeRateSnapshot;
} {
  const base = assertCurrencyCode(input.baseCurrency);
  const from = assertCurrencyCode(input.fromCurrency);
  if (from === base) {
    return {
      amountMajorInBase: input.amountMajor,
      snapshot: identityExchangeRateSnapshot(base, normalizeExchangeRateSnapshot(input.snapshot).observedAt),
    };
  }

  const snapshot = normalizeExchangeRateSnapshot(input.snapshot);
  if (snapshot.baseCurrency !== from || snapshot.quoteCurrency !== base) {
    throw new Error("Exchange-rate snapshot does not match conversion pair");
  }
  assertValidExchangeRateSnapshot(snapshot);
  const money = Money.fromMajor(input.amountMajor, from);
  const converted = convertMoneyWithSnapshot({ amount: money, snapshot });
  return {
    amountMajorInBase: converted.toMajorNumber(),
    snapshot,
  };
}

/**
 * Guard for engine entry: all Money inputs must share baseCurrency
 * unless an explicit conversion path is provided.
 */
export function assertCalculationBaseCurrency(input: {
  baseCurrency: CurrencyCode;
  amounts: Money[];
}): void {
  for (const m of input.amounts) {
    assertSameCurrency(input.baseCurrency, m.currency, "calculation baseCurrency");
  }
}

export function invertSnapshot(
  snapshot: ExchangeRateSnapshot,
): ExchangeRateSnapshot {
  assertValidExchangeRateSnapshot(snapshot);
  if (snapshot.baseCurrency === snapshot.quoteCurrency) return snapshot;
  const rate = new Decimal(1).div(toDecimal(snapshot.rate));
  return {
    baseCurrency: snapshot.quoteCurrency,
    quoteCurrency: snapshot.baseCurrency,
    rate: rate.toFixed(12),
    source: snapshot.source,
    observedAt: snapshot.observedAt,
    providerRef: snapshot.providerRef,
  };
}
