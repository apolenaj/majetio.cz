/**
 * Success-fee packages from „Realitní inzertní systém“.
 * Configuration + non-binding engagement only — no automatic billing.
 */

export type SuccessFeeActor =
  | "broker"
  | "agency"
  | "developer"
  | "private"
  | "company";

export type SuccessFeeTier = "basic" | "plus" | "premium";

export type SaleSuccessFeeRate = {
  actor: SuccessFeeActor;
  tier: SuccessFeeTier;
  /** Percent of sale price (document default). */
  ratePct: number;
  /** Lower bound when document gives a range (premium company). */
  ratePctMax?: number;
  noteCs?: string;
};

export type RentSuccessFeePackage = {
  tier: SuccessFeeTier | "management";
  ratePct: number;
  ratePctMax?: number;
  labelCs: string;
  noteCs: string;
};

/** Sale packages — document defaults. */
export const SALE_SUCCESS_FEE_RATES: readonly SaleSuccessFeeRate[] = [
  { actor: "broker", tier: "basic", ratePct: 1 },
  { actor: "broker", tier: "plus", ratePct: 1.2 },
  { actor: "broker", tier: "premium", ratePct: 1.75 },
  {
    actor: "agency",
    tier: "basic",
    ratePct: 0.5,
    noteCs: "Podmínky hromadné spolupráce dle smlouvy / dokumentu.",
  },
  { actor: "agency", tier: "plus", ratePct: 1 },
  { actor: "agency", tier: "premium", ratePct: 1.25 },
  { actor: "developer", tier: "basic", ratePct: 3 },
  { actor: "developer", tier: "plus", ratePct: 5 },
  { actor: "developer", tier: "premium", ratePct: 7.5 },
  { actor: "private", tier: "basic", ratePct: 2 },
  { actor: "private", tier: "plus", ratePct: 2.5 },
  { actor: "private", tier: "premium", ratePct: 3 },
  { actor: "company", tier: "basic", ratePct: 1.5 },
  { actor: "company", tier: "plus", ratePct: 2 },
  {
    actor: "company",
    tier: "premium",
    ratePct: 5,
    ratePctMax: 15,
    noteCs: "Rozpětí podle projektu — vyžaduje individuální sjednání.",
  },
] as const;

export const RENT_SUCCESS_FEE_PACKAGES: readonly RentSuccessFeePackage[] = [
  {
    tier: "basic",
    ratePct: 10,
    labelCs: "Pronájem Základní",
    noteCs: "Základ odměny (měsíční nájem vs. jiný) — otevřená otázka.",
  },
  {
    tier: "plus",
    ratePct: 25,
    labelCs: "Pronájem Plus",
    noteCs: "Základ odměny — otevřená otázka.",
  },
  {
    tier: "premium",
    ratePct: 50,
    labelCs: "Pronájem Premium",
    noteCs: "Základ odměny — otevřená otázka.",
  },
  {
    tier: "management",
    ratePct: 15,
    ratePctMax: 20,
    labelCs: "Správa nájmu",
    noteCs: "15–20 % měsíčního nájmu.",
  },
] as const;

export const SUCCESS_FEE_BILLING_ENABLED = false;

export const ACTOR_LABELS_CS: Record<SuccessFeeActor, string> = {
  broker: "Samostatný makléř",
  agency: "Realitní kancelář",
  developer: "Developer",
  private: "Soukromý uživatel",
  company: "Firma",
};

export const TIER_LABELS_CS: Record<SuccessFeeTier, string> = {
  basic: "Základní",
  plus: "Plus",
  premium: "Premium",
};

export function formatRatePct(rate: SaleSuccessFeeRate | RentSuccessFeePackage): string {
  if (rate.ratePctMax != null) {
    return `${rate.ratePct}–${rate.ratePctMax} %`;
  }
  return `${rate.ratePct} %`;
}
