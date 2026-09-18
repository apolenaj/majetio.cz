"use client";

import { FilterAccordion } from "@/components/property/search/filter-accordion";
import { RegionMapSelector } from "@/components/property/search/region-map-selector";
import {
  SEARCH_REGIONS,
  type SearchRegionCountry,
} from "@/domains/properties/search/regions";
import { cn } from "@/lib/utils";

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
                ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900",
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
  selectedRegions,
  onChange,
  collapsible = false,
}: {
  selectedRegions?: string[];
  onChange: (kraje: string[]) => void;
  collapsible?: boolean;
}) {
  const regions = selectedRegions ?? [];

  function toggle(id: string) {
    onChange(
      regions.includes(id) ? regions.filter((x) => x !== id) : [...regions, id],
    );
  }

  return (
    <FilterAccordion
      title="Lokalita"
      description="Analytická mapa krajů — hover ukáže název, kliknutí vybere"
      defaultOpen
      collapsible={collapsible}
      badge={
        regions.length > 0 ? (
          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[0.65rem] font-medium text-white">
            {regions.length}
          </span>
        ) : null
      }
    >
      <div className="space-y-5">
        <RegionMapSelector selectedRegions={regions} onChange={onChange} />

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium tracking-wide text-slate-500 uppercase">
              Česko
            </p>
            <RegionPills country="CZ" selected={regions} onToggle={toggle} />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium tracking-wide text-slate-500 uppercase">
              Slovensko
            </p>
            <RegionPills country="SK" selected={regions} onToggle={toggle} />
          </div>
        </div>

        {regions.length > 0 ? (
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
