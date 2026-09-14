import type { NormalizedOfferDraft } from "./types";

/** Keep best row per dedupeKey (lowest interest rate). */
export function deduplicateOffers(
  offers: NormalizedOfferDraft[],
): NormalizedOfferDraft[] {
  const map = new Map<string, NormalizedOfferDraft>();

  for (const offer of offers) {
    const existing = map.get(offer.dedupeKey);
    if (!existing || offer.interestRateFrom < existing.interestRateFrom) {
      map.set(offer.dedupeKey, offer);
    }
  }

  return [...map.values()];
}
