/**
 * Dimension registry — weights, required inputs, labels.
 */

import type { LocationScoreDimension } from "@/domains/locations/scoring/types";

export type DimensionDefinition = {
  dimension: LocationScoreDimension;
  labelCs: string;
  description: string;
  weight: number;
  /** Minimum ratio of required inputs that must be present (0–1). */
  minInputCoverage: number;
  requiredInputs: string[];
};

export const DIMENSION_REGISTRY: Record<LocationScoreDimension, DimensionDefinition> = {
  OWN_USE_FIT: {
    dimension: "OWN_USE_FIT",
    labelCs: "Vhodnost pro vlastní bydlení",
    description:
      "Dostupnost služeb, zeleně, škol a dopravy pro každodenní život — ne univerzální index.",
    weight: 1,
    minInputCoverage: 0.5,
    requiredInputs: [
      "accessibility_score",
      "transit_proximity",
      "school_proximity",
      "green_proximity",
    ],
  },
  RENTAL_INVESTMENT_FIT: {
    dimension: "RENTAL_INVESTMENT_FIT",
    labelCs: "Vhodnost pro nájemní investici",
    description: "Výnos, poptávka po nájmu, dostupnost MHD — segmentově.",
    weight: 1,
    minInputCoverage: 0.6,
    requiredInputs: ["gross_rental_yield", "rent_level", "transit_proximity", "price_reduction_rate"],
  },
  FLIP_FIT: {
    dimension: "FLIP_FIT",
    labelCs: "Vhodnost pro flip",
    description: "Likvidita, DOM, cenový momentum — ne amenity density.",
    weight: 1,
    minInputCoverage: 0.5,
    requiredInputs: ["median_days_on_market", "price_reduction_rate", "transaction_volume"],
  },
  MARKET_LIQUIDITY: {
    dimension: "MARKET_LIQUIDITY",
    labelCs: "Likvidita trhu",
    description: "Aktivní nabídka, DOM, obrat pronájmů — proxy likvidity.",
    weight: 1,
    minInputCoverage: 0.5,
    requiredInputs: ["median_days_on_market", "active_listings_count"],
  },
};

export const ALL_DIMENSIONS: LocationScoreDimension[] = [
  "OWN_USE_FIT",
  "RENTAL_INVESTMENT_FIT",
  "FLIP_FIT",
  "MARKET_LIQUIDITY",
];
