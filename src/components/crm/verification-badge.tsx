/**
 * Verification badge — ONLY when identity/org verified (162/163).
 * Never shown for UNVERIFIED.
 */

import { BadgeCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipProvider } from "@/components/overlays/tooltip";
import { cn } from "@/lib/utils";
import { resolveVerificationBadge } from "@/domains/organizations/broker-onboarding";
import type { ListingVerificationStatus } from "@prisma/client";

type Props = {
  status: ListingVerificationStatus;
  className?: string;
};

export function VerificationBadge({ status, className }: Props) {
  const badge = resolveVerificationBadge(status);
  if (!badge) return null;

  return (
    <TooltipProvider>
      <Tooltip
        content={
          <div className="max-w-xs text-left text-sm leading-snug">
            <p className="font-medium">{badge.labelCs}</p>
            <p className="mt-1 opacity-90">{badge.explanationCs}</p>
          </div>
        }
      >
        <span className={cn("inline-flex cursor-help", className)}>
          <Badge tone="info" className="gap-1">
            <BadgeCheck className="size-3.5" aria-hidden />
            {badge.labelCs}
          </Badge>
        </span>
      </Tooltip>
    </TooltipProvider>
  );
}
