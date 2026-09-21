/**
 * Orientational FX for foreign listing display.
 * Not a live feed — always labelled as approximate.
 */

export const FOREIGN_FX_ASSUMPTIONS = {
  asOf: "2026-09-01",
  sourceLabel: "Orientační referenční kurz Majetio",
  ratesToCzk: {
    EUR: 25,
    AED: 6.5,
    USD: 23,
  },
} as const;

export type ForeignCurrencyCode = keyof typeof FOREIGN_FX_ASSUMPTIONS.ratesToCzk;

export function approximateCzkFromLocal(input: {
  amount: number;
  currency: string;
}): { czk: number; rate: number; asOf: string; sourceLabel: string } | null {
  const code = input.currency.toUpperCase() as ForeignCurrencyCode;
  const rate = FOREIGN_FX_ASSUMPTIONS.ratesToCzk[code];
  if (!rate || !Number.isFinite(input.amount) || input.amount <= 0) return null;
  return {
    czk: Math.round(input.amount * rate),
    rate,
    asOf: FOREIGN_FX_ASSUMPTIONS.asOf,
    sourceLabel: FOREIGN_FX_ASSUMPTIONS.sourceLabel,
  };
}
