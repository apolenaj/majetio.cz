"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type RangeSliderProps = {
  id: string;
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  /** Formatted value shown beside the control. */
  displayValue?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

/**
 * Lightweight range control matching Majetio form tokens (no extra deps).
 */
export function RangeSlider({
  id,
  value,
  onValueChange,
  min,
  max,
  step = 1,
  displayValue,
  disabled,
  className,
  "aria-label": ariaLabel,
}: RangeSliderProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        onChange={(e) => onValueChange(Number(e.target.value))}
        className={cn(
          "h-2 w-full cursor-pointer appearance-none rounded-full bg-[var(--border-default)] accent-[var(--action-accent)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "[&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--action-accent)]",
          "[&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[var(--action-accent)]",
        )}
      />
      {displayValue != null ? (
        <span className="min-w-[4.5rem] text-right font-metric text-sm text-[var(--text-primary)]">
          {displayValue}
        </span>
      ) : null}
    </div>
  );
}
