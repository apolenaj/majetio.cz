/**
 * Central rounding policy (Prompt 11A Phase 1 — points ~88–91).
 *
 * Internal engine math keeps high precision; display/storage snaps to
 * currency minor units or human percent-point scales.
 */

import { Decimal } from "decimal.js";

import {
  currencyMinorDigits,
  type CurrencyCode,
} from "./currency";

/** Shared Decimal defaults for domain math. */
export const DECIMAL_CONFIG = {
  precision: 28,
  rounding: Decimal.ROUND_HALF_EVEN,
} as const;

Decimal.set({
  precision: DECIMAL_CONFIG.precision,
  rounding: DECIMAL_CONFIG.rounding,
});

/**
 * Canonical Majetio rounding rules.
 * Do not scatter ad-hoc `Math.round` in calculation engines.
 */
export const ROUNDING_POLICY = {
  /**
   * Working precision for intermediate engine results (ratio / money intermediates).
   * Not for end-user display.
   */
  internal: {
    decimalPlaces: 10,
    mode: Decimal.ROUND_HALF_EVEN,
  },
  /**
   * Money shown in UI or persisted as whole minor units (haléře / cents).
   * Half-up matches common CZ retail / asking-price expectations.
   */
  moneyDisplay: {
    mode: Decimal.ROUND_HALF_UP,
  },
  /**
   * Percent points for UI (e.g. yield 5.4 %).
   */
  percentDisplay: {
    decimalPlaces: 1,
    mode: Decimal.ROUND_HALF_UP,
  },
  /**
   * Rate inputs / APR display often use 2 percent-point decimals (e.g. 5.25 %).
   */
  rateDisplay: {
    decimalPlaces: 2,
    mode: Decimal.ROUND_HALF_UP,
  },
} as const;

export type RoundingMode = Decimal.Rounding;

export function toDecimal(
  value: Decimal.Value,
  errorLabel = "value",
): Decimal {
  try {
    const d = new Decimal(value);
    if (!d.isFinite()) {
      throw new Error("not finite");
    }
    return d;
  } catch {
    throw new Error(`Invalid decimal ${errorLabel}: ${String(value)}`);
  }
}

/** Round intermediate calculation value (high precision, banker's half-even). */
export function roundInternal(value: Decimal.Value): Decimal {
  return toDecimal(value).toDecimalPlaces(
    ROUNDING_POLICY.internal.decimalPlaces,
    ROUNDING_POLICY.internal.mode,
  );
}

/** Round major currency amount to minor-unit grid for display/storage. */
export function roundMoneyMajorForDisplay(
  majorAmount: Decimal.Value,
  currency: CurrencyCode,
): Decimal {
  return toDecimal(majorAmount).toDecimalPlaces(
    currencyMinorDigits(currency),
    ROUNDING_POLICY.moneyDisplay.mode,
  );
}

/** Round ratio → percent points for display (e.g. 0.054 → 5.4). */
export function roundPercentPointsForDisplay(
  percentPoints: Decimal.Value,
): Decimal {
  return toDecimal(percentPoints).toDecimalPlaces(
    ROUNDING_POLICY.percentDisplay.decimalPlaces,
    ROUNDING_POLICY.percentDisplay.mode,
  );
}

/** Round ratio → rate percent points for display (e.g. 5.25 %). */
export function roundRatePercentPointsForDisplay(
  percentPoints: Decimal.Value,
): Decimal {
  return toDecimal(percentPoints).toDecimalPlaces(
    ROUNDING_POLICY.rateDisplay.decimalPlaces,
    ROUNDING_POLICY.rateDisplay.mode,
  );
}
