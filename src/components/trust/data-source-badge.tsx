import {
  BadgeCheck,
  Database,
  FlaskConical,
  LineChart,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { DataSourceKind } from "./types";

export type DataSourceBadgeProps = {
  kind: DataSourceKind;
  /** Optional short provenance (provider name, model id). */
  detail?: string | null;
  className?: string;
  size?: "sm" | "md";
};

type SourceConfig = {
  label: string;
  shortHint: string;
  icon: LucideIcon;
  className: string;
};

const SOURCE_CONFIG: Record<DataSourceKind, SourceConfig> = {
  source_record: {
    label: "Zdrojový údaj",
    shortHint: "Převzato ze zdroje inzerátu / feedu",
    icon: Database,
    className:
      "border-[var(--border-strong)] bg-[var(--background-secondary)] text-[var(--text-primary)]",
  },
  majetio_estimate: {
    label: "Odhad Majetio",
    shortHint: "Modelovaný odhad — ne oficiální ocenění",
    icon: LineChart,
    className:
      "border-[color-mix(in_srgb,var(--data-estimated)_40%,white)] bg-[color-mix(in_srgb,var(--data-estimated)_12%,white)] text-[var(--data-estimated)]",
  },
  model_scenario: {
    label: "Modelový scénář",
    shortHint: "Výsledek závisí na zvolených předpokladech",
    icon: FlaskConical,
    className:
      "border-[color-mix(in_srgb,var(--status-info)_40%,white)] bg-[color-mix(in_srgb,var(--status-info)_10%,white)] text-[var(--status-info)]",
  },
  user_provided: {
    label: "Zadáno uživatelem",
    shortHint: "Hodnota z vašeho vstupu, ne z trhu",
    icon: UserRound,
    className:
      "border-[var(--border-default)] bg-[var(--surface-primary)] text-[var(--text-secondary)]",
  },
  analyst_verified: {
    label: "Ověřeno analytikem",
    shortHint: "Ručně zkontrolováno — stále může platit časové omezení",
    icon: BadgeCheck,
    className:
      "border-[color-mix(in_srgb,var(--data-verified)_40%,white)] bg-[color-mix(in_srgb,var(--data-verified)_12%,white)] text-[var(--data-verified)]",
  },
};

/**
 * Visual + textual distinction of data provenance (Trust by Design).
 */
export function DataSourceBadge({
  kind,
  detail,
  className,
  size = "md",
}: DataSourceBadgeProps) {
  const config = SOURCE_CONFIG[kind];
  const Icon = config.icon;
  const title = detail ? `${config.shortHint}. ${detail}` : config.shortHint;

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-[var(--radius-sm)] border font-medium",
        size === "sm"
          ? "px-1.5 py-0.5 text-[10px] leading-tight"
          : "px-2 py-1 text-[var(--text-label-s)]",
        config.className,
        className,
      )}
      title={title}
      data-trust-source={kind}
    >
      <Icon
        className={size === "sm" ? "size-3 shrink-0" : "size-3.5 shrink-0"}
        aria-hidden
        strokeWidth={2}
      />
      <span className="min-w-0 truncate">
        {config.label}
        {detail ? (
          <span className="font-normal opacity-80"> · {detail}</span>
        ) : null}
      </span>
    </span>
  );
}

export function dataSourceKindLabel(kind: DataSourceKind): string {
  return SOURCE_CONFIG[kind].label;
}
