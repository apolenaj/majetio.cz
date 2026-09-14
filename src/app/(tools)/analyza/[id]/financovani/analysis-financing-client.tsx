"use client";

/**
 * AnalysisFinancingClient — financing tab within property analysis.
 *
 * Connects PropertyFinancingCalculator scenario changes to the
 * Investment Engine (Part 4/5 will wire full orchestration).
 */

import * as React from "react";

import type {
  CanonicalMortgageOffer,
  MortgageFreshness,
} from "@/integrations/hypotekajasne";
import type { PassportState } from "@/lib/financial-passport/types";
import {
  PropertyFinancingCalculator,
  type FinancingScenarioPayload,
} from "@/components/financing";
import { InlineAlert } from "@/components/feedback/states";

export function AnalysisFinancingClient({
  analysisId,
  offers,
  freshness,
  isAuthenticated,
  passportState,
  callbackUrl,
  handoffSource,
  askingPriceCzk,
  valuationCzk,
}: {
  analysisId: string;
  offers: CanonicalMortgageOffer[];
  freshness: MortgageFreshness | null;
  isAuthenticated: boolean;
  passportState: PassportState | null;
  callbackUrl?: string;
  handoffSource?: string;
  /** Pre-fill from property snapshot — future: resolved from server analysis record. */
  askingPriceCzk?: number | null;
  valuationCzk?: number | null;
}) {
  const [lastScenario, setLastScenario] =
    React.useState<FinancingScenarioPayload | null>(null);

  function handleScenarioChange(payload: FinancingScenarioPayload) {
    setLastScenario(payload);
    // Deferred (product): wire analysis orchestration so InvestmentYieldCalculator
    // receives updated equity/loan/rate without a tab switch. Not a launch blocker.
  }

  return (
    <div className="space-y-6">
      {lastScenario && (
        <InlineAlert tone="info">
          Scénář aktualizován — úvěr{" "}
          <strong>
            {new Intl.NumberFormat("cs-CZ", {
              style: "currency",
              currency: "CZK",
              maximumFractionDigits: 0,
            }).format(lastScenario.loanCzk)}
          </strong>
          , sazba{" "}
          <strong>
            {lastScenario.interestRatePp.toFixed(2).replace(".", ",")} %
          </strong>
          . Přejděte do záložky <em>Analýza</em> pro aktualizované IRR a cash
          flow.
        </InlineAlert>
      )}

      <PropertyFinancingCalculator
        askingPriceCzk={askingPriceCzk}
        valuationCzk={valuationCzk}
        offers={offers}
        freshness={freshness}
        isAuthenticated={isAuthenticated}
        passportState={passportState}
        callbackUrl={callbackUrl}
        handoffSource={handoffSource ?? `analyza/${analysisId}/financovani`}
        analysisId={analysisId}
        onScenarioChange={handleScenarioChange}
      />
    </div>
  );
}
