"use client";

/**
 * PropertyFinancingCalculator — full financing analysis shell (Prompt 13/2–3).
 *
 * Sections:
 *   1. Financial Passport preview (opt-in pre-fill — never silent)
 *   2. Input fields
 *   3. Available HypotekaJasne offers
 *   4. Financing summary (LTV, loan, gap, payment)
 *   5. Scenario comparison (Cash / 60% / 80% LTV)
 *   6. Mortgage readiness checklist + CTA
 *
 * Investment Engine impact via `onScenarioChange` callback — no engine duplication.
 */

import * as React from "react";

import {
  calculatePropertyFinancing,
  buildFinancingScenarios,
  computeOrientationalMortgageReadiness,
  buildReadinessInputFromPassport,
  applyScenarioOverride,
  offerToFinancingOverrides,
  type PropertyFinancingInput,
  type FinancingScenarioKind,
  type MortgageReadinessInput,
  type PassportScenarioOverride,
} from "@/domains/financing";
import {
  buildMortgageOfferComparison,
  filterDisplayableMortgageOffers,
  formatOfferRatePp,
  type MortgageOfferSortKey,
} from "@/domains/financing/mortgage-offer-catalog";
import type { HandoffContext } from "@/lib/financing/handoff-actions";
import type { MortgageLeadDuplicateInfo } from "@/domains/leads/schemas/mortgage-lead";
import type {
  CanonicalMortgageOffer,
  MortgageFreshness,
} from "@/integrations/hypotekajasne/schemas";
import type { PassportState } from "@/lib/financial-passport/types";
import { ASSUMPTION_CONFIG_V2026_07 } from "@/config/investment-assumptions";
import { Field } from "@/components/forms/field";
import { CurrencyInput, NumberInput } from "@/components/forms/inputs";
import { InlineAlert } from "@/components/feedback/states";

import { MortgageOfferCatalogSection } from "./mortgage-offer-catalog-section";
import { MortgageOfferComparison } from "./mortgage-offer-comparison";
import { FinancingRateSensitivityPanel } from "./financing-rate-sensitivity-panel";
import { PropertyFinancingSummaryCard } from "./property-financing-summary";
import { FinancingScenarioCompare } from "./financing-scenario-compare";
import { FinancialPassportPreview } from "./financial-passport-preview";
import { MortgageReadinessCard } from "./mortgage-readiness-card";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type FinancingScenarioPayload = {
  equityCzk: number;
  loanCzk: number;
  interestRatePp: number;
  termYears: number;
  /** APR for display only — not used for payment math. */
  aprPp: number | null;
};

export type PropertyFinancingCalculatorProps = {
  /** Asking price pre-filled from property context. */
  askingPriceCzk?: number | null;
  /** Valuation from Valuation Engine (may differ). */
  valuationCzk?: number | null;
  /** HypotekaJasne offers from ingestion pipeline. */
  offers?: CanonicalMortgageOffer[];
  freshness?: MortgageFreshness | null;
  /** Auth state — server resolves, passed as prop (no client auth hooks). */
  isAuthenticated?: boolean;
  /** Financial Passport from server — null if not authenticated or not filled. */
  passportState?: PassportState | null;
  /** Callback URL for login redirect. */
  callbackUrl?: string;
  /** Source tag for handoff analytics. */
  handoffSource?: string;
  /** Optional analysis/property reference for mortgage lead context. */
  analysisId?: string;
  propertyId?: string;
  propertySlug?: string;
  /** Active mortgage lead for this property/analysis — switches CTA to status view. */
  activeFinancingLead?: MortgageLeadDuplicateInfo | null;
  /**
   * Called when user selects a scenario — parent should feed these values
   * into InvestmentYieldCalculator to update CoC / DSCR / IRR.
   */
  onScenarioChange?: (payload: FinancingScenarioPayload) => void;
};

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULTS = ASSUMPTION_CONFIG_V2026_07.defaults;

