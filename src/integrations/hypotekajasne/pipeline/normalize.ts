import { MORTGAGE_OFFER_SCHEMA_VERSION } from "../version";
import type { ExternalMortgageOffer } from "../schemas";
import type { NormalizedOfferDraft, RateAnomaly } from "./types";

export function offerDedupeKey(offer: ExternalMortgageOffer): string {
  const fixation = offer.rates.fixationYears ?? "none";
  return `${offer.bank.name}::${offer.product.name}::${fixation}`;
}

export function normalizeExternalOffer(
  offer: ExternalMortgageOffer,
  input: {
    fetchedAt: Date;
    dataTier: "live" | "cached" | "verified";
    verifiedAt?: Date | null;
    anomalies?: RateAnomaly[];
  },
): NormalizedOfferDraft {
  const dedupeKey = offerDedupeKey(offer);
  const offerAnomalies = (input.anomalies ?? []).filter(
    (a) => a.offerKey === offer.externalId,
  );
  const needsReview = offerAnomalies.some(
    (a) =>
      a.severity === "critical" ||
      a.code === "missing_fixation" ||
      a.code === "rate_jump",
  );

  return {
    id: `mortgage-${offer.externalId}`,
    externalId: offer.externalId,
    bankName: offer.bank.name,
    productName: offer.product.name,
    interestRateFrom: offer.rates.interestFromPct,
    aprFrom: offer.rates.aprFromPct ?? null,
    fixationYears: offer.rates.fixationYears ?? null,
    ltvMaxPct: offer.ltv?.maxPct ?? null,
    ltvMinPct: offer.ltv?.minPct ?? null,
    fees: {
      arrangementFeeCzk: offer.fees?.arrangementCzk ?? null,
      valuationFeeCzk: offer.fees?.valuationCzk ?? null,
      monthlyFeeCzk: offer.fees?.monthlyCzk ?? null,
    },
    source: "hypotekajasne",
    status: needsReview ? "review_required" : "active",
    dataTier: input.dataTier,
    retrievedAt: input.fetchedAt,
    verifiedAt: input.verifiedAt ?? null,
    schemaVersion: MORTGAGE_OFFER_SCHEMA_VERSION,
    productSlug: offer.product.slug ?? null,
    isSponsored: offer.isSponsored ?? false,
    termsUrl: offer.termsUrl ?? null,
    dedupeKey,
    anomalies: offerAnomalies,
  };
}

export function normalizeExternalOffers(
  offers: ExternalMortgageOffer[],
  input: {
    fetchedAt: Date;
    dataTier: "live" | "cached" | "verified";
    verifiedAt?: Date | null;
    anomalies?: RateAnomaly[];
  },
): NormalizedOfferDraft[] {
  return offers.map((offer) => normalizeExternalOffer(offer, input));
}
