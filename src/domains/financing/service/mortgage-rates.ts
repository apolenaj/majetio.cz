import {
  createHypotekaJasneClient,
  getDefaultMortgageOfferStore,
  ingestMortgageRates,
  resolveMortgageFreshness,
  type CanonicalMortgageOffer,
  type MortgageFreshness,
} from "@/integrations/hypotekajasne";

/**
 * Returns cached/verified offers from the ingestion store.
 * Triggers ingestion when store is empty (dev default).
 */
export async function getCachedMortgageOffers(): Promise<{
  offers: CanonicalMortgageOffer[];
  freshness: MortgageFreshness | null;
}> {
  const store = getDefaultMortgageOfferStore();
  let stored = await store.listOffers();

  if (stored.length === 0) {
    await ingestMortgageRates({ store });
    stored = await store.listOffers();
  }

  const offers = stored.map(({ dedupeKey: _dk, ...offer }) => offer);
  const primary = offers[0];

  return {
    offers,
    freshness: primary
      ? resolveMortgageFreshness({
          dataTier: primary.dataTier,
          retrievedAt: primary.retrievedAt,
          verifiedAt: primary.verifiedAt,
        })
      : null,
  };
}

export async function getMortgageRateFreshness(): Promise<MortgageFreshness | null> {
  const { freshness } = await getCachedMortgageOffers();
  return freshness;
}
