/**
 * Client-safe Financial Passport projection — Privacy-by-Default for RSC→client.
 * Exact CZK amounts stay server-only unless the owner is editing the form.
 */

import type { PassportState } from "@/lib/financial-passport/types";
import { percentBucket } from "@/lib/analytics/events";

export type ClientSafePassportSummary = {
  /** Never includes exact CZK fields. */
  hasIncome: boolean;
  hasLiabilities: boolean;
  hasEquity: boolean;
  hasMaxPrice: boolean;
  financingMode: string | null;
  goal: string | null;
  preferredCity: string;
  regions: string[];
  propertyTypes: string[];
  dispositions: string[];
  /** Coarse buckets for UI — not exact amounts. */
  incomeBucket: ReturnType<typeof percentBucket> | "unknown";
  completionPercent: number;
  timestamps: PassportState["timestamps"];
};

function amountPresent(n: number | null | undefined): boolean {
  return typeof n === "number" && Number.isFinite(n) && n > 0;
}

/**
 * Strip exact financial amounts before passing props into Client Components
 * that only need readiness / match signals (not the edit form).
 */
export function toClientSafePassportSummary(
  state: PassportState,
  completionPercent = 0,
): ClientSafePassportSummary {
  return {
    hasIncome: amountPresent(state.monthlyIncomeCzk),
    hasLiabilities: amountPresent(state.monthlyLiabilitiesCzk),
    hasEquity: amountPresent(state.availableEquityCzk),
    hasMaxPrice: amountPresent(state.maxPriceCzk),
    financingMode: state.financingMode,
    goal: state.goal,
    preferredCity: state.preferredCity,
    regions: [...state.regions],
    propertyTypes: [...state.propertyTypes],
    dispositions: [...state.dispositions],
    incomeBucket: amountPresent(state.monthlyIncomeCzk)
      ? percentBucket(
          Math.min(100, Math.round((state.monthlyIncomeCzk! / 150_000) * 100)),
        )
      : "unknown",
    completionPercent,
    timestamps: state.timestamps,
  };
}

/** Keys that must never appear on public/shared RSC payloads. */
export const PASSPORT_SECRET_KEYS = [
  "monthlyIncomeCzk",
  "monthlyLiabilitiesCzk",
  "availableEquityCzk",
  "equityPercent",
  "maxPriceCzk",
  "targetCashFlowMonthlyCzk",
  "creditScoreBand",
] as const;

export function assertNoPassportSecretsInPayload(payload: unknown): void {
  const raw = JSON.stringify(payload);
  for (const key of PASSPORT_SECRET_KEYS) {
    if (raw.includes(`"${key}"`)) {
      throw new Error(
        `Privacy-by-Default: forbidden passport key "${key}" in client payload`,
      );
    }
  }
}
