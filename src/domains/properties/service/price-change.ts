/**
 * Derive asking-price change from PropertyPriceHistory (Prompt 9 Part 2).
 * Never invent history — return null when insufficient points.
 */

import type { PublicPriceHistoryPoint } from "@/domains/properties/service/dto";

export type PriceDecreaseSummary = {
  previousAmount: number;
  currentAmount: number;
  deltaAmount: number;
  deltaPercent: number;
};

/**
 * If the latest point is a decrease vs the previous observed amount, summarize it.
 */
export function derivePriceDecrease(
  points: PublicPriceHistoryPoint[],
  currentAskingPrice: number | null | undefined,
): PriceDecreaseSummary | null {
  if (!points.length) return null;

  const sorted = [...points].sort(
    (a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime(),
  );

  const latest = sorted[sorted.length - 1]!;
  const previous = sorted.length >= 2 ? sorted[sorted.length - 2]! : null;

  const current =
    currentAskingPrice != null && Number.isFinite(currentAskingPrice)
      ? currentAskingPrice
      : latest.amount;

  // Prefer explicit DECREASED with a prior point
  if (previous && latest.changeType === "DECREASED" && latest.amount < previous.amount) {
    const deltaAmount = latest.amount - previous.amount;
    const deltaPercent = (deltaAmount / previous.amount) * 100;
    return {
      previousAmount: previous.amount,
      currentAmount: latest.amount,
      deltaAmount,
      deltaPercent,
    };
  }

  // Or any last two points where price fell (even without changeType)
  if (previous && current < previous.amount) {
    const deltaAmount = current - previous.amount;
    const deltaPercent = (deltaAmount / previous.amount) * 100;
    return {
      previousAmount: previous.amount,
      currentAmount: current,
      deltaAmount,
      deltaPercent,
    };
  }

  return null;
}
