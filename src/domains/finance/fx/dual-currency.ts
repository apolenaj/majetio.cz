/**
 * Dual-currency display model (Prompt 17.2).
 * Primary = market/scenario currency; secondary = orientational conversion.
 */

import type { CurrencyCode } from "@/domains/finance/primitives/currency";
import type { Money } from "@/domains/finance/primitives/money";
import {
  convertMoneyWithSnapshot,
  identityExchangeRateSnapshot,
  invertSnapshot,
  normalizeExchangeRateSnapshot,
  type ExchangeRateSnapshot,
  type LegacyExchangeRateSnapshot,
} from "@/domains/finance/fx/exchange-rate";

export type DualCurrencyDisplay = {
  primary: {
    currency: CurrencyCode;
    amountMajor: number;
  };
  secondary: {
    currency: CurrencyCode;
    amountMajor: number;
    /** Frozen rate used for secondary — never live without snapshot. */
    snapshot: ExchangeRateSnapshot;
    /** Human disclaimer key / default copy. */
    disclaimerKey: "fx.orientational_only";
  } | null;
};

/**
 * Build dual display. Secondary omitted when currencies match or snapshot missing.
 */
export function buildDualCurrencyDisplay(input: {
  primary: Money;
  secondaryCurrency?: CurrencyCode | null;
  snapshot?: ExchangeRateSnapshot | LegacyExchangeRateSnapshot | null;
}): DualCurrencyDisplay {
  const primaryCurrency = input.primary.currency;
  const primaryMajor = input.primary.toMajorNumber();

  if (
    !input.secondaryCurrency ||
    input.secondaryCurrency === primaryCurrency ||
    !input.snapshot
  ) {
    return {
      primary: { currency: primaryCurrency, amountMajor: primaryMajor },
      secondary: null,
    };
  }

  const snapshot = normalizeExchangeRateSnapshot(input.snapshot);
  let working = snapshot;

  if (
    snapshot.baseCurrency === input.secondaryCurrency &&
    snapshot.quoteCurrency === primaryCurrency
  ) {
    working = invertSnapshot(snapshot);
  }

  if (
    working.baseCurrency !== primaryCurrency ||
    working.quoteCurrency !== input.secondaryCurrency
  ) {
    return {
      primary: { currency: primaryCurrency, amountMajor: primaryMajor },
      secondary: null,
    };
  }

  const converted = convertMoneyWithSnapshot({
    amount: input.primary,
    snapshot: working,
  });

  return {
    primary: { currency: primaryCurrency, amountMajor: primaryMajor },
    secondary: {
      currency: input.secondaryCurrency,
      amountMajor: converted.toMajorNumber(),
      snapshot: working,
      disclaimerKey: "fx.orientational_only",
    },
  };
}

export function dualCurrencyDisclaimerCs(snapshot: ExchangeRateSnapshot): string {
  const day = snapshot.observedAt.slice(0, 10);
  return `Orientační přepočet kurzem ${snapshot.rate} (${snapshot.baseCurrency}/${snapshot.quoteCurrency}) ze dne ${day} UTC. Nejde o nabídku směny.`;
}

export function dualCurrencyDisclaimerEn(snapshot: ExchangeRateSnapshot): string {
  const day = snapshot.observedAt.slice(0, 10);
  return `Indicative conversion at rate ${snapshot.rate} (${snapshot.baseCurrency}/${snapshot.quoteCurrency}) as of ${day} UTC. Not an FX offer.`;
}

export { identityExchangeRateSnapshot };
