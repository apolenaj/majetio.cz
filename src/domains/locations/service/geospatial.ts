/**
 * Geospatial abstraction — GeoJSON storage today, PostGIS-ready tomorrow.
 */

export type GeoPoint = {
  latitude: number;
  longitude: number;
};

export type GeoJsonPolygon = {
  type: "Polygon";
  coordinates: number[][][];
};

export type GeoJsonMultiPolygon = {
  type: "MultiPolygon";
  coordinates: number[][][][];
};

export type GeoJsonBoundary = GeoJsonPolygon | GeoJsonMultiPolygon;

export function isGeoJsonBoundary(value: unknown): value is GeoJsonBoundary {
  if (!value || typeof value !== "object") return false;
  const t = (value as { type?: string }).type;
  return t === "Polygon" || t === "MultiPolygon";
}

/** Ray-casting point-in-ring (planar approx for small CZ polygons). */
function pointInRing(lat: number, lon: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i]![0]!;
    const yi = ring[i]![1]!;
    const xj = ring[j]![0]!;
    const yj = ring[j]![1]!;
    const intersect =
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** GeoJSON stores [lon, lat]; API uses lat/lon. */
export function pointInGeoJsonBoundary(
  point: GeoPoint,
  boundary: GeoJsonBoundary,
): boolean {
  const { latitude: lat, longitude: lon } = point;

  if (boundary.type === "Polygon") {
    const [outer, ...holes] = boundary.coordinates;
    if (!outer || !pointInRing(lat, lon, outer)) return false;
    for (const hole of holes) {
      if (pointInRing(lat, lon, hole)) return false;
    }
    return true;
  }

  for (const polygon of boundary.coordinates) {
    const [outer, ...holes] = polygon;
    if (!outer || !pointInRing(lat, lon, outer)) continue;
    let inHole = false;
    for (const hole of holes) {
      if (pointInRing(lat, lon, hole)) {
        inHole = true;
        break;
      }
    }
    if (!inHole) return true;
  }
  return false;
}

export function haversineDistanceMeters(a: GeoPoint, b: GeoPoint): number {
  const R = 6371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * PostGIS migration note: replace JSON checks with
 * ST_Contains(boundaryGeom, ST_SetSRID(ST_MakePoint(lon, lat), 4326))
 */
export const GEOSPATIAL_BACKEND = "geojson_jsonb" as const;
