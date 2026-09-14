/**
 * Regional cost coefficients — location index (Concept C).
 */

export const LOCATION_MARKETS = ["CZ"] as const;
export type LocationMarket = (typeof LOCATION_MARKETS)[number];

export type LocationCostRegion = "praha" | "cz_other";

export type RegionalCoefficient = {
  region: LocationCostRegion;
  coefficient: number;
  label: string;
};

export type LocationCostProfile = {
  version: string;
  market: LocationMarket;
  isDemo: boolean;
  regions: Record<LocationCostRegion, RegionalCoefficient>;
  effectiveFrom: string;
  source: string;
};

export type LocationInput = {
  city?: string | null;
  region?: string | null;
  publicCity?: string | null;
  publicRegion?: string | null;
};
