/**
 * Amenity relevance by use case — POI counts are NOT universally "better".
 * Restaurants / nightlife deliberately excluded from default profiles.
 */

import type {
  AmenityRelevanceProfile,
  PoiCategory,
} from "@/domains/locations/scoring/amenities/types";
import type { LocationScoreDimension } from "@/domains/locations/scoring/types";

export const AMENITY_RELEVANCE_PROFILES: Record<string, AmenityRelevanceProfile> = {
  own_use: {
    id: "own_use",
    labelCs: "Vlastní bydlení",
    categoryWeights: {
      PUBLIC_TRANSIT_STOP: 0.2,
      METRO_STATION: 0.15,
      TRAM_STOP: 0.1,
      SCHOOL: 0.15,
      KINDERGARTEN: 0.1,
      GREEN_SPACE: 0.15,
      GROCERY: 0.1,
      HEALTHCARE: 0.05,
      PHARMACY: 0.05,
    },
    maxCategoryShare: 0.35,
  },
  rental_long: {
    id: "rental_long",
    labelCs: "Dlouhodobý pronájem",
    categoryWeights: {
      PUBLIC_TRANSIT_STOP: 0.3,
      METRO_STATION: 0.25,
      TRAM_STOP: 0.15,
      GROCERY: 0.15,
      GREEN_SPACE: 0.05,
      HEALTHCARE: 0.05,
      PHARMACY: 0.05,
      // Schools intentionally low — not all tenants have children
      SCHOOL: 0,
      KINDERGARTEN: 0,
    },
    maxCategoryShare: 0.4,
  },
  flip: {
    id: "flip",
    labelCs: "Flip",
    categoryWeights: {
      // Flip cares about market liquidity, not amenity density
      PUBLIC_TRANSIT_STOP: 0.1,
      METRO_STATION: 0.1,
    },
    maxCategoryShare: 0.5,
  },
};

export function relevanceProfileForDimension(
  dimension: LocationScoreDimension,
): AmenityRelevanceProfile {
  switch (dimension) {
    case "OWN_USE_FIT":
      return AMENITY_RELEVANCE_PROFILES.own_use!;
    case "RENTAL_INVESTMENT_FIT":
      return AMENITY_RELEVANCE_PROFILES.rental_long!;
    case "FLIP_FIT":
      return AMENITY_RELEVANCE_PROFILES.flip!;
    case "MARKET_LIQUIDITY":
      return { id: "liquidity", labelCs: "Likvidita", categoryWeights: {}, maxCategoryShare: 0 };
    default:
      return AMENITY_RELEVANCE_PROFILES.own_use!;
  }
}

/**
 * Weighted accessibility contribution for a dimension — null if no POI data.
 */
export function computeWeightedAccessibilityScore(
  subIndices: { key: string; value: number | null; confidence: number }[],
  profile: AmenityRelevanceProfile,
  categoryFromKey: (key: string) => PoiCategory | null,
): { score: number | null; confidence: number; usedCategories: string[] } {
  const entries: { weight: number; value: number; confidence: number; cat: string }[] = [];

  for (const sub of subIndices) {
    const cat = categoryFromKey(sub.key);
    if (!cat) continue;
    const w = profile.categoryWeights[cat] ?? 0;
    if (w <= 0 || sub.value == null) continue;
    entries.push({ weight: w, value: sub.value, confidence: sub.confidence, cat });
  }

  if (entries.length === 0) return { score: null, confidence: 0, usedCategories: [] };

  const totalWeight = entries.reduce((s, e) => s + e.weight, 0);
  if (totalWeight <= 0) return { score: null, confidence: 0, usedCategories: [] };

  let weighted = 0;
  let confSum = 0;
  for (const e of entries) {
    const cappedWeight = Math.min(e.weight, profile.maxCategoryShare);
    weighted += (cappedWeight / totalWeight) * e.value;
    confSum += e.confidence * cappedWeight;
  }

  return {
    score: Math.round(weighted),
    confidence: Math.min(0.95, confSum / totalWeight),
    usedCategories: entries.map((e) => e.cat),
  };
}

export function categoryFromAccessibilityKey(key: string): PoiCategory | null {
  const suffix = key.replace("accessibility.", "").toUpperCase();
  const valid: PoiCategory[] = [
    "PUBLIC_TRANSIT_STOP",
    "METRO_STATION",
    "TRAM_STOP",
    "SCHOOL",
    "KINDERGARTEN",
    "GREEN_SPACE",
    "GROCERY",
    "HEALTHCARE",
    "PHARMACY",
  ];
  return valid.find((c) => c === suffix) ?? null;
}
