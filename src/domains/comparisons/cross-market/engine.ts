/**
 * Cross-Market Comparison Engine interface (Prompt 17.5).
 * Normalizes currency, costs, financing & risks across markets (e.g. Praha vs Dubai).
 */

import type { CurrencyCode, ExchangeRateSnapshot } from "@/domains/finance";
import { Money, convertMoneyWithSnapshot } from "@/domains/finance";
import type { ComparisonWarning } from "@/domains/comparisons/types";

export type CrossMarketPropertySide = {
  propertyId: string;
  title: string;
  marketCode: string;
  currency: CurrencyCode;
  /** Asking price in listing currency (minor). */
  askingPriceMinor: number | null;
  /** Buyer closing costs estimate in listing currency (minor). */
  transactionCostsMinor: number | null;
  /** Illustrative monthly financing payment in listing currency. */
  monthlyFinancingMinor: number | null;
  grossYieldPct: number | null;
  /** Regulatory / tenure risk tags. */
  riskTags: string[];
};

export type NormalizedCrossMarketMetrics = {
  propertyId: string;
  marketCode: string;
  sourceCurrency: CurrencyCode;
  displayCurrency: CurrencyCode;
  askingPriceDisplayMinor: number | null;
  transactionCostsDisplayMinor: number | null;
  monthlyFinancingDisplayMinor: number | null;
  grossYieldPct: number | null;
  riskTags: string[];
};

export type CrossMarketComparisonInput = {
  left: CrossMarketPropertySide;
  right: CrossMarketPropertySide;
  /** User / scenario display currency. */
  displayCurrency: CurrencyCode;
  /**
   * Frozen FX snapshots to convert each side → displayCurrency.
   * Keyed by `${from}->${to}` e.g. "AED->CZK".
   */
  fxSnapshots: Record<string, ExchangeRateSnapshot>;
};

export type CrossMarketComparisonResult = {
  sameMarket: boolean;
  fxExposure: boolean;
  fxExposureSeverity: "none" | "info" | "warning";
  left: NormalizedCrossMarketMetrics;
  right: NormalizedCrossMarketMetrics;
  warnings: ComparisonWarning[];
  /** Disclaimer when FX used. */
  fxDisclaimerEn: string | null;
};

function fxKey(from: CurrencyCode, to: CurrencyCode): string {
  return `${from}->${to}`;
}

function convertMinor(
  amountMinor: number | null,
  from: CurrencyCode,
  to: CurrencyCode,
  snapshots: Record<string, ExchangeRateSnapshot>,
): { value: number | null; usedFx: boolean; error?: string } {
  if (amountMinor == null) return { value: null, usedFx: false };
  if (from === to) return { value: amountMinor, usedFx: false };
  const snap = snapshots[fxKey(from, to)];
  if (!snap) {
    return {
      value: null,
      usedFx: true,
      error: `Missing FX snapshot ${from}->${to}`,
    };
  }
  try {
    const converted = convertMoneyWithSnapshot({
      amount: Money.fromMinor(amountMinor, from),
      snapshot: snap,
    });
    return {
      value: Number(converted.toMinorInteger()),
      usedFx: true,
    };
  } catch (err) {
    return {
      value: null,
      usedFx: true,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function normalizeSide(
  side: CrossMarketPropertySide,
  displayCurrency: CurrencyCode,
  snapshots: Record<string, ExchangeRateSnapshot>,
): {
  metrics: NormalizedCrossMarketMetrics;
  usedFx: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  let usedFx = false;

  const ask = convertMinor(
    side.askingPriceMinor,
    side.currency,
    displayCurrency,
    snapshots,
  );
  const tx = convertMinor(
    side.transactionCostsMinor,
    side.currency,
    displayCurrency,
    snapshots,
  );
  const fin = convertMinor(
    side.monthlyFinancingMinor,
    side.currency,
    displayCurrency,
    snapshots,
  );

  for (const part of [ask, tx, fin]) {
    if (part.usedFx) usedFx = true;
    if (part.error) errors.push(part.error);
  }

  return {
    usedFx,
    errors,
    metrics: {
      propertyId: side.propertyId,
      marketCode: side.marketCode,
      sourceCurrency: side.currency,
      displayCurrency,
      askingPriceDisplayMinor: ask.value,
      transactionCostsDisplayMinor: tx.value,
      monthlyFinancingDisplayMinor: fin.value,
      grossYieldPct: side.grossYieldPct,
      riskTags: side.riskTags,
    },
  };
}

/**
 * Compare two properties that may sit in different markets.
 * Always sets fxExposure when currencies or markets differ.
 */
export function compareAcrossMarkets(
  input: CrossMarketComparisonInput,
): CrossMarketComparisonResult {
  const sameMarket =
    input.left.marketCode.toUpperCase() ===
    input.right.marketCode.toUpperCase();
  const sameCurrency = input.left.currency === input.right.currency;

  const leftN = normalizeSide(
    input.left,
    input.displayCurrency,
    input.fxSnapshots,
  );
  const rightN = normalizeSide(
    input.right,
    input.displayCurrency,
    input.fxSnapshots,
  );

  const warnings: ComparisonWarning[] = [];
  const fxExposure = !sameMarket || !sameCurrency || leftN.usedFx || rightN.usedFx;

  let fxExposureSeverity: "none" | "info" | "warning" = "none";
  let fxDisclaimerEn: string | null = null;

  if (fxExposure) {
    fxExposureSeverity = sameMarket && sameCurrency ? "info" : "warning";
    fxDisclaimerEn =
      "FX exposure: prices and costs were converted using a frozen exchange-rate snapshot. Currency moves can change relative attractiveness — this is not a forecast.";
    warnings.push({
      id: "cross-market-fx-exposure",
      severity: fxExposureSeverity === "warning" ? "warning" : "info",
      title: "FX exposure",
      body: fxDisclaimerEn,
    });
  }

  if (!sameMarket) {
    warnings.push({
      id: "cross-market-regulatory",
      severity: "warning",
      title: "Different markets / regulatory regimes",
      body: "Tenure, taxes, financing eligibility and transaction costs differ by market. Normalize carefully — this is not an apples-to-apples legal comparison.",
    });
  }

  for (const err of [...leftN.errors, ...rightN.errors]) {
    warnings.push({
      id: "cross-market-fx-missing",
      severity: "warning",
      title: "Incomplete FX normalization",
      body: err,
    });
  }

  const leftRisks = new Set(input.left.riskTags.map((t) => t.toLowerCase()));
  const rightRisks = new Set(input.right.riskTags.map((t) => t.toLowerCase()));
  const riskOverlap = [...leftRisks].some((r) => rightRisks.has(r));
  if (!riskOverlap && (leftRisks.size > 0 || rightRisks.size > 0)) {
    warnings.push({
      id: "cross-market-risk-profile",
      severity: "info",
      title: "Divergent risk profiles",
      body: "Risk tags do not overlap — review tenure, liquidity and STR rules separately per market.",
    });
  }

  return {
    sameMarket,
    fxExposure,
    fxExposureSeverity,
    left: leftN.metrics,
    right: rightN.metrics,
    warnings,
    fxDisclaimerEn,
  };
}

/** Detect whether a comparison set needs FX exposure flagging. */
export function shouldFlagFxExposure(input: {
  marketCodes: readonly string[];
  currencies: readonly string[];
}): boolean {
  const markets = new Set(input.marketCodes.map((m) => m.toUpperCase()));
  const currencies = new Set(input.currencies.map((c) => c.toUpperCase()));
  return markets.size > 1 || currencies.size > 1;
}
