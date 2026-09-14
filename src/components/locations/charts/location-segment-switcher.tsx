"use client";

import { cn } from "@/lib/utils";
import type { LocationSegmentOption } from "@/components/locations/types";

export function LocationSegmentSwitcher({
  segments,
  value,
  onChange,
  className,
}: {
  segments: LocationSegmentOption[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-wrap gap-2", className)}
      role="tablist"
      aria-label="Segment trhu"
    >
      {segments.map((seg) => {
        const active = seg.key === value;
        return (
          <button
            key={seg.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(seg.key)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              active
                ? "border-[var(--action-accent)] bg-[var(--action-accent)] text-[var(--text-inverse)]"
                : "border-[var(--border-default)] bg-[var(--surface-primary)] text-[var(--text-secondary)] hover:bg-[var(--background-secondary)]",
            )}
          >
            {seg.label}
          </button>
        );
      })}
    </div>
  );
}
