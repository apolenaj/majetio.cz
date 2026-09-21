"use client";

import { LayoutGrid, List, MapPinned } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  RAZENI_OPTIONS,
  buildPropertySearchHref,
  type PropertyUrlFilterState,
} from "@/domains/properties/search/url-state";
import { cn } from "@/lib/utils";

export function PropertyResultsToolbar({
  count,
  state,
  view = "grid",
  onViewChange,
}: {
  count: number;
  state: PropertyUrlFilterState;
  view?: "grid" | "list";
  onViewChange?: (view: "grid" | "list") => void;
}) {
  const router = useRouter();
  const label =
    count === 1
      ? "nemovitost odpovídá"
      : count >= 2 && count <= 4
        ? "nemovitosti odpovídají"
        : "nemovitostí odpovídá";

  return (
    <div className="properties-toolbar">
      <p className="properties-toolbar-count">
        <strong>{count}</strong> {label} vašemu hledání
      </p>
      <div className="properties-toolbar-actions">
        <label className="properties-toolbar-sort">
          <span>Řazení</span>
          <select
            value={state.razeni ?? "newest"}
            onChange={(e) => {
              router.push(
                buildPropertySearchHref({
                  ...state,
                  razeni: e.target.value as PropertyUrlFilterState["razeni"],
                  stranka: 1,
                }),
              );
            }}
          >
            {RAZENI_OPTIONS.map((option) => (
              <option key={option.sort} value={option.sort}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="properties-view-toggle" role="group" aria-label="Způsob zobrazení">
          <button
            type="button"
            aria-pressed={view === "grid"}
            className={cn(view === "grid" && "is-active")}
            onClick={() => onViewChange?.("grid")}
          >
            <LayoutGrid className="size-4" aria-hidden />
            <span className="sr-only">Dlaždice</span>
          </button>
          <button
            type="button"
            aria-pressed={view === "list"}
            className={cn(view === "list" && "is-active")}
            onClick={() => onViewChange?.("list")}
          >
            <List className="size-4" aria-hidden />
            <span className="sr-only">Seznam</span>
          </button>
        </div>
        <a href="#mapa" className="properties-map-btn">
          <MapPinned className="size-4" aria-hidden />
          Zobrazit na mapě
        </a>
      </div>
    </div>
  );
}
