"use client";

import * as React from "react";
import dynamic from "next/dynamic";

import { LocationSectionAnalytics } from "@/components/locations/location-analytics";
import {
  MAP_LAYER_LABELS_CS,
  type AggregatedMapCell,
  type MapLayerKind,
} from "@/domains/locations/maps/geohash-grid";
import { trackLocation } from "@/domains/locations/analytics/events";
import { formatCzk } from "@/lib/format";
import { cn } from "@/lib/utils";

const LocationMapCanvas = dynamic(
  () =>
    import("@/components/locations/maps/location-map-canvas").then(
      (m) => m.LocationMapCanvas,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-72 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-secondary)] text-sm text-[var(--text-muted)]"
        role="status"
      >
        Načítám mapovou vrstvu…
      </div>
    ),
  },
);

type LayerBundle = Record<MapLayerKind, AggregatedMapCell[]>;

export function LocationMapSection({
  locationSlug,
  locationLabel,
  layers,
  periodLabel,
  isDemo = false,
}: {
  locationSlug: string;
  locationLabel: string;
  layers: LayerBundle;
  periodLabel: string;
  /** Synthetic geohash cells — must not be presented as live production maps. */
  isDemo?: boolean;
}) {
  const [layer, setLayer] = React.useState<MapLayerKind>("price");
  const cells = layers[layer];

  function changeLayer(next: MapLayerKind) {
    setLayer(next);
    trackLocation({
      name: "location_map_layer_changed",
      props: { location_slug: locationSlug, layer: next },
    });
  }

  const summaryText =
    cells.length === 0
      ? `Pro vrstvu ${MAP_LAYER_LABELS_CS[layer]} nejsou publikovatelná agregovaná data (nedostatečný vzorek v buňkách).`
      : `Mapa ${locationLabel}: ${cells.length} geohash buněk, vrstva ${MAP_LAYER_LABELS_CS[layer]}. Hodnoty jsou mediány buněk — jednotlivé transakce nejsou zobrazeny.`;

  return (
    <div className="space-y-4">
      <LocationSectionAnalytics
        locationSlug={locationSlug}
        event={{ name: "location_map_viewed", layer }}
      />

      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Mapové vrstvy"
      >
        {(Object.keys(MAP_LAYER_LABELS_CS) as MapLayerKind[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={layer === key}
            onClick={() => changeLayer(key)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm",
              layer === key
                ? "border-[var(--action-accent)] bg-[var(--action-accent)] text-[var(--text-inverse)]"
                : "border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--background-secondary)]",
            )}
          >
            {MAP_LAYER_LABELS_CS[key]}
          </button>
        ))}
      </div>

      <p className="text-xs text-[var(--text-muted)]">
        {isDemo
          ? "Demonstrační geohash vrstva (syntetické buňky) — není produkční mapa transakcí."
          : "Prostorová agregace (geohash). Buňky s méně než 5 pozorováními se nezobrazují — nelze dohledat konkrétní transakce."}{" "}
        Období: {periodLabel}.
      </p>

      <LocationMapCanvas
        cells={cells}
        layer={layer}
        locationLabel={locationLabel}
        summary={summaryText}
      />

      {/* A11y: table is the non-visual way to read the same data */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="mb-2 text-left text-xs text-[var(--text-muted)]">
            Tabulkové shrnutí mapové vrstvy (stejná data jako mapa)
          </caption>
          <thead>
            <tr className="border-b border-[var(--border-default)] text-left">
              <th className="py-2 pr-3 font-medium text-[var(--text-muted)]">Geohash</th>
              <th className="py-2 pr-3 font-medium text-[var(--text-muted)]">Střed buňky</th>
              <th className="py-2 pr-3 font-medium text-[var(--text-muted)]">Medián</th>
              <th className="py-2 font-medium text-[var(--text-muted)]">Vzorek</th>
            </tr>
          </thead>
          <tbody>
            {cells.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-3 text-[var(--text-secondary)]">
                  Žádné publikovatelné buňky.
                </td>
              </tr>
            ) : (
              cells.map((c) => (
                <tr key={c.geohash} className="border-b border-[var(--border-default)]">
                  <td className="py-2 pr-3 font-mono text-xs">{c.geohash}</td>
                  <td className="py-2 pr-3 text-[var(--text-secondary)]">
                    {c.latitude.toFixed(3)}, {c.longitude.toFixed(3)}
                  </td>
                  <td className="py-2 pr-3 font-metric text-[var(--text-primary)]">
                    {formatLayerValue(layer, c.value)}
                  </td>
                  <td className="py-2 text-[var(--text-secondary)]">{c.sampleCount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatLayerValue(layer: MapLayerKind, value: number): string {
  if (layer === "yield") return `${(value / 100).toFixed(2)} %`;
  if (layer === "supply") return new Intl.NumberFormat("cs-CZ").format(value);
  if (layer === "rent") return `${Math.round(value)} Kč/m²/měs.`;
  return formatCzk(value).replace(/\s?Kč$/, " Kč/m²");
}
