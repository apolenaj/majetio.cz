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
                ? "border-[#0C3551] bg-[#0C3551] text-white shadow-sm"
                : "border-[#DCE5E7] bg-white text-[#667A86] hover:border-[#0D9A92] hover:text-[#0C3551]",
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
  compact = false,
}: {
  selectedRegions?: string[];
  onChange: (kraje: string[]) => void;
  collapsible?: boolean;
  /** Slimmer chrome for the sticky sidebar. */
  compact?: boolean;
}) {
  const regions = selectedRegions ?? [];

  function toggle(id: string) {
    onChange(
      regions.includes(id) ? regions.filter((x) => x !== id) : [...regions, id],
    );
  }

  const featured = ["praha", "stredocesky", "jihomoravsky", "ustecky", "moravskoslezsky"];
  const featuredRegions = SEARCH_REGIONS.filter(
    (r) => r.country === "CZ" && featured.includes(r.id),
  );
  const otherCz = SEARCH_REGIONS.filter(
    (r) => r.country === "CZ" && !featured.includes(r.id),
  );

  return (
    <FilterAccordion
      title={compact ? "Mapa krajů" : "Lokalita"}
      description={
        compact
          ? undefined
          : "Analytická mapa krajů — hover ukáže název, kliknutí vybere"
      }
      defaultOpen
      collapsible={collapsible}
      className={compact ? "rounded-lg shadow-none" : undefined}
      badge={
        regions.length > 0 ? (
          <span className="rounded-full bg-[#0C3551] px-2 py-0.5 text-[0.65rem] font-medium text-white">
            {regions.length}
          </span>
        ) : null
      }
    >
      <div className={cn("space-y-4", compact ? "space-y-3" : "space-y-5")}>
        <RegionMapSelector
          selectedRegions={regions}
          onChange={onChange}
          className={compact ? "properties-region-map" : undefined}
          compact={compact}
        />

        {compact ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {featuredRegions.map((region) => {
                const active = regions.includes(region.id);
                return (
                  <button
                    key={region.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggle(region.id)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150",
                      active
                        ? "border-[#0C3551] bg-[#0C3551] text-white shadow-sm"
                        : "border-[#DCE5E7] bg-white text-[#667A86] hover:border-[#0D9A92] hover:text-[#0C3551]",
                    )}
                  >
                    {region.label}
                  </button>
                );
              })}
              {otherCz.length > 0 ? (
                <details className="w-full">
                  <summary className="cursor-pointer text-xs font-medium text-[#0D9A92]">
                    + Další kraje
                  </summary>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {otherCz.map((region) => {
                      const active = regions.includes(region.id);
                      return (
                        <button
                          key={region.id}
                          type="button"
                          aria-pressed={active}
                          onClick={() => toggle(region.id)}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150",
                            active
                              ? "border-[#0C3551] bg-[#0C3551] text-white shadow-sm"
                              : "border-[#DCE5E7] bg-white text-[#667A86] hover:border-[#0D9A92] hover:text-[#0C3551]",
                          )}
                        >
                          {region.label}
                        </button>
                      );
                    })}
                  </div>
                </details>
              ) : null}
            </div>
            <div>
              <p className="mb-2 text-xs font-medium tracking-wide text-[#667A86] uppercase">
                Slovensko
              </p>
              <RegionPills country="SK" selected={regions} onToggle={toggle} />
            </div>
          </div>
        ) : (
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
        )}

        {regions.length > 0 ? (
          <button
            type="button"
            className="text-xs font-medium text-[#0D9A92] hover:underline"
            onClick={() => onChange([])}
          >
            Zrušit výběr krajů
          </button>
        ) : null}
      </div>
    </FilterAccordion>
  );
}
