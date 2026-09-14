/**
 * Mortgage offer catalog — filter, sort, safe links, comparison metrics.
 * Prompt 13/8: transparent ordering, no hidden "best rate" badges.
 */

import type { CanonicalMortgageOffer, MortgageFreshness } from "@/integrations/hypotekajasne/schemas";
import { resolveMortgageFreshness } from "@/integrations/hypotekajasne/pipeline/freshness";
import {
  calculatePropertyFinancing,
  offerToFinancingOverrides,
  type PropertyFinancingInput,
  type PropertyFinancingSummary,
} from "@/domains/financing/property-financing";

export type MortgageOfferSortKey = "rate_asc" | "apr_asc" | "fixation_desc";

export const MORTGAGE_OFFER_SORT_LABELS: Record<MortgageOfferSortKey, string> = {
  rate_asc: "Sazba od (vzestupně)",
  apr_asc: "RPSN od (vzestupně)",
  fixation_desc: "Fixace (sestupně)",
};

const HYPOTEKAJASNE_TERMS_BASE = "https://www.hypotekajasne.cz/produkty";

/** Only active offers that are not stale — excludes review/inactive/stale rows. */
export function filterDisplayableMortgageOffers(
  offers: CanonicalMortgageOffer[],
  now = new Date(),
): CanonicalMortgageOffer[] {
  return offers.filter((offer) => {
    if (offer.status !== "active") return false;
    const freshness = resolveMortgageFreshness({
      dataTier: offer.dataTier,
      retrievedAt: offer.retrievedAt,
      verifiedAt: offer.verifiedAt,
      now,
    });
    return !freshness.isStale;
  });
}

export function sortMortgageOffers(
  offers: CanonicalMortgageOffer[],
  sortKey: MortgageOfferSortKey,
): CanonicalMortgageOffer[] {
  const sorted = [...offers];

  sorted.sort((a, b) => {
    if (sortKey === "rate_asc") {
      return a.interestRateFrom - b.interestRateFrom;
    }
    if (sortKey === "apr_asc") {
      const aprA = a.aprFrom ?? Number.POSITIVE_INFINITY;
      const aprB = b.aprFrom ?? Number.POSITIVE_INFINITY;
      return aprA - aprB;
    }
    const fixA = a.fixationYears ?? -1;
    const fixB = b.fixationYears ?? -1;
    return fixB - fixA;
  });

  return sorted;
}

export function offerFreshness(offer: CanonicalMortgageOffer, now = new Date()): MortgageFreshness {
  return resolveMortgageFreshness({
    dataTier: offer.dataTier,
    retrievedAt: offer.retrievedAt,
    verifiedAt: offer.verifiedAt,
    now,
  });
}

/** Safe public terms URL — never append user PII as query parameters. */
export function buildMortgageOfferTermsUrl(offer: CanonicalMortgageOffer): string {
  if (offer.termsUrl) {
    const parsed = new URL(offer.termsUrl);
    if (parsed.protocol === "https:") {
      return parsed.toString();
    }
  }
  const slug = offer.productSlug ?? offer.externalId ?? offer.id;
  return `${HYPOTEKAJASNE_TERMS_BASE}/${encodeURIComponent(slug)}`;
}

export type MortgageOfferComparisonRow = {
  offerId: string;
  bankName: string;
  productName: string;
  isSponsored: boolean;
  nominalRatePp: number;
  aprPp: number | null;
  fixationYears: number | null;
  ltvMaxPct: number | null;
  monthlyPaymentCzk: number | null;
  totalInterestCzk: number | null;
  ltvOnAskingPricePct: number | null;
  /** Monthly debt service (negative cash impact from loan). */
  monthlyDebtServiceCzk: number | null;
  summary: PropertyFinancingSummary;
};

export function buildMortgageOfferComparison(input: {
  offers: CanonicalMortgageOffer[];
  baseFinancingInput: PropertyFinancingInput;
}): MortgageOfferComparisonRow[] {
  return input.offers.map((offer) => {
    const overrides = offerToFinancingOverrides(offer);
    const summary = calculatePropertyFinancing({
      ...input.baseFinancingInput,
      ...overrides,
    });

    return {
      offerId: offer.id,
      bankName: offer.bankName,
      productName: offer.productName,
      isSponsored: offer.isSponsored ?? false,
      nominalRatePp: offer.interestRateFrom,
      aprPp: offer.aprFrom,
      fixationYears: offer.fixationYears,
      ltvMaxPct: offer.ltvMaxPct,
      monthlyPaymentCzk: summary.estimatedMonthlyPaymentCzk,
      totalInterestCzk: summary.totalInterestCzk,
      ltvOnAskingPricePct: summary.ltvOnAskingPricePct,
      monthlyDebtServiceCzk: summary.estimatedMonthlyPaymentCzk
        ? -summary.estimatedMonthlyPaymentCzk
        : null,
      summary,
    };
  });
}

export type FinancingRateSensitivityRow = {
  label: string;
  rateDeltaPp: number;
  nominalRatePp: number;
  monthlyPaymentCzk: number | null;
  totalInterestCzk: number | null;
  ltvOnAskingPricePct: number | null;
  monthlyDebtServiceCzk: number | null;
};

export function buildFinancingRateSensitivity(input: {
  baseFinancingInput: PropertyFinancingInput;
  deltasPp?: number[];
}): FinancingRateSensitivityRow[] {
  const baseRate = input.baseFinancingInput.nominalInterestRatePp;
  if (baseRate == null) return [];

  const deltas = input.deltasPp ?? [0, 1, 2];

  return deltas.map((delta) => {
    const nominalRatePp = Math.round((baseRate + delta) * 100) / 100;
    const summary = calculatePropertyFinancing({
      ...input.baseFinancingInput,
      nominalInterestRatePp: nominalRatePp,
    });

    const label =
      delta === 0
        ? "Současná modelovaná sazba"
        : delta === 1
          ? "Scénář +1 p.b."
          : delta === 2
            ? "Scénář +2 p.b."
            : `Scénář +${delta} p.b.`;

    return {
      label,
      rateDeltaPp: delta,
      nominalRatePp,
      monthlyPaymentCzk: summary.estimatedMonthlyPaymentCzk,
      totalInterestCzk: summary.totalInterestCzk,
      ltvOnAskingPricePct: summary.ltvOnAskingPricePct,
      monthlyDebtServiceCzk: summary.estimatedMonthlyPaymentCzk
        ? -summary.estimatedMonthlyPaymentCzk
        : null,
    };
  });
}

export function formatOfferRatePp(pp: number): string {
  return pp.toFixed(2).replace(".", ",") + "\u00a0%";
}
