/**
 * Market opportunity insight — strictly data-backed from percentiles / diffs.
 * Never invents narrative without numbers.
 */

import type { MarketPercentileResult } from "@/domains/locations/integration/market-percentiles";

export type MarketOpportunityInsight = {
  available: boolean;
  /** Czech sentence grounded in percentile / sample — empty when unavailable. */
  text: string | null;
  code:
    | "price_upper_quartile"
    | "price_lower_quartile"
    | "price_around_median"
    | "rent_upper_quartile"
    | "rent_lower_quartile"
    | null;
  purchasePercentile: number | null;
  rentPercentile: number | null;
  sampleCount: number | null;
  suppressReason: string | null;
};

function formatPct(p: number): string {
  return `${Math.round(p)}`;
}

/**
 * Build insight from statistically valid percentiles only.
 */
export function buildMarketOpportunityInsight(input: {
  purchase: MarketPercentileResult;
  rent: MarketPercentileResult;
  segmentLabel: string;
  locationLabel: string;
}): MarketOpportunityInsight {
  const { purchase, rent, segmentLabel, locationLabel } = input;

  if (purchase.statisticallyValid && purchase.percentile != null) {
    const p = purchase.percentile;
    if (p >= 75) {
      return {
        available: true,
        text: `Cena je v horních ${formatPct(100 - p)} % podobných nemovitostí (${segmentLabel}) v lokalitě ${locationLabel} — percentil ${formatPct(p)} (vzorek ${purchase.sampleCount}).`,
        code: "price_upper_quartile",
        purchasePercentile: p,
        rentPercentile: rent.statisticallyValid ? rent.percentile : null,
        sampleCount: purchase.sampleCount,
        suppressReason: null,
      };
    }
    if (p <= 25) {
      return {
        available: true,
        text: `Cena je v dolních ${formatPct(p)} % podobných nemovitostí (${segmentLabel}) v lokalitě ${locationLabel} — percentil ${formatPct(p)} (vzorek ${purchase.sampleCount}).`,
        code: "price_lower_quartile",
        purchasePercentile: p,
        rentPercentile: rent.statisticallyValid ? rent.percentile : null,
        sampleCount: purchase.sampleCount,
        suppressReason: null,
      };
    }
    return {
      available: true,
      text: `Cena je kolem mediánu podobných nemovitostí (${segmentLabel}) v lokalitě ${locationLabel} — percentil ${formatPct(p)} (vzorek ${purchase.sampleCount}).`,
      code: "price_around_median",
      purchasePercentile: p,
      rentPercentile: rent.statisticallyValid ? rent.percentile : null,
      sampleCount: purchase.sampleCount,
      suppressReason: null,
    };
  }

  if (rent.statisticallyValid && rent.percentile != null) {
    const p = rent.percentile;
    if (p >= 75) {
      return {
        available: true,
        text: `Odhadovaný nájem je v horních ${formatPct(100 - p)} % segmentu ${segmentLabel} v lokalitě ${locationLabel} (percentil ${formatPct(p)}, vzorek ${rent.sampleCount}).`,
        code: "rent_upper_quartile",
        purchasePercentile: null,
        rentPercentile: p,
        sampleCount: rent.sampleCount,
        suppressReason: null,
      };
    }
    if (p <= 25) {
      return {
        available: true,
        text: `Odhadovaný nájem je v dolních ${formatPct(p)} % segmentu ${segmentLabel} v lokalitě ${locationLabel} (percentil ${formatPct(p)}, vzorek ${rent.sampleCount}).`,
        code: "rent_lower_quartile",
        purchasePercentile: null,
        rentPercentile: p,
        sampleCount: rent.sampleCount,
        suppressReason: null,
      };
    }
  }

  return {
    available: false,
    text: null,
    code: null,
    purchasePercentile: purchase.percentile,
    rentPercentile: rent.percentile,
    sampleCount: purchase.sampleCount ?? rent.sampleCount,
    suppressReason:
      purchase.suppressReason ??
      rent.suppressReason ??
      "Nedostatek validních percentilů pro insight.",
  };
}
