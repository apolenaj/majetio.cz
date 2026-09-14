import Link from "next/link";

import { InlineAlert } from "@/components/feedback/states";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import type { FeatureAccessResult } from "@/domains/entitlements";

/**
 * Paywall / gate UI when assertFeatureAccess denies a paid feature.
 */
export function EntitlementPaywall({
  result,
  title = "Tato část vyžaduje placený přístup",
}: {
  result: Extract<FeatureAccessResult, { allowed: false }>;
  title?: string;
}) {
  return (
    <Card className="space-y-4 p-6">
      <InlineAlert tone="warning" title={title}>
        {result.reason}
      </InlineAlert>
      <p className="text-sm text-[var(--text-secondary)]">
        Feature <code>{result.feature}</code> · kód{" "}
        <code>{result.code}</code>. Přístup vzniká až po potvrzení platby
        webhookem — ne předem z UI.
      </p>
      <div className="flex flex-wrap gap-2">
        <ButtonLink href="/cenik" variant="primary">
          Zobrazit ceník
        </ButtonLink>
        <ButtonLink href="/checkout?product=buyer_pass" variant="secondary">
          Buyer Pass
        </ButtonLink>
        <ButtonLink href="/checkout?product=deep_analysis" variant="outline">
          Deep Analysis
        </ButtonLink>
      </div>
      <p className="text-xs text-[var(--text-muted)]">
        <Link href="/ucet/objednavky" className="underline">
          Moje objednávky
        </Link>
      </p>
    </Card>
  );
}
