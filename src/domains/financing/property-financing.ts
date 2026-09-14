/**
 * PropertyFinancing domain model — Part 2/5 of HypotekaJasne integration.
 *
 * Responsibility:
 *   - Canonical input/output types for property-specific financing analysis
 *   - Pure calculation functions (no engine duplication — annuity delegates to
 *     `calculateAnnuityPayment` from the Investment Engine)
 *
 * NOT in scope here: IRR, cash flow projection, CoC — those live in the Investment Engine.
 * This layer only computes the "financing summary" that the Investment Engine later receives.
 */

import { z } from "zod";

import { resolveAssumptionDefaults } from "@/config/investment-assumptions";
import {
  Money,
  nominalInterestRateFromPercentPoints,
} from "@/domains/finance";
import {
  calculateAnnuityPayment,
  calculateLtv,
} from "@/domains/investment/engine";
import type { CanonicalMortgageOffer } from "@/integrations/hypotekajasne/schemas";

// ---------------------------------------------------------------------------
// Input model
// ---------------------------------------------------------------------------

export const propertyFinancingInputSchema = z.object({
  /** Asking / list price in CZK major units. */
  askingPriceCzk: z.number().int().positive(),
  /**
   * Bank / Valuation-Engine estimate in CZK major units.
   * May differ from asking price — affects max eligible loan if lower.
   */
  valuationCzk: z.number().int().positive().nullable(),
  /**
   * Equity the investor is prepared to bring in major CZK.
   * If null → derived from defaultEquityShareOfPrice.
   */
  userEquityCzk: z.number().int().nonnegative().nullable(),
  /**
   * Explicit loan amount override. If null → derived from price − equity.
   * Validated ≤ max eligible loan after LTV cap.
   */
  requestedLoanCzk: z.number().int().nonnegative().nullable(),
  termYears: z.number().int().min(1).max(50).default(30),
  /**
   * Nominal interest rate in percent-points (e.g. 5.25).
   * May come from a CanonicalMortgageOffer.interestRateFrom.
   */
  nominalInterestRatePp: z.number().min(0).max(30).nullable(),
  /**
   * APR / RPSN in percent-points — disclosure only, NOT used for annuity math.
   * Annuity is always computed from nominalInterestRatePp.
   */
  aprPp: z.number().min(0).max(30).nullable(),
  /** Max LTV the selected offer allows, in % (e.g. 80). */
  offerLtvMaxPct: z.number().min(0).max(100).nullable(),
  /**
   * Default equity share to apply when userEquityCzk is null (0–1).
   * Typically from ASSUMPTION_CONFIG.defaults.defaultEquityShare (0.4).
   */
  defaultEquityShareOfPrice: z.number().min(0).max(1).default(0.4),
});

export type PropertyFinancingInput = z.infer<typeof propertyFinancingInputSchema>;

// ---------------------------------------------------------------------------
// Output model
// ---------------------------------------------------------------------------

/** Tier of rate source — propagated from CanonicalMortgageOffer.dataTier. */
export type FinancingRateTier = "live" | "cached" | "verified" | "assumption";

export type PropertyFinancingSummary = {
  /** Price basis used for calculations (always askingPriceCzk). */
  purchasePriceCzk: number;
  /** Bank valuation if available; null if not provided. */
  valuationCzk: number | null;
  /**
   * Whether a valuation-vs-price gap warning applies.
   * True when valuation < askingPrice — LTV may be computed on valuation.
   */
  valuationBelowPriceWarning: boolean;
  /** Equity actually used (may come from input or derived from defaultEquityShare). */
  availableEquityCzk: number;
  /** Loan requested / derived in CZK. */
  requestedLoanCzk: number;
  /**
   * Maximum eligible loan based on offer LTV cap and valuation/price basis.
   * null when offerLtvMaxPct is unavailable.
   */
  maxEligibleLoanCzk: number | null;
  /**
   * Gap in CZK between requestedLoan and maxEligibleLoan.
   * Positive → shortfall ("chybí X Kč"). Null when maxEligibleLoanCzk is null.
   */
  financingGapCzk: number | null;
  /** LTV computed on asking price, percent (0–100). */
  ltvOnAskingPricePct: number | null;
  /** LTV computed on valuation (if available), percent (0–100). */
  ltvOnValuationPct: number | null;
  /** Nominal rate used (pp), null when no rate resolved. */
  nominalInterestRatePp: number | null;
  /** APR for disclosure — null when not available. */
  aprPp: number | null;
  /** Approximate monthly annuity payment in CZK, null when rate/loan missing. */
  estimatedMonthlyPaymentCzk: number | null;
  /** Total paid over full term in CZK, null when payment missing. */
  totalPaidCzk: number | null;
  /** Total interest paid in CZK, null when payment/loan missing. */
  totalInterestCzk: number | null;
  /** Term in years. */
  termYears: number;
  /** Data provenance tier for the rate used. */
  rateTier: FinancingRateTier;
  /**
   * Post-fixation rate assumption used in sensitivity context (pp).
   * Defaults to nominalInterestRatePp + 1 pp as conservative model assumption.
   */
  postFixationRateAssumptionPp: number | null;
  /**
   * Future refinance rate assumption (pp) — conservative model for IRR projections.
   * Defaults to postFixationRateAssumptionPp.
   */
  futureRefinanceRateAssumptionPp: number | null;
};

