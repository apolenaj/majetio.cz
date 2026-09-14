/**
 * Wire existing comparison warnings with cross-market FX exposure (Prompt 17.5).
 */

import type { ComparisonWarning } from "@/domains/comparisons/types";
import { shouldFlagFxExposure } from "@/domains/comparisons/cross-market/engine";

export type CrossMarketWarningInput = {
  marketCodes: readonly string[];
  currencies: readonly string[];
};

/**
 * Append FX / cross-market warnings to an existing warning list.
 */
export function appendCrossMarketWarnings(
  existing: ComparisonWarning[],
  input: CrossMarketWarningInput,
): ComparisonWarning[] {
  if (!shouldFlagFxExposure(input)) return existing;

  const markets = new Set(input.marketCodes.map((m) => m.toUpperCase()));
  const next = [...existing];

  next.push({
    id: "cross-market-fx-exposure",
    severity: markets.size > 1 ? "warning" : "info",
    title: "FX exposure",
    body: "This comparison spans currencies and/or markets. Relative prices move with FX — use a frozen exchange-rate snapshot and treat rankings as orientational.",
  });

  if (markets.size > 1) {
    next.push({
      id: "cross-market-regulatory",
      severity: "warning",
      title: "Cross-market comparison",
      body: "Regulatory, tax and financing rules differ by market. Do not assume Czech mortgage or tax logic applies abroad.",
    });
  }

  return next;
}
