/**
 * Purchase / rent percentile vs local segment distribution.
 * Shown only when sample size is statistically valid — otherwise null (hide UI).
 */

import type { LocationPageProfile } from "@/domains/locations/types/location-page";

/** Stricter than median display — need enough peers for a meaningful rank. */
export const MIN_PERCENTILE_SAMPLE = 30;
export const MIN_PERCENTILE_CONFIDENCE = 0.55;

export type SegmentDistributionBand = {
  p25: number;
  p50: number;
  p75: number;
  sampleCount: number;
  confidence: number;
};

export type MarketPercentileResult = {
  /** 0–100 inclusive; null when suppressed. */
  percentile: number | null;
  sampleCount: number | null;
  confidence: number | null;
  /** True only when sample + confidence pass thresholds. */
  statisticallyValid: boolean;
  suppressReason: string | null;
  band: SegmentDistributionBand | null;
};

/**
 * Piecewise-linear percentile estimate from quartile band.
 * Does not invent values outside data — clamps soft extrapolation past p75/p25.
 */
export function estimatePercentileFromQuartiles(
  value: number,
  band: Pick<SegmentDistributionBand, "p25" | "p50" | "p75">,
): number {
  const { p25, p50, p75 } = band;
  if (value <= p25) {
    if (p25 <= 0) return 12.5;
    const ratio = value / p25;
    return Math.max(1, Math.min(25, ratio * 25));
  }
  if (value <= p50) {
    const span = p50 - p25;
    if (span <= 0) return 37.5;
    return 25 + ((value - p25) / span) * 25;
  }
  if (value <= p75) {
    const span = p75 - p50;
    if (span <= 0) return 62.5;
    return 50 + ((value - p50) / span) * 25;
  }
  // Soft upper: map p75 → IQR above into 75–99
  const iqr = p75 - p25;
  if (iqr <= 0) return 87.5;
  const over = (value - p75) / iqr;
  return Math.min(99, 75 + over * 20);
}

export function isDistributionStatisticallyValid(
  band: SegmentDistributionBand | null | undefined,
): boolean {
  if (!band) return false;
  if (band.sampleCount < MIN_PERCENTILE_SAMPLE) return false;
  if (band.confidence < MIN_PERCENTILE_CONFIDENCE) return false;
  if (!(band.p25 > 0 && band.p50 > 0 && band.p75 > 0)) return false;
  if (!(band.p25 <= band.p50 && band.p50 <= band.p75)) return false;
  return true;
}

export function resolveMarketPercentile(
  value: number | null | undefined,
  band: SegmentDistributionBand | null | undefined,
): MarketPercentileResult {
  if (value == null || !Number.isFinite(value) || value <= 0) {
    return {
      percentile: null,
      sampleCount: band?.sampleCount ?? null,
      confidence: band?.confidence ?? null,
      statisticallyValid: false,
      suppressReason: "Chybí hodnota nemovitosti pro percentil.",
      band: band ?? null,
    };
  }

  if (!isDistributionStatisticallyValid(band)) {
    return {
      percentile: null,
      sampleCount: band?.sampleCount ?? null,
      confidence: band?.confidence ?? null,
      statisticallyValid: false,
      suppressReason:
        band == null
          ? "Chybí distribuční pásmo lokality (p25/p50/p75)."
          : band.sampleCount < MIN_PERCENTILE_SAMPLE
            ? `Vzorek ${band.sampleCount} < ${MIN_PERCENTILE_SAMPLE} — percentil skryt.`
            : "Nedostatečná confidence distribučního pásma — percentil skryt.",
      band: band ?? null,
    };
  }

  const percentile = Math.round(estimatePercentileFromQuartiles(value, band!) * 10) / 10;
  return {
    percentile,
    sampleCount: band!.sampleCount,
    confidence: band!.confidence,
    statisticallyValid: true,
    suppressReason: null,
    band: band!,
  };
}

/** Read optional distribution from location page profile (demo / DB overlay). */
export function getSegmentDistribution(
  profile: LocationPageProfile | null,
  segmentKey: string,
  kind: "askingPriceSqm" | "rentSqm",
): SegmentDistributionBand | null {
  const dist = profile?.segmentDistributions?.[segmentKey]?.[kind];
  return dist ?? null;
}
