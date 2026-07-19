/**
 * Geographic hierarchy for comparable selection (Prompt 10 Part 2).
 * MICRO → NEIGHBOR → BROADER; OUT_OF_SCOPE is not selected for valuation.
 */

import type { ComparableCandidate, GeoTier, ValuationSubject } from "./types";

const GEO_WEIGHT: Record<GeoTier, number> = {
  MICRO: 1,
  NEIGHBOR: 0.7,
  BROADER: 0.4,
  OUT_OF_SCOPE: 0,
};

const NEIGHBOR_MAX_METERS = 3_000;

function fold(s: string | null | undefined): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .toLowerCase();
}

function same(a: string | null | undefined, b: string | null | undefined): boolean {
  const fa = fold(a);
  const fb = fold(b);
  return Boolean(fa && fb && fa === fb);
}

/** Haversine distance in meters; null if either side lacks coords. */
export function haversineMeters(
  a: { latitude: number | null; longitude: number | null },
  b: { latitude: number | null; longitude: number | null },
): number | null {
  if (
    a.latitude == null ||
    a.longitude == null ||
    b.latitude == null ||
    b.longitude == null ||
    !Number.isFinite(a.latitude) ||
    !Number.isFinite(a.longitude) ||
    !Number.isFinite(b.latitude) ||
    !Number.isFinite(b.longitude)
  ) {
    return null;
  }
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6_371_000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function resolveGeoTier(
  subject: ValuationSubject,
  candidate: ComparableCandidate,
): { tier: GeoTier; distanceMeters: number | null } {
  const distanceMeters = haversineMeters(subject, candidate);

  if (same(subject.district, candidate.district) && same(subject.city, candidate.city)) {
    return { tier: "MICRO", distanceMeters };
  }

  // Same city, different district = neighbor; or within 3 km
  if (same(subject.city, candidate.city)) {
    return { tier: "NEIGHBOR", distanceMeters };
  }
  if (distanceMeters != null && distanceMeters <= NEIGHBOR_MAX_METERS) {
    return { tier: "NEIGHBOR", distanceMeters };
  }

  if (same(subject.region, candidate.region)) {
    return { tier: "BROADER", distanceMeters };
  }

  return { tier: "OUT_OF_SCOPE", distanceMeters };
}

export function geoTierWeight(tier: GeoTier): number {
  return GEO_WEIGHT[tier];
}
