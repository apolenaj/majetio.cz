"use client";

import {
  AlertTriangle,
  CheckCircle2,
  CircleHelp,
  Gauge,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipProvider,
} from "@/components/overlays/tooltip";
import type { ConfidenceLevel } from "./types";

export type ConfidenceIndicatorProps = {
  level: ConfidenceLevel;
  /** Why this level — shown in tooltip (e.g. "málo comparables"). */
  reason?: string | null;
  /** Extra bullets under the main reason. */
  details?: string[];
  className?: string;
  showLabel?: boolean;
};

type LevelConfig = {
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  bars: 1 | 2 | 3 | 0;
  className: string;
  defaultReason: string;
};

const LEVEL_CONFIG: Record<ConfidenceLevel, LevelConfig> = {
  high: {
    label: "Vysoká spolehlivost",
    shortLabel: "High",
    icon: CheckCircle2,
    bars: 3,
    className: "text-[var(--status-success)]",
    defaultReason:
      "Dostatek kvalitních srovnatelných případů a konzistentní vstupní data.",
  },
  medium: {
    label: "Střední spolehlivost",
    shortLabel: "Medium",
    icon: Gauge,
    bars: 2,
    className: "text-[var(--status-warning)]",
    defaultReason:
      "Odhad je použitelný, ale část vstupů je omezená nebo méně aktuální.",
  },
  low: {
    label: "Nízká spolehlivost",
    shortLabel: "Low",
    icon: AlertTriangle,
    bars: 1,
    className: "text-[var(--status-warning)]",
    defaultReason:
      "Málo comparables nebo vysoký rozptyl — berte jako hrubou orientaci.",
  },
  insufficient: {
    label: "Nedostatečná data",
    shortLabel: "Insufficient",
    icon: CircleHelp,
    bars: 0,
    className: "text-[var(--data-missing)]",
    defaultReason:
      "Pro spolehlivý modelovaný odhad chybí data (např. málo comparables).",
  },
};

function ConfidenceBars({
  filled,
  className,
}: {
  filled: 0 | 1 | 2 | 3;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-end gap-0.5", className)}
      aria-hidden
    >
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={cn(
            "w-1 rounded-sm",
            n === 1 ? "h-2" : n === 2 ? "h-3" : "h-4",
            n <= filled
              ? "bg-current"
              : "bg-[color-mix(in_srgb,currentColor_25%,transparent)]",
          )}
        />
      ))}
    </span>
  );
}

/**
 * Reliability of an estimate — text + icon + bars, not color alone.
 */
export function ConfidenceIndicator({
  level,
  reason,
  details = [],
  className,
  showLabel = true,
}: ConfidenceIndicatorProps) {
  const config = LEVEL_CONFIG[level];
  const Icon = config.icon;
  const explanation = reason?.trim() || config.defaultReason;

  const tooltipBody = (
    <div className="space-y-1.5 text-left">
      <p className="font-medium">{config.label}</p>
      <p>{explanation}</p>
      {details.length > 0 ? (
        <ul className="list-disc space-y-0.5 pl-3.5">
          {details.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      ) : null}
      <p className="opacity-80">
        Jde o modelovaný odhad / orientační rozpětí — ne o oficiální ocenění.
      </p>
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip content={tooltipBody}>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-2 py-1 text-left text-[var(--text-label-s)] font-medium transition-colors hover:bg-[var(--background-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
            config.className,
            className,
          )}
          aria-label={`${config.label}. ${explanation}`}
          data-trust-confidence={level}
        >
          <Icon className="size-3.5 shrink-0" aria-hidden strokeWidth={2} />
          <ConfidenceBars filled={config.bars} />
          {showLabel ? (
            <span className="text-[var(--text-primary)]">
              {config.label}
              <span className="sr-only"> ({config.shortLabel})</span>
            </span>
          ) : (
            <span className="sr-only">{config.label}</span>
          )}
        </button>
      </Tooltip>
    </TooltipProvider>
  );
}
