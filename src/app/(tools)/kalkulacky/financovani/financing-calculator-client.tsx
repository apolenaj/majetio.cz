"use client";

import type {
  CanonicalMortgageOffer,
  MortgageFreshness,
} from "@/integrations/hypotekajasne";
import type { PassportState } from "@/lib/financial-passport/types";
import { PropertyFinancingCalculator } from "@/components/financing";

export function FinancingCalculatorClient({
  offers,
  freshness,
  isAuthenticated,
  passportState,
  callbackUrl,
  handoffSource,
}: {
  offers: CanonicalMortgageOffer[];
  freshness: MortgageFreshness | null;
  isAuthenticated: boolean;
  passportState: PassportState | null;
  callbackUrl?: string;
  handoffSource?: string;
}) {
  return (
    <PropertyFinancingCalculator
      offers={offers}
      freshness={freshness}
      isAuthenticated={isAuthenticated}
      passportState={passportState}
      callbackUrl={callbackUrl}
      handoffSource={handoffSource}
    />
  );
}
