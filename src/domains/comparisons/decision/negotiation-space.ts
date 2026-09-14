/**
 * Negotiation space: asking vs modeled max offer + DOM / price-drop drivers (BOD 93, 94).
 * Missing inputs → nulls, never fake 0 gap.
 */

import type { NegotiationSpaceMetrics } from "./types";

export function computeDaysOnMarket(
  publishedAt: Date | string | null | undefined,
  now = new Date(),
): number | null {
  if (!publishedAt) return null;
  const start = typeof publishedAt === "string" ? new Date(publishedAt) : publishedAt;
  if (Number.isNaN(start.getTime())) return null;
  const days = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  return days >= 0 ? days : null;
}

export function computeNegotiationSpace(input: {
  askingPriceCzk: number | null;
  originalAskingPriceCzk?: number | null;
  modeledMaxOfferCzk: number | null;
  daysOnMarket: number | null;
  recentPriceDropCzk?: number | null;
}): NegotiationSpaceMetrics {
  const asking = input.askingPriceCzk;
  const maxOffer = input.modeledMaxOfferCzk;

  let gapCzk: number | null = null;
  let gapPct: number | null = null;
  if (asking != null && maxOffer != null && asking > 0) {
    gapCzk = asking - maxOffer;
    gapPct = Math.round((gapCzk / asking) * 10_000) / 100;
  }

  const dropFromOriginal =
    asking != null &&
    input.originalAskingPriceCzk != null &&
    input.originalAskingPriceCzk > asking
      ? input.originalAskingPriceCzk - asking
      : null;

  const recentDrop =
    input.recentPriceDropCzk != null && input.recentPriceDropCzk > 0
      ? input.recentPriceDropCzk
      : dropFromOriginal;

  const summaryCs = buildNegotiationSummary({
    asking,
    maxOffer,
    gapCzk,
    gapPct,
    daysOnMarket: input.daysOnMarket,
    recentPriceDropCzk: recentDrop,
  });

  return {
    askingPriceCzk: asking,
    modeledMaxOfferCzk: maxOffer,
    gapCzk,
    gapPct,
    daysOnMarket: input.daysOnMarket,
    recentPriceDropCzk: recentDrop,
    summaryCs,
  };
}

function buildNegotiationSummary(input: {
  asking: number | null;
  maxOffer: number | null;
  gapCzk: number | null;
  gapPct: number | null;
  daysOnMarket: number | null;
  recentPriceDropCzk: number | null;
}): string | null {
  if (input.asking == null && input.maxOffer == null) return null;

  const parts: string[] = [];
  if (input.gapCzk != null && input.gapPct != null) {
    if (input.gapCzk > 0) {
      parts.push(
        `Asking je o ${Math.round(input.gapCzk).toLocaleString("cs-CZ")} Kč (${input.gapPct} %) nad modelovaným maximem — prostor pro slevu.`,
      );
    } else if (input.gapCzk < 0) {
      parts.push(
        `Asking je pod modelovaným maximem o ${Math.round(Math.abs(input.gapCzk)).toLocaleString("cs-CZ")} Kč — vyjednávací prostor je omezený.`,
      );
    } else {
      parts.push("Asking je na modelovaném maximu.");
    }
  } else if (input.asking != null && input.maxOffer == null) {
    parts.push("Modelované maximum nabídky zatím není k dispozici.");
  }

  if (input.daysOnMarket != null && input.daysOnMarket >= 45) {
    parts.push(
      `Nabídka je na trhu ${input.daysOnMarket} dní — delší DOM často zlepšuje vyjednávací pozici.`,
    );
  } else if (input.daysOnMarket != null && input.daysOnMarket >= 21) {
    parts.push(`Na trhu ${input.daysOnMarket} dní.`);
  }

  if (input.recentPriceDropCzk != null && input.recentPriceDropCzk > 0) {
    parts.push(
      `Cena už klesla o ${Math.round(input.recentPriceDropCzk).toLocaleString("cs-CZ")} Kč — další sleva je možná, ale ne jistá.`,
    );
  }

  return parts.length ? parts.join(" ") : null;
}

/**
 * Conservative modeled max from valuation mid when renovation max offer missing.
 * Uses mid − buffer; returns null when valuation missing.
 */
export function modeledMaxFromValuation(
  valuationMidCzk: number | null,
  bufferPct = 0.05,
): number | null {
  if (valuationMidCzk == null || valuationMidCzk <= 0) return null;
  return Math.round(valuationMidCzk * (1 - bufferPct));
}
