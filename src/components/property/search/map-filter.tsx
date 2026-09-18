"use client";

import * as React from "react";

import { FilterAccordion } from "@/components/property/search/filter-accordion";
import {
  CZ_MAP_VIEWBOX,
  SEARCH_REGIONS,
  SK_MAP_OFFSET_X,
  type SearchRegion,
  type SearchRegionCountry,
} from "@/domains/properties/search/regions";
import { cn } from "@/lib/utils";

function RegionPath({
  region,
  selected,
  onToggle,
  transform,
}: {
  region: SearchRegion;
  selected: boolean;
  onToggle: (id: string) => void;
  transform?: string;
}) {
  return (
    <path
      d={region.path}
      transform={transform}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={region.label}
      data-region={region.id}
      className={cn(
        "cursor-pointer transition-all duration-200 outline-none",
        "stroke-[color-mix(in_srgb,var(--brand-ink-950)_55%,transparent)] stroke-[1.1]",
        selected
          ? "fill-[var(--action-accent)] opacity-95"
          : "fill-[color-mix(in_srgb,var(--border-default)_70%,var(--action-accent)_18%)] hover:fill-[color-mix(in_srgb,var(--action-accent)_40%,var(--border-default))]",
        "focus-visible:stroke-[var(--action-accent)] focus-visible:stroke-2",
      )}
      onClick={() => onToggle(region.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle(region.id);
        }
      }}
    >
      <title>{region.label}</title>
    </path>
  );
}

function RegionLabel({
  region,
  selected,
  offsetX = 0,
}: {
  region: SearchRegion;
  selected: boolean;
  offsetX?: number;
}) {
  return (
    <text
      x={region.labelX + offsetX}
      y={region.labelY}
      textAnchor="middle"
      dominantBaseline="middle"
      className={cn(
        "pointer-events-none select-none text-[9px] font-medium sm:text-[10px]",
        selected
          ? "fill-[var(--text-inverse)]"
          : "fill-[var(--text-primary)] opacity-80",
      )}
      style={{ fontFamily: "inherit" }}
    >
      {region.mapLabel}
    </text>
  );
}

function RegionPills({
  country,
  selected,
  onToggle,
}: {
  country: SearchRegionCountry;
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const regions = SEARCH_REGIONS.filter((r) => r.country === country);
  return (
    <div className="flex flex-wrap gap-2">
      {regions.map((region) => {
        const active = selected.includes(region.id);
        return (
          <button
            key={region.id}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(region.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150",
              active
                ? "border-[var(--action-accent)] bg-[var(--action-accent)] text-[var(--text-inverse)] shadow-sm"
                : "border-[var(--border-default)] bg-[var(--surface-primary)] text-[var(--text-secondary)] hover:border-[var(--action-accent)]/40 hover:text-[var(--text-primary)]",
            )}
          >
            {region.label}
          </button>
        );
      })}
    </div>
  );
}

export function MapFilter({
  selected,
  onChange,
  collapsible = false,
}: {
  selected: string[];
  onChange: (kraje: string[]) => void;
  collapsible?: boolean;
}) {
  function toggle(id: string) {
    onChange(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id],
    );
  }

  const cz = SEARCH_REGIONS.filter((r) => r.country === "CZ");
  const sk = SEARCH_REGIONS.filter((r) => r.country === "SK");
  const combinedViewBox = `0 0 ${1000 + SK_MAP_OFFSET_X} 570`;

  return (
    <FilterAccordion
      title="Lokalita"
      description="Interaktivní mapa krajů ČR a SR + rychlý výběr"
      defaultOpen
      collapsible={collapsible}
      badge={
        selected.length > 0 ? (
          <span className="rounded-full bg-[var(--action-accent)]/12 px-2 py-0.5 text-[0.65rem] font-medium text-[var(--action-accent)]">
            {selected.length}
          </span>
        ) : null
      }
    >
      <div className="space-y-5">
        <div className="hidden overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[linear-gradient(160deg,var(--background-secondary),var(--surface-primary))] p-3 shadow-inner sm:block">
          <svg
            viewBox={combinedViewBox}
            className="mx-auto h-auto w-full max-w-5xl"
            role="img"
            aria-label="Interaktivní mapa krajů Česka a Slovenska"
          >
            <text
              x="420"
              y="28"
              className="fill-[var(--text-muted)] text-[14px] font-medium"
              style={{ fontFamily: "inherit" }}
            >
              Česko
            </text>
            <text
              x={1000 + SK_MAP_OFFSET_X / 2 + 80}
              y="28"
              className="fill-[var(--text-muted)] text-[14px] font-medium"
              style={{ fontFamily: "inherit" }}
            >
              Slovensko
            </text>

            <g aria-label={CZ_MAP_VIEWBOX}>
              {cz.map((region) => (
                <RegionPath
                  key={region.id}
                  region={region}
                  selected={selected.includes(region.id)}
                  onToggle={toggle}
                />
              ))}
              {cz.map((region) => (
                <RegionLabel
                  key={`lbl-${region.id}`}
                  region={region}
                  selected={selected.includes(region.id)}
                />
              ))}
            </g>

            <g transform={`translate(${SK_MAP_OFFSET_X} 0)`}>
              {sk.map((region) => (
                <RegionPath
                  key={region.id}
                  region={region}
                  selected={selected.includes(region.id)}
                  onToggle={toggle}
                />
              ))}
              {sk.map((region) => (
                <RegionLabel
                  key={`lbl-${region.id}`}
                  region={region}
                  selected={selected.includes(region.id)}
                />
              ))}
            </g>
          </svg>
          <p className="mt-2 text-center text-[0.7rem] text-[var(--text-muted)]">
            Mapa krajů — kliknutím vyberete region · podklad Simplemaps
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium tracking-wide text-[var(--text-muted)] uppercase">
              Česko
            </p>
            <RegionPills country="CZ" selected={selected} onToggle={toggle} />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium tracking-wide text-[var(--text-muted)] uppercase">
              Slovensko
            </p>
            <RegionPills country="SK" selected={selected} onToggle={toggle} />
          </div>
        </div>

        {selected.length > 0 ? (
          <button
            type="button"
            className="text-xs font-medium text-[var(--action-accent)] hover:underline"
            onClick={() => onChange([])}
          >
            Zrušit výběr krajů
          </button>
        ) : null}
      </div>
    </FilterAccordion>
  );
}
