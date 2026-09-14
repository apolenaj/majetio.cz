/**
 * POI proximity computation — nearest distance & count within radius.
 */

import { haversineDistanceMeters } from "@/domains/locations/service/geospatial";
import {
  POI_CATEGORY_LABELS,
  type AccessibilityProfile,
  type AccessibilitySubIndex,
  type PoiCategory,
  type PoiRecord,
  type ProximityMetric,
} from "@/domains/locations/scoring/amenities/types";

const METHODOLOGY = "majetio-accessibility.v2026.07";

function distanceMeters(
  origin: { latitude: number; longitude: number },
  poi: PoiRecord,
): number {
  return haversineDistanceMeters(origin, {
    latitude: poi.latitude,
    longitude: poi.longitude,
  });
}

function countWithin(
  pois: PoiRecord[],
  origin: { latitude: number; longitude: number },
  radiusMeters: number,
): number {
  return pois.filter((p) => distanceMeters(origin, p) <= radiusMeters).length;
}

function nearestPoi(
  pois: PoiRecord[],
  origin: { latitude: number; longitude: number },
): { distance: number; poi: PoiRecord } | null {
  if (pois.length === 0) return null;
  let best: { distance: number; poi: PoiRecord } | null = null;
  for (const poi of pois) {
    const d = distanceMeters(origin, poi);
    if (!best || d < best.distance) best = { distance: d, poi };
  }
  return best;
}

/** Inverse-distance score 0–100 with cap — closer is better, null if no POI. */
export function normalizeNearestDistanceScore(
  meters: number | null,
  excellentMeters: number,
  poorMeters: number,
): number | null {
  if (meters == null) return null;
  if (meters <= excellentMeters) return 100;
  if (meters >= poorMeters) return 10;
  const ratio = (meters - excellentMeters) / (poorMeters - excellentMeters);
  return Math.round(100 - ratio * 90);
}

/** Count score — saturates; used only when relevant for profile (e.g. green space). */
export function normalizeCountScore(
  count: number,
  goodCount: number,
  maxCount: number,
): number {
  if (count >= goodCount) return Math.min(100, 60 + ((count - goodCount) / maxCount) * 40);
  return Math.round((count / goodCount) * 60);
}

const NEAREST_THRESHOLDS: Partial<
  Record<PoiCategory, { excellent: number; poor: number }>
> = {
  PUBLIC_TRANSIT_STOP: { excellent: 300, poor: 1200 },
  METRO_STATION: { excellent: 600, poor: 2000 },
  TRAM_STOP: { excellent: 400, poor: 1500 },
  SCHOOL: { excellent: 500, poor: 2000 },
  KINDERGARTEN: { excellent: 400, poor: 1500 },
  GREEN_SPACE: { excellent: 200, poor: 1500 },
  GROCERY: { excellent: 400, poor: 1500 },
  HEALTHCARE: { excellent: 800, poor: 3000 },
  PHARMACY: { excellent: 500, poor: 2000 },
};

export function computeProximityMetrics(
  origin: { latitude: number; longitude: number },
  pois: PoiRecord[],
): ProximityMetric[] {
  const categories = [...new Set(pois.map((p) => p.category))];

  return categories.map((category) => {
    const subset = pois.filter((p) => p.category === category);
    const nearest = nearestPoi(subset, origin);
    return {
      category,
      labelCs: POI_CATEGORY_LABELS[category],
      nearestDistanceMeters: nearest?.distance ?? null,
      countWithin500m: countWithin(subset, origin, 500),
      countWithin1000m: countWithin(subset, origin, 1000),
      source: nearest?.poi.source ?? subset[0]?.source ?? null,
      sourceDate: nearest?.poi.sourceDate ?? subset[0]?.sourceDate ?? null,
    };
  });
}

export function buildAccessibilitySubIndices(
  proximity: ProximityMetric[],
): AccessibilitySubIndex[] {
  return proximity.map((p) => {
    const thresholds = NEAREST_THRESHOLDS[p.category];
    const nearestScore = thresholds
      ? normalizeNearestDistanceScore(
          p.nearestDistanceMeters,
          thresholds.excellent,
          thresholds.poor,
        )
      : null;

    const countBonus =
      p.category === "GREEN_SPACE"
        ? normalizeCountScore(p.countWithin500m, 2, 5)
        : null;

    let value: number | null = null;
    let explanation = "";

    if (nearestScore != null && countBonus != null) {
      value = Math.round(nearestScore * 0.65 + countBonus * 0.35);
      explanation = `Nejbližší ${p.labelCs.toLowerCase()} ${p.nearestDistanceMeters} m; ${p.countWithin500m} v okruhu 500 m.`;
    } else if (nearestScore != null) {
      value = nearestScore;
      explanation =
        p.nearestDistanceMeters != null
          ? `Nejbližší ${p.labelCs.toLowerCase()} ${Math.round(p.nearestDistanceMeters)} m.`
          : `Žádný ${p.labelCs.toLowerCase()} v dosahu dat.`;
    } else {
      explanation = `Chybí data o ${p.labelCs.toLowerCase()}.`;
    }

    const confidence =
      p.source && p.nearestDistanceMeters != null
        ? 0.85
        : p.nearestDistanceMeters != null
          ? 0.6
          : 0;

    return {
      key: `accessibility.${p.category.toLowerCase()}`,
      labelCs: `Dostupnost — ${p.labelCs}`,
      value,
      confidence,
      explanation,
    };
  });
}

export function buildAccessibilityProfile(input: {
  locationId: string;
  centroid: { latitude: number; longitude: number };
  pois: PoiRecord[];
  computedAt?: Date;
}): AccessibilityProfile {
  const proximity = computeProximityMetrics(input.centroid, input.pois);
  const subIndices = buildAccessibilitySubIndices(proximity);
  const sources = [...new Set(input.pois.map((p) => p.source))];

  return {
    locationId: input.locationId,
    centroid: input.centroid,
    proximity,
    subIndices,
    methodologyVersion: METHODOLOGY,
    computedAt: (input.computedAt ?? new Date()).toISOString(),
    sources,
  };
}
