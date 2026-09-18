"use client";

import * as React from "react";

import {
  SEARCH_REGIONS,
  SK_MAP_OFFSET_X,
  type SearchRegion,
} from "@/domains/properties/search/regions";
import { cn } from "@/lib/utils";

type HoverTip = { x: number; y: number; label: string };

export function RegionMapSelector({
  selectedRegions,
  onChange,
  className,
}: {
  selectedRegions: string[];
  onChange: (ids: string[]) => void;
  className?: string;
}) {
  const boxRef = React.useRef<HTMLDivElement>(null);
  const [hover, setHover] = React.useState<HoverTip | null>(null);

  function toggle(id: string) {
    onChange(
      selectedRegions.includes(id)
        ? selectedRegions.filter((x) => x !== id)
        : [...selectedRegions, id],
    );
  }

  function moveTip(event: React.MouseEvent, label: string) {
    const box = boxRef.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    setHover({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      label,
    });
  }

  const cz = SEARCH_REGIONS.filter((r) => r.country === "CZ");
  const sk = SEARCH_REGIONS.filter((r) => r.country === "SK");
  const viewBox = `0 0 ${1000 + SK_MAP_OFFSET_X} 570`;

  return (
    <div
      ref={boxRef}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-gray-100 bg-slate-50 p-4 sm:p-6",
        className,
      )}
    >
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-900">Kraje ČR a SR</p>
          <p className="text-xs text-slate-500">
            Najetím uvidíte název, kliknutím kraj vyberete
          </p>
        </div>
        {selectedRegions.length > 0 ? (
          <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[0.7rem] font-medium text-white">
            {selectedRegions.length}
          </span>
        ) : null}
      </div>

      <svg
        viewBox={viewBox}
        className="mx-auto h-auto w-full max-w-5xl"
        role="img"
        aria-label="Interaktivní mapa krajů Česka a Slovenska"
      >
        <g>
          {cz.map((region) => (
            <RegionShape
              key={region.id}
              region={region}
              selected={selectedRegions.includes(region.id)}
              onToggle={toggle}
              onHover={moveTip}
              onLeave={() => setHover(null)}
            />
          ))}
        </g>
        <g transform={`translate(${SK_MAP_OFFSET_X} 0)`}>
          {sk.map((region) => (
            <RegionShape
              key={region.id}
              region={region}
              selected={selectedRegions.includes(region.id)}
              onToggle={toggle}
              onHover={moveTip}
              onLeave={() => setHover(null)}
            />
          ))}
        </g>
      </svg>

      {hover ? (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-white shadow-lg"
          style={{ left: hover.x, top: hover.y }}
        >
          {hover.label}
          <span className="absolute top-full left-1/2 size-2 -translate-x-1/2 -translate-y-1 rotate-45 bg-slate-900" />
        </div>
      ) : null}
    </div>
  );
}

function RegionShape({
  region,
  selected,
  onToggle,
  onHover,
  onLeave,
}: {
  region: SearchRegion;
  selected: boolean;
  onToggle: (id: string) => void;
  onHover: (event: React.MouseEvent, label: string) => void;
  onLeave: () => void;
}) {
  return (
    <path
      d={region.path}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={region.label}
      data-region={region.id}
      className={cn(
        "cursor-pointer stroke-white stroke-[2] transition-colors duration-200 outline-none",
        selected
          ? "fill-[var(--action-accent)]"
          : "fill-slate-200 hover:fill-slate-400/80",
        "focus-visible:stroke-slate-900",
      )}
      onClick={() => onToggle(region.id)}
      onMouseMove={(event) => onHover(event, region.label)}
      onMouseLeave={onLeave}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggle(region.id);
        }
      }}
    />
  );
}
