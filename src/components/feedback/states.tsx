import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function Spinner({
  className,
  label = "Načítání",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span role="status" className={cn("inline-flex items-center gap-2", className)}>
      <Loader2 className="size-5 animate-spin text-[var(--text-muted)]" aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function LoadingSkeleton({
  className,
  lines = 3,
}: {
  className?: string;
  lines?: number;
}) {
  return (
    <div className={cn("space-y-3", className)} aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={cn("skeleton h-4", i === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

type AlertTone = "info" | "success" | "warning" | "error";

const alertConfig: Record<AlertTone, { icon: LucideIcon; className: string }> = {
  info: {
    icon: Info,
    className:
      "border-[color-mix(in_srgb,var(--status-info)_30%,white)] bg-[color-mix(in_srgb,var(--status-info)_8%,white)] text-[var(--status-info)]",
  },
  success: {
    icon: CheckCircle2,
    className:
      "border-[color-mix(in_srgb,var(--status-success)_30%,white)] bg-[color-mix(in_srgb,var(--status-success)_8%,white)] text-[var(--status-success)]",
  },
  warning: {
    icon: AlertTriangle,
    className:
      "border-[color-mix(in_srgb,var(--status-warning)_30%,white)] bg-[color-mix(in_srgb,var(--status-warning)_8%,white)] text-[var(--status-warning)]",
  },
  error: {
    icon: AlertCircle,
    className:
      "border-[color-mix(in_srgb,var(--status-error)_30%,white)] bg-[color-mix(in_srgb,var(--status-error)_8%,white)] text-[var(--status-error)]",
  },
};

export function InlineAlert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: AlertTone;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const config = alertConfig[tone];
  const Icon = config.icon;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-sm",
        config.className,
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="text-[var(--text-primary)]">
        {title ? <p className="font-medium">{title}</p> : null}
        <div className={cn(title && "mt-1", "text-[var(--text-secondary)]")}>{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card variant="muted" className={cn("text-center", className)} padding="lg">
      <h3 className="font-display text-xl text-[var(--text-primary)]">{title}</h3>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-secondary)]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </Card>
  );
}

export function ErrorState({
  title = "Nepodařilo se načíst data",
  description = "Zkontrolujte připojení a zkuste to znovu.",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <Card variant="danger" className={cn("text-center", className)} padding="lg">
      <h3 className="font-display text-xl">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-secondary)]">{description}</p>
      {onRetry ? (
        <div className="mt-6 flex justify-center">
          <Button type="button" variant="secondary" onClick={onRetry}>
            Zkusit znovu
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

export function Banner({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-b border-[var(--border-default)] bg-[var(--background-secondary)] px-4 py-3 text-sm text-[var(--text-secondary)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
