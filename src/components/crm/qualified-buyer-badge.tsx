/**
 * UI badge — Kvalifikovaný zájemce.
 * Explains what Majetio verified; never implies purchase guarantee.
 */

"use client";

import { BadgeCheck, Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipProvider } from "@/components/overlays/tooltip";
import { cn } from "@/lib/utils";
import type { QualificationCheck } from "@/domains/crm/qualification-rules";

export const QUALIFIED_BUYER_BADGE_LABEL_CS = "Kvalifikovaný zájemce" as const;

export const QUALIFIED_BUYER_DISCLAIMER_CS =
  "„Kvalifikovaný zájemce“ znamená splnění produktových kritérií Majetio (ověřený kontakt, známý rozpočet, stav financování). Nejde o garanci nákupu, úvěruschopnosti ani výsledku prohlídky." as const;

type QualifiedBuyerBadgeProps = {
  checks?: QualificationCheck[];
  explanationCs?: string;
  disclaimerCs?: string;
  className?: string;
  /** compact = badge only; detailed = badge + short line */
  variant?: "compact" | "detailed";
};

export function QualifiedBuyerBadge({
  checks,
  explanationCs,
  disclaimerCs = QUALIFIED_BUYER_DISCLAIMER_CS,
  className,
  variant = "compact",
}: QualifiedBuyerBadgeProps) {
  const passed =
    checks?.filter((c) => c.passed).map((c) => c.labelCs) ??
    ["Ověřený kontakt", "Známý rozpočet", "Stav financování"];

  const tipBody =
    explanationCs ??
    `Systém ověřil: ${passed.join(", ")}.`;

  const tipContent = (
    <div className="text-left leading-snug">
      <p className="font-medium">{QUALIFIED_BUYER_BADGE_LABEL_CS}</p>
      <p className="mt-1 opacity-90">{tipBody}</p>
      {checks && checks.length > 0 ? (
        <ul className="mt-2 list-disc space-y-0.5 pl-4 opacity-90">
          {checks.map((c) => (
            <li key={c.id}>
              {c.passed ? "✓" : "○"} {c.labelCs}: {c.explanationCs}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-2 opacity-90">{disclaimerCs}</p>
    </div>
  );

  return (
    <TooltipProvider>
      <div className={cn("inline-flex flex-col gap-1", className)}>
        <Tooltip content={tipContent}>
          <span className="inline-flex cursor-help">
            <Badge tone="success" className="gap-1">
              <BadgeCheck className="size-3.5" aria-hidden />
              {QUALIFIED_BUYER_BADGE_LABEL_CS}
              <Info className="size-3 opacity-70" aria-hidden />
            </Badge>
          </span>
        </Tooltip>
        {variant === "detailed" ? (
          <p className="max-w-md text-[var(--text-label-s)] text-[var(--text-secondary)]">
            {disclaimerCs}
          </p>
        ) : null}
      </div>
    </TooltipProvider>
  );
}
