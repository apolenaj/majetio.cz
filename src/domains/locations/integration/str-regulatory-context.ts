/**
 * Short-term rental + regulatory context foundation.
 * Never invent tourism demand or regulation from city stereotypes.
 */

import type { LocationPageProfile } from "@/domains/locations/types/location-page";

export type ShortTermRentalContext = {
  available: boolean;
  /** Indexed demand signal 0–100 when sourced; null if unknown. */
  tourismDemandIndex: number | null;
  /** Occupancy proxy % when sourced. */
  estimatedOccupancyPct: number | null;
  period: string | null;
  source: string | null;
  sampleCount: number | null;
  suppressReason: string | null;
};

export type RegulatoryContext = {
  available: boolean;
  shortTermRentalLevel: "none" | "limited" | "restricted" | "unknown";
  summary: string | null;
  source: string | null;
  effectiveFrom: string | null;
  suppressReason: string | null;
};

export type LocationStrRegulatoryBundle = {
  shortTermRental: ShortTermRentalContext;
  regulatory: RegulatoryContext;
};

export function buildStrRegulatoryContext(
  profile: LocationPageProfile | null,
): LocationStrRegulatoryBundle {
  if (!profile) {
    return {
      shortTermRental: {
        available: false,
        tourismDemandIndex: null,
        estimatedOccupancyPct: null,
        period: null,
        source: null,
        sampleCount: null,
        suppressReason: "Profil lokality není k dispozici.",
      },
      regulatory: {
        available: false,
        shortTermRentalLevel: "unknown",
        summary: null,
        source: null,
        effectiveFrom: null,
        suppressReason: "Profil lokality není k dispozici.",
      },
    };
  }

  const str = profile.shortTermRentalContext;
  const reg = profile.regulatoryContext;

  return {
    shortTermRental: str?.available
      ? {
          available: true,
          tourismDemandIndex: str.tourismDemandIndex,
          estimatedOccupancyPct: str.estimatedOccupancyPct,
          period: str.period ?? profile.periodLabel,
          source: str.source,
          sampleCount: str.sampleCount,
          suppressReason: null,
        }
      : {
          available: false,
          tourismDemandIndex: null,
          estimatedOccupancyPct: null,
          period: null,
          source: null,
          sampleCount: null,
          suppressReason:
            "Short-term rental data pro lokalitu nejsou napojená — nezobrazujeme odhad.",
        },
    regulatory: reg?.available
      ? {
          available: true,
          shortTermRentalLevel: reg.shortTermRentalLevel,
          summary: reg.summary,
          source: reg.source,
          effectiveFrom: reg.effectiveFrom,
          suppressReason: null,
        }
      : {
          available: false,
          shortTermRentalLevel: "unknown",
          summary: null,
          source: null,
          effectiveFrom: null,
          suppressReason:
            "Regulační kontext není v datech — nevymýšlíme lokální pravidla.",
        },
  };
}
