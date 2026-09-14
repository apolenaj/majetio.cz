/**
 * Mandatory disclosure for sponsored listing placements.
 */

import { Badge } from "@/components/ui/badge";
import { SPONSORED_LABEL_CS } from "@/config/listing-promotions";
import { cn } from "@/lib/utils";

export function SponsoredListingBadge({ className }: { className?: string }) {
  return (
    <Badge tone="warning" className={cn("gap-1", className)}>
      {SPONSORED_LABEL_CS}
    </Badge>
  );
}

export const SPONSORED_FIREWALL_DISCLAIMER_CS =
  "Sponzorované umístění neovlivňuje Majetio Score, valuaci ani organické doporučení." as const;
