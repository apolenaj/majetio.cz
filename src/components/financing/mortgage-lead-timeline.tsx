import { CheckCircle2, Circle, CircleDot } from "lucide-react";

import type { MortgageLeadTimelineStep } from "@/domains/leads/service/timeline";
import { cn } from "@/lib/utils";

export function MortgageLeadTimeline({
  steps,
  className,
}: {
  steps: MortgageLeadTimelineStep[];
  className?: string;
}) {
  return (
    <ol
      className={cn("space-y-0", className)}
      aria-label="Průběh financování"
    >
      {steps.map((step, index) => (
        <li
          key={step.id}
          className={cn(
            "relative flex gap-3 pb-6 last:pb-0",
            index < steps.length - 1 &&
              "before:absolute before:left-[11px] before:top-6 before:h-[calc(100%-1.25rem)] before:w-px before:bg-[var(--border-default)]",
          )}
        >
          <span className="relative z-[1] mt-0.5 shrink-0" aria-hidden>
            {step.state === "completed" ? (
              <CheckCircle2 className="size-6 text-[var(--status-success)]" />
            ) : step.state === "current" ? (
              <CircleDot className="size-6 text-[var(--action-primary)]" />
            ) : (
              <Circle className="size-6 text-[var(--text-muted)]" />
            )}
          </span>
          <div className="min-w-0 pt-0.5">
            <p
              className={cn(
                "text-sm font-medium",
                step.state === "upcoming"
                  ? "text-[var(--text-muted)]"
                  : "text-[var(--text-primary)]",
              )}
            >
              {step.label}
              {step.state === "current" ? (
                <span className="ml-2 text-xs font-normal text-[var(--action-primary)]">
                  aktuální
                </span>
              ) : null}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
