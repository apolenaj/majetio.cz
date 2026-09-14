/**
 * DEMO DATA ONLY — regional labour/material index for Czech market.
 */

import type { LocationCostProfile } from "./types";

export const DEMO_LOCATION_COST_VERSION = "location-cost.v2026.07-demo";

export const DEMO_LOCATION_COST_V2026_07: LocationCostProfile = {
  version: DEMO_LOCATION_COST_VERSION,
  market: "CZ",
  isDemo: true,
  regions: {
    praha: {
      region: "praha",
      coefficient: 1.18,
      label: "Praha",
    },
    cz_other: {
      region: "cz_other",
      coefficient: 1.0,
      label: "Zbytek ČR",
    },
  },
  effectiveFrom: "2026-07-01",
  source: "majetio-demo-location-index — NOT FOR PRODUCTION PRICING",
};

/**
 * DEMO heuristic — resolve location to cost region.
 * Production should use Location entity / geocoding.
 */
export function resolveLocationCostRegion(input: {
  city?: string | null;
  region?: string | null;
  publicCity?: string | null;
  publicRegion?: string | null;
}): "praha" | "cz_other" {
  const candidates = [
    input.publicCity,
    input.city,
    input.publicRegion,
    input.region,
  ]
    .filter(Boolean)
    .map((s) => s!.toLowerCase());

  for (const value of candidates) {
    if (value.includes("praha") || value.includes("hlavní město praha")) {
      return "praha";
    }
  }

  return "cz_other";
}

export function regionalCoefficient(
  profile: LocationCostProfile,
  region: "praha" | "cz_other",
): number {
  return profile.regions[region].coefficient;
}
