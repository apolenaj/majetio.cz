"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { HelpCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return (
    <TooltipPrimitive.Provider delayDuration={200}>{children}</TooltipPrimitive.Provider>
  );
}

export function Tooltip({
  content,
  children,
  side = "top",
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className="z-[70] max-w-xs rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-inverse)] px-3 py-2 text-xs text-[var(--text-inverse)] shadow-[var(--shadow-overlay)]"
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-[var(--surface-inverse)]" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

/** Prefer InfoTooltip + visible explanation on mobile for critical content. */
export function InfoTooltip({
  label,
  content,
  className,
}: {
  label: string;
  content: React.ReactNode;
  className?: string;
}) {
  return (
    <Tooltip content={content}>
      <button
        type="button"
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--background-secondary)] hover:text-[var(--text-primary)]",
          className,
        )}
        aria-label={label}
      >
        <HelpCircle className="size-4" aria-hidden />
      </button>
    </Tooltip>
  );
}

export function MetricExplanation({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <details
      className={cn(
        "rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--background-secondary)] px-4 py-3 text-sm",
        className,
      )}
    >
      <summary className="cursor-pointer font-medium text-[var(--text-primary)]">
        {title}
      </summary>
      <div className="mt-2 text-[var(--text-secondary)]">{children}</div>
    </details>
  );
}

/** @deprecated Prefer `DataSourceBadge` from `@/components/trust`. */
export function DataSource({
  source,
  updatedAt,
  className,
}: {
  source: string;
  updatedAt?: string;
  className?: string;
}) {
  return (
    <p className={cn("text-[var(--text-caption)] text-[var(--text-muted)]", className)}>
      Zdroj: {source}
      {updatedAt ? ` · Aktualizováno ${updatedAt}` : null}
    </p>
  );
}

/** Re-export Trust-by-Design confidence control. */
export { ConfidenceIndicator } from "@/components/trust/confidence-indicator";

