import { cva, type VariantProps } from "class-variance-authority";
import {
  AlertTriangle,
  BadgeCheck,
  Clock,
  HelpCircle,
  MinusCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-[var(--radius-sm)] border px-2 py-0.5 text-[var(--text-label-s)] font-medium",
  {
    variants: {
      tone: {
        neutral:
          "border-[var(--border-default)] bg-[var(--background-secondary)] text-[var(--text-secondary)]",
        success:
          "border-[color-mix(in_srgb,var(--status-success)_35%,white)] bg-[color-mix(in_srgb,var(--status-success)_10%,white)] text-[var(--status-success)]",
        warning:
          "border-[color-mix(in_srgb,var(--status-warning)_35%,white)] bg-[color-mix(in_srgb,var(--status-warning)_10%,white)] text-[var(--status-warning)]",
        error:
          "border-[color-mix(in_srgb,var(--status-error)_35%,white)] bg-[color-mix(in_srgb,var(--status-error)_10%,white)] text-[var(--status-error)]",
        info: "border-[color-mix(in_srgb,var(--status-info)_35%,white)] bg-[color-mix(in_srgb,var(--status-info)_10%,white)] text-[var(--status-info)]",
        premium:
          "border-[var(--action-premium)] bg-[color-mix(in_srgb,var(--action-premium)_18%,white)] text-[var(--text-primary)]",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export function Badge({
  className,
  tone,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {children}
    </span>
  );
}

export type DataQuality = "verified" | "estimated" | "pending" | "stale" | "incomplete" | "unavailable";

const dataQualityConfig: Record<
  DataQuality,
  { label: string; tone: VariantProps<typeof badgeVariants>["tone"]; icon: typeof BadgeCheck }
> = {
  verified: { label: "Ověřeno", tone: "success", icon: BadgeCheck },
  estimated: { label: "Odhad", tone: "warning", icon: HelpCircle },
  pending: { label: "Čeká na ověření", tone: "info", icon: Clock },
  stale: { label: "Zastaralé", tone: "neutral", icon: Clock },
  incomplete: { label: "Neúplné", tone: "warning", icon: AlertTriangle },
  unavailable: { label: "Nedostupné", tone: "neutral", icon: MinusCircle },
};

export function DataQualityBadge({
  quality,
  className,
}: {
  quality: DataQuality;
  className?: string;
}) {
  const config = dataQualityConfig[quality];
  const Icon = config.icon;
  return (
    <Badge tone={config.tone} className={className}>
      <Icon className="size-3.5" aria-hidden />
      <span>{config.label}</span>
    </Badge>
  );
}

export type RiskLevel = "low" | "medium" | "high" | "critical" | "unknown";

const riskConfig: Record<
  RiskLevel,
  { label: string; tone: VariantProps<typeof badgeVariants>["tone"] }
> = {
  low: { label: "Nízké riziko", tone: "success" },
  medium: { label: "Střední riziko", tone: "warning" },
  high: { label: "Vysoké riziko", tone: "error" },
  critical: { label: "Kritické riziko", tone: "error" },
  unknown: { label: "Riziko nelze určit", tone: "neutral" },
};

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  const config = riskConfig[level];
  return (
    <Badge tone={config.tone} className={className}>
      <AlertTriangle className="size-3.5" aria-hidden />
      <span>{config.label}</span>
    </Badge>
  );
}

export function StrategyBadge({ label, className }: { label: string; className?: string }) {
  return (
    <Badge tone="premium" className={className}>
      {label}
    </Badge>
  );
}

export function StatusBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: VariantProps<typeof badgeVariants>["tone"];
  className?: string;
}) {
  return (
    <Badge tone={tone} className={className}>
      {children}
    </Badge>
  );
}