// ---------------------------------------------------------------------------
// Financing scenario (for Cash / 60% LTV / 80% LTV comparison)
// ---------------------------------------------------------------------------

export type FinancingScenarioKind = "cash" | "ltv60" | "ltv80" | "custom";

export type FinancingScenario = {
  kind: FinancingScenarioKind;
  label: string;
  equityCzk: number;
  loanCzk: number;
  ltvPct: number;
  monthlyPaymentCzk: number | null;
  leverageInsight: string;
};

// ---------------------------------------------------------------------------
// Pure calculation — main entry point
// ---------------------------------------------------------------------------

/**
 * Derives the LTV basis price:
 * - When valuation < askingPrice → banks typically use valuation for LTV
 * - Otherwise → askingPrice
 */
function ltvBasisPrice(
  askingPriceCzk: number,
  valuationCzk: number | null,
): number {
  if (valuationCzk !== null && valuationCzk < askingPriceCzk) {
    return valuationCzk;
  }
  return askingPriceCzk;
}

/**
 * Compute monthly annuity payment in major CZK.
 * Delegates to the Investment Engine — no duplicate math here.
 */
function resolveMonthlyPayment(
  loanCzk: number,
  nominalRatePp: number,
  termYears: number,
): number | null {
  if (loanCzk <= 0 || nominalRatePp <= 0) return null;
  try {
    const result = calculateAnnuityPayment({
      principal: Money.fromMajor(loanCzk, "CZK"),
      nominalInterestRate: nominalInterestRateFromPercentPoints(nominalRatePp),
      termYears,
    });
    return result.monthlyPayment.value.major.toNumber();
  } catch {
    return null;
  }
}

