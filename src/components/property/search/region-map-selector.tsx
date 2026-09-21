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
  compact = false,
}: {
  selectedRegions: string[];
  onChange: (ids: string[]) => void;
  className?: string;
  compact?: boolean;
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
  const viewBox = compact
    ? "0 0 1000 570"
    : `0 0 ${1000 + SK_MAP_OFFSET_X} 570`;
  const showSk = !compact;

  return (
    <div
      id="mapa"
      ref={boxRef}
      className={cn(
        "relative overflow-hidden border bg-[#F0F5F6]",
        compact
          ? "rounded-lg border-[#DCE5E7] p-2.5"
          : "rounded-2xl border-gray-100 bg-slate-50 p-4 sm:p-6",
        className,
      )}
    >
      {compact ? null : (
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[#0C3551]">Kraje ČR a SR</p>
            <p className="text-xs text-[#667A86]">
              Najetím uvidíte název, kliknutím kraj vyberete
            </p>
          </div>
          {selectedRegions.length > 0 ? (
            <span className="rounded-full bg-[#0C3551] px-2.5 py-0.5 text-[0.7rem] font-medium text-white">
              {selectedRegions.length}
            </span>
          ) : null}
        </div>
      )}

      <svg
        viewBox={viewBox}
        className={cn("mx-auto h-auto w-full", compact ? "max-w-none" : "max-w-5xl")}
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
              compact={compact}
            />
          ))}
          {compact && selectedRegions.includes("praha") ? (
            <text
              x={SEARCH_REGIONS.find((r) => r.id === "praha")?.labelX ?? 470}
              y={SEARCH_REGIONS.find((r) => r.id === "praha")?.labelY ?? 220}
              className="fill-white text-[22px] font-semibold"
              textAnchor="middle"
              pointerEvents="none"
            >
              Praha
            </text>
          ) : null}
        </g>
        {showSk ? (
          <g transform={`translate(${SK_MAP_OFFSET_X} 0)`}>
            {sk.map((region) => (
              <RegionShape
                key={region.id}
                region={region}
                selected={selectedRegions.includes(region.id)}
                onToggle={toggle}
                onHover={moveTip}
                onLeave={() => setHover(null)}
                compact={compact}
              />
            ))}
          </g>
        ) : null}
      </svg>

      {hover ? (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-lg bg-[#0C3551] px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-white shadow-lg"
          style={{ left: hover.x, top: hover.y }}
        >
          {hover.label}
          <span className="absolute top-full left-1/2 size-2 -translate-x-1/2 -translate-y-1 rotate-45 bg-[#0C3551]" />
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
  compact,
}: {
  region: SearchRegion;
  selected: boolean;
  onToggle: (id: string) => void;
  onHover: (event: React.MouseEvent, label: string) => void;
  onLeave: () => void;
  compact?: boolean;
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
        "cursor-pointer stroke-white outline-none transition-colors duration-200",
        compact ? "stroke-[1.5]" : "stroke-[2]",
        selected
          ? "fill-[#0C3551]"
          : "fill-[#C9D6DC] hover:fill-[#9BB0BA]",
        "focus-visible:stroke-[#0D9A92]",
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
