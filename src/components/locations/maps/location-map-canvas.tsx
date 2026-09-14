"use client";

import type { AggregatedMapCell, MapLayerKind } from "@/domains/locations/maps/geohash-grid";
import { MAP_LAYER_LABELS_CS } from "@/domains/locations/maps/geohash-grid";

/**
 * Lightweight SVG choropleth — no Mapbox/Leaflet dependency.
 * Shows aggregated cells only; never individual property pins.
 */
export function LocationMapCanvas({
  cells,
  layer,
  locationLabel,
  summary,
}: {
  cells: AggregatedMapCell[];
  layer: MapLayerKind;
  locationLabel: string;
  summary: string;
}) {
  const bounds = computeBounds(cells);
  const values = cells.map((c) => c.value);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;

  return (
    <figure
      className="overflow-hidden rounded-lg border border-[var(--border-default)] bg-[var(--surface-secondary)]"
      aria-label={`Mapa: ${MAP_LAYER_LABELS_CS[layer]} — ${locationLabel}`}
    >
      <p className="sr-only">{summary}</p>
      <svg
        viewBox="0 0 400 280"
        className="h-72 w-full"
        role="img"
        aria-hidden={false}
        aria-describedby="location-map-desc"
      >
        <title>
          {MAP_LAYER_LABELS_CS[layer]} — {locationLabel}
        </title>
        <desc id="location-map-desc">{summary}</desc>
        <rect width="400" height="280" fill="var(--surface-secondary)" />
        {/* Simple grid backdrop */}
        {Array.from({ length: 8 }).map((_, i) => (
          <line
            key={`v-${i}`}
            x1={(i + 1) * 50}
            y1={0}
            x2={(i + 1) * 50}
            y2={280}
            stroke="var(--border-default)"
            strokeWidth={0.5}
          />
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <line
            key={`h-${i}`}
            x1={0}
            y1={(i + 1) * 56}
            x2={400}
            y2={(i + 1) * 56}
            stroke="var(--border-default)"
            strokeWidth={0.5}
          />
        ))}
        {cells.map((cell) => {
          const { x, y } = project(cell.longitude, cell.latitude, bounds);
          const t = max === min ? 0.5 : (cell.value - min) / (max - min);
          const fill = heatColor(t);
          return (
            <rect
              key={cell.geohash}
              x={x - 18}
              y={y - 18}
              width={36}
              height={36}
              rx={4}
              fill={fill}
              opacity={0.85}
            >
              <title>
                Buňka {cell.geohash}: medián {cell.value}, vzorek {cell.sampleCount}
              </title>
            </rect>
          );
        })}
      </svg>
      <figcaption className="border-t border-[var(--border-default)] px-3 py-2 text-xs text-[var(--text-muted)]">
        Agregované buňky (geohash) — ne jednotlivé nabídky ani transakce.
      </figcaption>
    </figure>
  );
}

function computeBounds(cells: AggregatedMapCell[]) {
  if (cells.length === 0) {
    return { minLat: 49.5, maxLat: 50.5, minLon: 14, maxLon: 15 };
  }
  const lats = cells.map((c) => c.latitude);
  const lons = cells.map((c) => c.longitude);
  const pad = 0.01;
  return {
    minLat: Math.min(...lats) - pad,
    maxLat: Math.max(...lats) + pad,
    minLon: Math.min(...lons) - pad,
    maxLon: Math.max(...lons) + pad,
  };
}

function project(
  lon: number,
  lat: number,
  bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number },
) {
  const x =
    ((lon - bounds.minLon) / Math.max(bounds.maxLon - bounds.minLon, 1e-6)) * 360 + 20;
  const y =
    (1 - (lat - bounds.minLat) / Math.max(bounds.maxLat - bounds.minLat, 1e-6)) * 240 + 20;
  return { x, y };
}

function heatColor(t: number): string {
  // Teal → amber scale (avoid purple AI cliché)
  const clamped = Math.max(0, Math.min(1, t));
  const r = Math.round(40 + clamped * 180);
  const g = Math.round(120 + (1 - clamped) * 40);
  const b = Math.round(100 + (1 - clamped) * 60);
  return `rgb(${r},${g},${b})`;
}
