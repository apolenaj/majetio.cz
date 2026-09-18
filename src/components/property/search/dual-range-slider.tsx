"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type DualRangeSliderProps = {
  min: number;
  max: number;
  step?: number;
  valueMin: number;
  valueMax: number;
  onChange: (next: { min: number; max: number }) => void;
  className?: string;
  ariaLabelMin?: string;
  ariaLabelMax?: string;
};

/**
 * Dual-thumb range slider (two stacked native inputs) — no extra deps.
 */
export function DualRangeSlider({
  min,
  max,
  step = 1,
  valueMin,
  valueMax,
  onChange,
  className,
  ariaLabelMin = "Minimum",
  ariaLabelMax = "Maximum",
}: DualRangeSliderProps) {
  const lo = Math.min(valueMin, valueMax);
  const hi = Math.max(valueMin, valueMax);
  const span = max - min || 1;
  const leftPct = ((lo - min) / span) * 100;
  const rightPct = ((hi - min) / span) * 100;

  return (
    <div className={cn("relative h-8 w-full touch-none select-none", className)}>
      <div className="absolute top-1/2 left-0 right-0 h-2 -translate-y-1/2 rounded-full bg-[var(--border-default)]" />
      <div
        className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-[var(--action-accent)]"
        style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={lo}
        aria-label={ariaLabelMin}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={lo}
        onChange={(e) => {
          const next = Number(e.target.value);
          onChange({ min: Math.min(next, hi), max: hi });
        }}
        className={dualThumbClass}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={hi}
        aria-label={ariaLabelMax}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={hi}
        onChange={(e) => {
          const next = Number(e.target.value);
          onChange({ min: lo, max: Math.max(next, lo) });
        }}
        className={dualThumbClass}
      />
    </div>
  );
}

const dualThumbClass = cn(
  "pointer-events-none absolute top-0 left-0 h-8 w-full appearance-none bg-transparent",
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-10",
  "[&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full",
  "[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--surface-primary)]",
  "[&::-webkit-slider-thumb]:bg-[var(--action-accent)] [&::-webkit-slider-thumb]:shadow-md",
  "[&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110",
  "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:relative [&::-moz-range-thumb]:z-10",
  "[&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2",
  "[&::-moz-range-thumb]:border-[var(--surface-primary)] [&::-moz-range-thumb]:bg-[var(--action-accent)]",
  "[&::-moz-range-thumb]:shadow-md",
);