export function calculatePropertyFinancing(
  raw: PropertyFinancingInput,
): PropertyFinancingSummary {
  const input = propertyFinancingInputSchema.parse(raw);

  const {
    askingPriceCzk,
    valuationCzk,
    termYears,
    nominalInterestRatePp,
    aprPp,
    offerLtvMaxPct,
    defaultEquityShareOfPrice,
  } = input;

  // Equity resolution
  const availableEquityCzk =
    input.userEquityCzk ??
    Math.round(askingPriceCzk * defaultEquityShareOfPrice);

  // Loan resolution
  const requestedLoanCzk =
    input.requestedLoanCzk ?? Math.max(0, askingPriceCzk - availableEquityCzk);

  // LTV basis
  const basisForLtv = ltvBasisPrice(askingPriceCzk, valuationCzk);
  const valuationBelowPriceWarning =
    valuationCzk !== null && valuationCzk < askingPriceCzk;

  // LTV on asking price (nominal)
  let ltvOnAskingPricePct: number | null = null;
  if (requestedLoanCzk > 0) {
    try {
      const r = calculateLtv({
        loanPrincipal: Money.fromMajor(requestedLoanCzk, "CZK"),
        propertyValue: Money.fromMajor(askingPriceCzk, "CZK"),
      });
      ltvOnAskingPricePct = r.value.toPercentPoints().toNumber();
    } catch {
      ltvOnAskingPricePct = (requestedLoanCzk / askingPriceCzk) * 100;
    }
  }

  // LTV on valuation (if differs)
  let ltvOnValuationPct: number | null = null;
  if (valuationCzk !== null && requestedLoanCzk > 0) {
    ltvOnValuationPct = (requestedLoanCzk / valuationCzk) * 100;
  }

  // Max eligible loan from LTV cap
  let maxEligibleLoanCzk: number | null = null;
  if (offerLtvMaxPct !== null) {
    maxEligibleLoanCzk = Math.floor((basisForLtv * offerLtvMaxPct) / 100);
  }

  // Financing gap
  let financingGapCzk: number | null = null;
  if (maxEligibleLoanCzk !== null) {
    financingGapCzk = Math.max(0, requestedLoanCzk - maxEligibleLoanCzk);
  }

  // Payment math
  const monthlyPayment = nominalInterestRatePp
    ? resolveMonthlyPayment(requestedLoanCzk, nominalInterestRatePp, termYears)
    : null;
  const totalPaidCzk =
    monthlyPayment !== null ? monthlyPayment * termYears * 12 : null;
  const totalInterestCzk =
    totalPaidCzk !== null ? totalPaidCzk - requestedLoanCzk : null;

  // Post-fixation and refi assumptions (model, not live rates)
  const postFixationSpreadPp =
    resolveAssumptionDefaults().spreads.interestRatePp.conservative;
  const postFixationRateAssumptionPp =
    nominalInterestRatePp !== null
      ? nominalInterestRatePp + postFixationSpreadPp
      : null;

  return {
    purchasePriceCzk: askingPriceCzk,
    valuationCzk,
    valuationBelowPriceWarning,
    availableEquityCzk,
    requestedLoanCzk,
    maxEligibleLoanCzk,
    financingGapCzk,
    ltvOnAskingPricePct,
    ltvOnValuationPct,
    nominalInterestRatePp,
    aprPp,
    estimatedMonthlyPaymentCzk: monthlyPayment,
    totalPaidCzk,
    totalInterestCzk,
    termYears,
    rateTier: "assumption",
    postFixationRateAssumptionPp,
    futureRefinanceRateAssumptionPp: postFixationRateAssumptionPp,
  };
}

// ---------------------------------------------------------------------------
// Financing scenarios builder (Cash / 60% LTV / 80% LTV)
// ---------------------------------------------------------------------------

export function buildFinancingScenarios(
  askingPriceCzk: number,
  nominalInterestRatePp: number,
  termYears: number,
): FinancingScenario[] {
  const scenarios: Array<{
    kind: FinancingScenarioKind;
    label: string;
    ltvPct: number;
  }> = [
    { kind: "cash", label: "Hotovost", ltvPct: 0 },
    { kind: "ltv60", label: "60 % LTV", ltvPct: 60 },
    { kind: "ltv80", label: "80 % LTV", ltvPct: 80 },
  ];

  return scenarios.map(({ kind, label, ltvPct }) => {
    const loanCzk = Math.round(askingPriceCzk * (ltvPct / 100));
    const equityCzk = askingPriceCzk - loanCzk;
    const monthlyPaymentCzk =
      loanCzk > 0
        ? resolveMonthlyPayment(loanCzk, nominalInterestRatePp, termYears)
        : 0;

    const leverageInsight =
      ltvPct === 0
        ? "Žádný úvěr — maximální bezpečnost, nejnižší výnos na vlastní kapitál."
        : ltvPct <= 60
          ? "Konzervativní páka — nižší citlivost na změnu sazeb, zdravé DSCR."
          : "Vysoká páka — zvyšuje CoC výnos, ale citlivost na sazby a obsazenost roste.";

    return {
      kind,
      label,
      equityCzk,
      loanCzk,
      ltvPct,
      monthlyPaymentCzk: monthlyPaymentCzk ?? null,
      leverageInsight,
    };
  });
}

// ---------------------------------------------------------------------------
// Bridge: CanonicalMortgageOffer → PropertyFinancingInput partial
// ---------------------------------------------------------------------------

/**
 * Extracts financing parameters from a CanonicalMortgageOffer.
 * Use to pre-fill PropertyFinancingInput when user selects an offer.
 */
export function offerToFinancingOverrides(
  offer: CanonicalMortgageOffer,
): Pick<
  PropertyFinancingInput,
  "nominalInterestRatePp" | "aprPp" | "offerLtvMaxPct"
> {
  return {
    nominalInterestRatePp: offer.interestRateFrom,
    aprPp: offer.aprFrom ?? null,
    offerLtvMaxPct: offer.ltvMaxPct ?? null,
  };
}
