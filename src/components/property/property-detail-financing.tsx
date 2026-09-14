"use client";

/**
 * Property detail financing — full calculator + consent flow (Prompt 13/5).
 * Replaces legacy mock preview in Decision Cockpit.
 */

import type {
  CanonicalMortgageOffer,
  MortgageFreshness,
} from "@/integrations/hypotekajasne/schemas";
import type { PassportState } from "@/lib/financial-passport/types";
import type { MortgageLeadDuplicateInfo } from "@/domains/leads/schemas/mortgage-lead";
import { PropertyFinancingCalculator } from "@/components/financing";

export function PropertyDetailFinancing({
  propertyId,
  propertySlug,
  askingPriceCzk,
  valuationCzk,
  offers,
  freshness,
  isAuthenticated,
  passportState,
  activeFinancingLead = null,
}: {
  propertyId: string;
  propertySlug: string;
  askingPriceCzk: number | null;
  valuationCzk: number | null;
  offers: CanonicalMortgageOffer[];
  freshness: MortgageFreshness | null;
  isAuthenticated: boolean;
  passportState: PassportState | null;
  activeFinancingLead?: MortgageLeadDuplicateInfo | null;
}) {
  const returnPath = `/nemovitosti/${propertySlug}`;

  return (
    <section aria-labelledby="financing-heading" className="space-y-4">
      <div>
        <h2
          id="financing-heading"
          className="font-display text-xl text-[var(--text-primary)] sm:text-2xl"
        >
          Orientační financování
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
          Majetio neposkytuje úvěr. Orientační strukturu financování spočítáme z
          nabídkových sazeb HypotekaJasne a vašeho scénáře. Před předáním leadu
          vždy uvidíte náhled dat a výslovně potvrdíte souhlas.
        </p>
      </div>

      <PropertyFinancingCalculator
        askingPriceCzk={askingPriceCzk}
        valuationCzk={valuationCzk}
        offers={offers}
        freshness={freshness}
        isAuthenticated={isAuthenticated}
        passportState={passportState}
        callbackUrl={returnPath}
        handoffSource={`nemovitosti/${propertySlug}/financovani`}
        propertyId={propertyId}
        propertySlug={propertySlug}
        activeFinancingLead={activeFinancingLead}
      />
    </section>
  );
}
