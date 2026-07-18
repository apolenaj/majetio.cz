/**
 * Deduplication similarity scoring (Prompt 7 Part 3).
 * Pure helpers — no DB writes. Feed jobs / review UI call these later.
 */

export const DEDUPE_WEIGHTS = {
  /** Exact address or very close GPS. */
  location: 0.45,
  /** Usable / floor area proximity. */
  area: 0.25,
  /** Asking price proximity. */
  price: 0.15,
  /** Title / description token overlap. */
  text: 0.15,
} as const;

/** Suggest reviewing pairs at or above this score. */
export const DEDUPE_REVIEW_THRESHOLD = 0.72;

export type DedupePropertySnapshot = {
  id: string;
  street?: string | null;
  houseNumber?: string | null;
  orientationNumber?: string | null;
  publicCity?: string | null;
  publicDistrict?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  usableArea?: number | null;
  floorArea?: number | null;
  areaSqm?: number | null;
  askingPrice?: number | null;
  priceCzk?: number | null;
  title?: string | null;
  description?: string | null;
};

export type DedupeScoreBreakdown = {
  location: number;
  area: number;
  price: number;
  text: number;
};

export type DedupeScoreResult = {
  similarityScore: number;
  breakdown: DedupeScoreBreakdown;
  aboveReviewThreshold: boolean;
};

const EARTH_RADIUS_M = 6_371_000;

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

function normalizeAddressPart(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function addressKey(p: DedupePropertySnapshot): string | null {
  const street = normalizeAddressPart(p.street);
  const house =
    normalizeAddressPart(p.houseNumber) ||
    normalizeAddressPart(p.orientationNumber);
  const city = normalizeAddressPart(p.publicCity);
  if (!street || !city) return null;
  return `${city}|${street}|${house}`;
}

function locationScore(a: DedupePropertySnapshot, b: DedupePropertySnapshot): number {
  const keyA = addressKey(a);
  const keyB = addressKey(b);
  if (keyA && keyB && keyA === keyB) {
    return 1;
  }

  if (
    a.latitude != null &&
    a.longitude != null &&
    b.latitude != null &&
    b.longitude != null
  ) {
    const meters = haversineMeters(a.latitude, a.longitude, b.latitude, b.longitude);
    if (meters <= 15) return 1;
    if (meters <= 50) return 0.85;
    if (meters <= 150) return 0.55;
    if (meters <= 400) return 0.25;
    return 0;
  }

  // Soft match on city + district when GPS/street missing
  const cityA = normalizeAddressPart(a.publicCity);
  const cityB = normalizeAddressPart(b.publicCity);
  if (cityA && cityB && cityA === cityB) {
    const distA = normalizeAddressPart(a.publicDistrict);
    const distB = normalizeAddressPart(b.publicDistrict);
    if (distA && distB && distA === distB) return 0.35;
    return 0.15;
  }
  return 0;
}

function primaryArea(p: DedupePropertySnapshot): number | null {
  return p.usableArea ?? p.floorArea ?? p.areaSqm ?? null;
}

function ratioSimilarity(a: number, b: number): number {
  if (a <= 0 || b <= 0) return 0;
  const ratio = Math.min(a, b) / Math.max(a, b);
  if (ratio >= 0.98) return 1;
  if (ratio >= 0.95) return 0.85;
  if (ratio >= 0.9) return 0.65;
  if (ratio >= 0.8) return 0.4;
  if (ratio >= 0.7) return 0.2;
  return 0;
}

function areaScore(a: DedupePropertySnapshot, b: DedupePropertySnapshot): number {
  const areaA = primaryArea(a);
  const areaB = primaryArea(b);
  if (areaA == null || areaB == null) return 0;
  return ratioSimilarity(areaA, areaB);
}

function primaryPrice(p: DedupePropertySnapshot): number | null {
  return p.askingPrice ?? p.priceCzk ?? null;
}

function priceScore(a: DedupePropertySnapshot, b: DedupePropertySnapshot): number {
  const priceA = primaryPrice(a);
  const priceB = primaryPrice(b);
  if (priceA == null || priceB == null) return 0;
  return ratioSimilarity(priceA, priceB);
}

function tokenize(text: string | null | undefined): Set<string> {
  const tokens = (text ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3);
  return new Set(tokens);
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const t of a) {
    if (b.has(t)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function textScore(a: DedupePropertySnapshot, b: DedupePropertySnapshot): number {
  const titleScore = jaccard(tokenize(a.title), tokenize(b.title));
  const descScore = jaccard(tokenize(a.description), tokenize(b.description));
  return Math.max(titleScore, descScore * 0.85);
}

/**
 * Weighted similarity in [0, 1]. Address/GPS dominate; area medium; price/text low.
 */
export function computeDedupeScore(
  a: DedupePropertySnapshot,
  b: DedupePropertySnapshot,
): DedupeScoreResult {
  const breakdown: DedupeScoreBreakdown = {
    location: locationScore(a, b),
    area: areaScore(a, b),
    price: priceScore(a, b),
    text: textScore(a, b),
  };

  const similarityScore =
    breakdown.location * DEDUPE_WEIGHTS.location +
    breakdown.area * DEDUPE_WEIGHTS.area +
    breakdown.price * DEDUPE_WEIGHTS.price +
    breakdown.text * DEDUPE_WEIGHTS.text;

  return {
    similarityScore: Math.round(similarityScore * 1000) / 1000,
    breakdown,
    aboveReviewThreshold: similarityScore >= DEDUPE_REVIEW_THRESHOLD,
  };
}

/** Stable pair ordering so (A,B) and (B,A) share one candidate row. */
export function orderedPropertyPairIds(
  idA: string,
  idB: string,
): { propertyAId: string; propertyBId: string } {
  return idA < idB
    ? { propertyAId: idA, propertyBId: idB }
    : { propertyAId: idB, propertyBId: idA };
}