function deriveDefaultRate(offers: CanonicalMortgageOffer[]): number {
  const active = offers.filter((o) => o.status === "active");
  if (active.length === 0) return DEFAULTS.interestRatePp;
  return active.reduce(
    (min, o) => Math.min(min, o.interestRateFrom),
    active[0]?.interestRateFrom ?? DEFAULTS.interestRatePp,
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PropertyFinancingCalculator({
  askingPriceCzk,
  valuationCzk,
  offers = [],
  freshness,
  isAuthenticated = false,
  passportState = null,
  callbackUrl,
  handoffSource,
  analysisId,
  propertyId,
  propertySlug,
  activeFinancingLead = null,
  onScenarioChange,
}: PropertyFinancingCalculatorProps) {
  // User inputs
  const [price, setPrice] = React.useState<number | null>(
    askingPriceCzk ?? null,
  );
  const [equity, setEquity] = React.useState<number | null>(null);
  const [termYears, setTermYears] = React.useState<number>(DEFAULTS.termYears);
  const [scenarioKind, setScenarioKind] =
    React.useState<FinancingScenarioKind>("ltv60");

  // Passport-derived overrides for this scenario only
  const [scenarioOverride, setScenarioOverride] =
    React.useState<PassportScenarioOverride>({});

  const displayableOffers = React.useMemo(
    () => filterDisplayableMortgageOffers(offers),
    [offers],
  );

  const [selectedOfferId, setSelectedOfferId] = React.useState<string | null>(
    () => displayableOffers[0]?.id ?? null,
  );
  const [compareOfferIds, setCompareOfferIds] = React.useState<string[]>([]);
  const [sortKey, setSortKey] = React.useState<MortgageOfferSortKey>("rate_asc");

  React.useEffect(() => {
    if (
      selectedOfferId &&
      displayableOffers.some((o) => o.id === selectedOfferId)
    ) {
      return;
    }
    setSelectedOfferId(displayableOffers[0]?.id ?? null);
  }, [displayableOffers, selectedOfferId]);

  const selectedOffer =
    displayableOffers.find((o) => o.id === selectedOfferId) ??
    displayableOffers[0] ??
    null;

  const offerOverrides = selectedOffer
    ? offerToFinancingOverrides(selectedOffer)
    : null;

  const nominalRatePp =
    offerOverrides?.nominalInterestRatePp ?? deriveDefaultRate(offers);
  const aprPp = offerOverrides?.aprPp ?? selectedOffer?.aprFrom ?? null;
  const ltvMaxPct = offerOverrides?.offerLtvMaxPct ?? selectedOffer?.ltvMaxPct ?? null;

  // Build financing input
  const financingInput: PropertyFinancingInput = {
    askingPriceCzk: price ?? 4_000_000,
    valuationCzk: valuationCzk ?? null,
    userEquityCzk: equity,
    requestedLoanCzk: null,
    termYears,
    nominalInterestRatePp: nominalRatePp,
    aprPp,
    offerLtvMaxPct: ltvMaxPct,
    defaultEquityShareOfPrice: DEFAULTS.defaultEquityShare,
  };

  const summary = calculatePropertyFinancing(financingInput);

  // Build comparison scenarios
  const scenarios = buildFinancingScenarios(
    summary.purchasePriceCzk,
    nominalRatePp,
    termYears,
  );

  // Readiness: merge passport + scenario overrides
  const baseReadinessInput: MortgageReadinessInput =
    buildReadinessInputFromPassport(passportState, summary, isAuthenticated);
  const effectiveReadinessInput: MortgageReadinessInput = applyScenarioOverride(
    baseReadinessInput,
    scenarioOverride,
  );
  const readiness = computeOrientationalMortgageReadiness({
    readinessInput: effectiveReadinessInput,
    financingSummary: summary,
    propertyPurpose: "investment",
    marketCountry: "CZ",
  });

  const handoffContext: HandoffContext = {
    analysisId,
    propertyId,
    propertySlug,
    purchasePriceCzk: summary.purchasePriceCzk,
    ...(valuationCzk != null ? { valuationCzk } : {}),
    requestedLoanCzk: summary.requestedLoanCzk,
    ltvOnAskingPricePct: summary.ltvOnAskingPricePct,
    nominalInterestRatePp: nominalRatePp,
    aprPp: aprPp,
    termYears,
    estimatedMonthlyPaymentCzk: summary.estimatedMonthlyPaymentCzk,
  };

  const financingInputForCompare: PropertyFinancingInput = {
    askingPriceCzk: summary.purchasePriceCzk,
    valuationCzk: valuationCzk ?? null,
    userEquityCzk: equity,
    requestedLoanCzk: null,
    termYears,
    nominalInterestRatePp: nominalRatePp,
    aprPp,
    offerLtvMaxPct: ltvMaxPct,
    defaultEquityShareOfPrice: DEFAULTS.defaultEquityShare,
  };

  const compareOffers = displayableOffers.filter((o) =>
    compareOfferIds.includes(o.id),
  );
  const comparisonRows =
    compareOffers.length >= 2
      ? buildMortgageOfferComparison({
          offers: compareOffers,
          baseFinancingInput: financingInputForCompare,
        })
      : [];

  function handleToggleCompare(offerId: string) {
    setCompareOfferIds((prev) => {
      if (prev.includes(offerId)) {
        return prev.filter((id) => id !== offerId);
      }
      if (prev.length >= 4) return prev;
      return [...prev, offerId];
    });
  }

  function handleSelectOffer(offerId: string) {
    setSelectedOfferId(offerId);
  }

  // Notify parent when scenario or key params change
  React.useEffect(() => {
    const selected =
      scenarios.find((s) => s.kind === scenarioKind) ??
      (scenarios.length > 0 ? scenarios[0] : undefined);
    if (!selected) return;
    onScenarioChange?.({
      equityCzk: selected.equityCzk,
      loanCzk: selected.loanCzk,
      interestRatePp: nominalRatePp,
      termYears,
      aprPp,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioKind, nominalRatePp, termYears, price, equity]);

  // Passport pre-fill handler — explicit user action only
  function handlePassportApply(input: MortgageReadinessInput) {
    if (input.availableEquityCzk != null) {
      setEquity(input.availableEquityCzk);
    }
    // Income/liabilities go into override (affect readiness only, not core calc)
    setScenarioOverride({
      monthlyIncomeCzk: input.monthlyIncomeCzk,
      monthlyLiabilitiesCzk: input.monthlyLiabilitiesCzk,
    });
  }

  return (
    <div className="space-y-10">

      {/* Section 0: Financial Passport preview */}
      <section aria-labelledby="passport-heading">
        <h3
          id="passport-heading"
          className="text-base font-semibold text-[var(--text-primary)] mb-4"
        >
          Finanční pas
        </h3>
        <FinancialPassportPreview
          isAuthenticated={isAuthenticated}
          passportState={passportState}
          financingSummary={summary}
          callbackUrl={callbackUrl}
          onApplyPassport={handlePassportApply}
        />
      </section>

      {/* Section 1: Inputs */}
      <section aria-labelledby="financing-inputs-heading">
        <h3
          id="financing-inputs-heading"
          className="text-base font-semibold text-[var(--text-primary)] mb-4"
        >
          Vstupní parametry
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field
            id="fin-price"
            label="Kupní cena"
            helperText="Požadovaná / nabídková cena nemovitosti"
          >
            <CurrencyInput
              id="fin-price"
              value={price}
              onValueChange={setPrice}
              placeholder="4 000 000"
            />
          </Field>
          <Field
            id="fin-equity"
            label="Vlastní kapitál"
            helperText={`Ponecháte-li prázdné, počítáme s ${DEFAULTS.defaultEquityShare * 100}\u00a0%`}
          >
            <CurrencyInput
              id="fin-equity"
              value={equity}
              onValueChange={setEquity}
              placeholder={
                price
                  ? String(Math.round(price * DEFAULTS.defaultEquityShare))
                  : "1 600 000"
              }
            />
          </Field>
          <Field id="fin-term" label="Splatnost" helperText="Roky">
            <NumberInput
              id="fin-term"
              value={termYears}
              onValueChange={(v) => setTermYears(v ?? DEFAULTS.termYears)}
              min={1}
              max={50}
              step={5}
            />
          </Field>
        </div>
        {!askingPriceCzk && (
          <InlineAlert tone="info" className="mt-3">
            Kalkulačka funguje bez napojení na konkrétní nemovitost. Zadejte
            kupní cenu výše.
          </InlineAlert>
        )}
      </section>

      {offers.length > 0 && (
        <>
          <MortgageOfferCatalogSection
            offers={offers}
            globalFreshness={freshness}
            selectedOfferId={selectedOfferId}
            compareOfferIds={compareOfferIds}
            sortKey={sortKey}
            onSortKeyChange={setSortKey}
            onSelectOffer={handleSelectOffer}
            onToggleCompareOffer={handleToggleCompare}
          />

          {comparisonRows.length >= 2 ? (
            <MortgageOfferComparison rows={comparisonRows} />
          ) : null}
        </>
      )}

      {selectedOffer ? (
        <InlineAlert tone="info">
          Modelováno se sazbou{" "}
          <strong>{formatOfferRatePp(selectedOffer.interestRateFrom)}</strong> (
          {selectedOffer.bankName} — {selectedOffer.productName}). Splátka a LTV
          v přehledu odpovídají této nabídce.
        </InlineAlert>
      ) : null}

      {/* Section 3: Financing summary */}
      <section aria-labelledby="financing-summary-heading">
        <h3
          id="financing-summary-heading"
          className="text-base font-semibold text-[var(--text-primary)] mb-4"
        >
          Přehled financování
        </h3>
        <PropertyFinancingSummaryCard summary={summary} />
      </section>

      <FinancingRateSensitivityPanel
        baseFinancingInput={financingInputForCompare}
        modeledRatePp={nominalRatePp}
      />

      {/* Section 4: Scenario comparison */}
      <section aria-labelledby="financing-scenarios-heading">
        <h3
          id="financing-scenarios-heading"
          className="text-base font-semibold text-[var(--text-primary)] mb-4"
        >
          Srovnání scénářů
        </h3>
        <FinancingScenarioCompare
          scenarios={scenarios}
          selectedKind={scenarioKind}
          onSelect={(kind) => setScenarioKind(kind as FinancingScenarioKind)}
        />
      </section>

      {/* Section 5: Readiness + CTA */}
      <section aria-labelledby="readiness-heading">
        <h3
          id="readiness-heading"
          className="text-base font-semibold text-[var(--text-primary)] mb-4"
        >
          Připravenost k financování
        </h3>
        <MortgageReadinessCard
          readiness={readiness}
          isAuthenticated={isAuthenticated}
          callbackUrl={callbackUrl}
          source={handoffSource ?? "kalkulacky/financovani"}
          handoffContext={handoffContext}
          activeFinancingLead={activeFinancingLead}
        />
      </section>
    </div>
  );
}
