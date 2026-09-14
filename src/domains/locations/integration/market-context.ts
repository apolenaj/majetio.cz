/**
 * Extended market context for property detail — development, volatility, seasonality.
 * Fields are null when data missing — never stereotypical inference.
 */

import type { LocationPageProfile } from "@/domains/locations/types/location-page";

export type LocationMarketContextBlock = {
  development: {
    available: boolean;
    unitsUnderConstruction: number | null;
    pipelineNote: string | null;
    suppressReason: string | null;
  };
  priceVolatility: {
    available: boolean;
    /** Coefficient of variation of asking price series (stddev/mean). */
    cv: number | null;
    period: string | null;
    samplePoints: number | null;
    suppressReason: string | null;
  };
  seasonality: {
    available: boolean;
    /** Explicit tagged drivers only when profile provides them. */
    drivers: Array<"students" | "tourism" | "other">;
    note: string | null;
    suppressReason: string | null;
  };
};

function coefficientOfVariation(values: number[]): number | null {
  if (values.length < 6) return null;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return null;
  const variance =
    values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance) / Math.abs(mean);
}

export function buildLocationMarketContextBlock(
  profile: LocationPageProfile | null,
  segmentKey: string,
): LocationMarketContextBlock {
  if (!profile) {
    return {
      development: {
        available: false,
        unitsUnderConstruction: null,
        pipelineNote: null,
        suppressReason: "Profil lokality není k dispozici.",
      },
      priceVolatility: {
        available: false,
        cv: null,
        period: null,
        samplePoints: null,
        suppressReason: "Profil lokality není k dispozici.",
      },
      seasonality: {
        available: false,
        drivers: [],
        note: null,
        suppressReason: "Profil lokality není k dispozici.",
      },
    };
  }

  const units = profile.development.unitsUnderConstruction.value;
  const development = {
    available: units != null,
    unitsUnderConstruction: units,
    pipelineNote: profile.development.pipelineNote || null,
    suppressReason:
      units == null ? "Chybí metrika jednotek ve výstavbě." : null,
  };

  const askingPoints =
    profile.priceHistoryBySegment[segmentKey]?.asking?.points.map((p) => p.value) ??
    [];
  const cv = coefficientOfVariation(askingPoints);
  const priceVolatility = {
    available: cv != null,
    cv,
    period: profile.periodLabel,
    samplePoints: askingPoints.length,
    suppressReason:
      cv == null
        ? "Nedostatek bodů časové řady pro volatilitu (min. 6)."
        : null,
  };

  const seasonalityMeta = profile.seasonalityContext ?? null;
  const seasonality = seasonalityMeta?.available
    ? {
        available: true,
        drivers: seasonalityMeta.drivers,
        note: seasonalityMeta.note,
        suppressReason: null as string | null,
      }
    : {
        available: false,
        drivers: [] as Array<"students" | "tourism" | "other">,
        note: null,
        suppressReason:
          "Sezónnost není v datech lokality — neodvozujeme stereotypně.",
      };

  return { development, priceVolatility, seasonality };
}
