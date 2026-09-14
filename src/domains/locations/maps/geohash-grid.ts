/**
 * Geohash + privacy-safe spatial aggregation for location map layers.
 * Cells never expose individual transactions — min sample threshold enforced.
 */

const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

/** Encode lat/lon to geohash (precision 1–12). */
export function encodeGeohash(
  latitude: number,
  longitude: number,
  precision = 6,
): string {
  let idx = 0;
  let bit = 0;
  let evenBit = true;
  let geohash = "";

  let latMin = -90;
  let latMax = 90;
  let lonMin = -180;
  let lonMax = 180;

  while (geohash.length < precision) {
    if (evenBit) {
      const mid = (lonMin + lonMax) / 2;
      if (longitude >= mid) {
        idx = idx * 2 + 1;
        lonMin = mid;
      } else {
        idx = idx * 2;
        lonMax = mid;
      }
    } else {
      const mid = (latMin + latMax) / 2;
      if (latitude >= mid) {
        idx = idx * 2 + 1;
        latMin = mid;
      } else {
        idx = idx * 2;
        latMax = mid;
      }
    }
    evenBit = !evenBit;
    if (++bit === 5) {
      geohash += BASE32.charAt(idx);
      bit = 0;
      idx = 0;
    }
  }
  return geohash;
}

/** Decode geohash to bounding box center (approximate). */
export function decodeGeohashCenter(hash: string): {
  latitude: number;
  longitude: number;
} {
  let evenBit = true;
  let latMin = -90;
  let latMax = 90;
  let lonMin = -180;
  let lonMax = 180;

  for (const ch of hash) {
    const idx = BASE32.indexOf(ch);
    if (idx < 0) continue;
    for (let n = 4; n >= 0; n--) {
      const bitN = (idx >> n) & 1;
      if (evenBit) {
        const mid = (lonMin + lonMax) / 2;
        if (bitN === 1) lonMin = mid;
        else lonMax = mid;
      } else {
        const mid = (latMin + latMax) / 2;
        if (bitN === 1) latMin = mid;
        else latMax = mid;
      }
      evenBit = !evenBit;
    }
  }
  return {
    latitude: (latMin + latMax) / 2,
    longitude: (lonMin + lonMax) / 2,
  };
}

export type MapLayerKind = "price" | "rent" | "yield" | "supply";

export type MapObservation = {
  /** Already jittered / coarse — never street-level private address. */
  latitude: number;
  longitude: number;
  value: number;
};

export type AggregatedMapCell = {
  geohash: string;
  /** Rounded cell center — not a property address. */
  latitude: number;
  longitude: number;
  /** Median of values in cell. */
  value: number;
  sampleCount: number;
  /** False when below privacy threshold — omit from public map. */
  publishable: boolean;
};

/** Minimum observations per cell before publishing (privacy + stability). */
export const MAP_CELL_MIN_SAMPLES = 5;

/**
 * Aggregate observations into geohash cells.
 * Cells under MAP_CELL_MIN_SAMPLES are marked non-publishable (never shown as points).
 */
export function aggregateToGeohashGrid(
  observations: MapObservation[],
  precision = 6,
  minSamples = MAP_CELL_MIN_SAMPLES,
): AggregatedMapCell[] {
  const buckets = new Map<string, number[]>();

  for (const obs of observations) {
    const hash = encodeGeohash(obs.latitude, obs.longitude, precision);
    const list = buckets.get(hash) ?? [];
    list.push(obs.value);
    buckets.set(hash, list);
  }

  const cells: AggregatedMapCell[] = [];
  for (const [geohash, values] of buckets) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median =
      sorted.length % 2 === 0
        ? (sorted[mid - 1]! + sorted[mid]!) / 2
        : sorted[mid]!;
    const center = decodeGeohashCenter(geohash);
    cells.push({
      geohash,
      latitude: Math.round(center.latitude * 1000) / 1000,
      longitude: Math.round(center.longitude * 1000) / 1000,
      value: Math.round(median),
      sampleCount: values.length,
      publishable: values.length >= minSamples,
    });
  }

  return cells.filter((c) => c.publishable);
}

/**
 * Demo grid for a location centroid — synthetic aggregated cells only.
 * Does not represent real transactions.
 */
export function buildDemoMapCells(input: {
  centroidLat: number;
  centroidLon: number;
  layer: MapLayerKind;
  baseValue: number;
}): AggregatedMapCell[] {
  const offsets = [
    [0, 0],
    [0.012, 0.008],
    [-0.01, 0.014],
    [0.008, -0.012],
    [-0.014, -0.006],
    [0.018, 0.002],
    [-0.004, 0.016],
    [0.006, 0.018],
  ];

  const observations: MapObservation[] = [];
  for (const [dLat, dLon] of offsets) {
    // 6–12 synthetic points per cell area → above privacy threshold after aggregate
    for (let i = 0; i < 8; i++) {
      const jitter = (i - 4) * 0.0008;
      observations.push({
        latitude: input.centroidLat + dLat! + jitter,
        longitude: input.centroidLon + dLon! + jitter * 0.7,
        value: Math.round(input.baseValue * (0.88 + (i % 5) * 0.04)),
      });
    }
  }

  return aggregateToGeohashGrid(observations, 6);
}

export const MAP_LAYER_LABELS_CS: Record<MapLayerKind, string> = {
  price: "Cena (medián Kč/m²)",
  rent: "Nájem (medián Kč/m²/měs.)",
  yield: "Hrubý výnos (%)",
  supply: "Nabídka (aktivní inzeráty)",
};
