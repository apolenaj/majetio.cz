import type { CompareResult, ExistingStoredOffer, NormalizedOfferDraft } from "./types";

export function compareWithStored(
  incoming: NormalizedOfferDraft[],
  stored: ExistingStoredOffer[],
): CompareResult[] {
  const storedByKey = new Map(stored.map((s) => [s.dedupeKey, s]));

  return incoming.map((offer) => {
    const previous = storedByKey.get(offer.dedupeKey);
    const previousRate = previous?.interestRateFrom ?? null;
    const deltaPp =
      previousRate != null
        ? Math.round((offer.interestRateFrom - previousRate) * 100) / 100
        : null;

    return {
      offerKey: offer.dedupeKey,
      previousInterestRateFrom: previousRate,
      interestRateFrom: offer.interestRateFrom,
      rateChanged: previousRate == null || previousRate !== offer.interestRateFrom,
      deltaPp,
    };
  });
}
