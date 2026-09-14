import type { CanonicalMortgageOffer } from "../schemas";
import type { ExistingStoredOffer } from "../pipeline/types";
import type { CompareResult } from "../pipeline/types";
import type { MortgageOfferStore } from "../pipeline/ingest";

type HistoryRow = {
  id: string;
  offerId: string;
  interestRateFrom: number;
  aprFrom: number | null;
  fixationYears: number | null;
  previousInterestRateFrom: number | null;
  previousAprFrom: number | null;
  changeDetectedAt: Date;
  source: string;
  ingestionRunId: string | null;
};

/** In-memory store for tests and dev — production uses PrismaMortgageOfferStore. */
export class InMemoryMortgageOfferStore implements MortgageOfferStore {
  private offers = new Map<string, ExistingStoredOffer>();
  history: HistoryRow[] = [];

  async listOffers(): Promise<ExistingStoredOffer[]> {
    return [...this.offers.values()];
  }

  async upsertOffers(
    offers: CanonicalMortgageOffer[],
    input: {
      runId: string;
      historyOnlyOnChange: boolean;
      comparisons: CompareResult[];
    },
  ): Promise<{ historyRowsCreated: number }> {
    let historyRowsCreated = 0;
    const comparisonByKey = new Map(
      input.comparisons.map((c) => [c.offerKey, c]),
    );

    for (const offer of offers) {
      const dedupeKey = `${offer.bankName}::${offer.productName}::${offer.fixationYears ?? "none"}`;
      const existing = [...this.offers.values()].find(
        (o) =>
          `${o.bankName}::${o.productName}::${o.fixationYears ?? "none"}` ===
          dedupeKey,
      );

      const comparison = comparisonByKey.get(dedupeKey);
      const shouldWriteHistory =
        !input.historyOnlyOnChange ||
        comparison?.rateChanged !== false ||
        existing == null;

      if (shouldWriteHistory && existing != null) {
        if (
          existing.interestRateFrom !== offer.interestRateFrom ||
          existing.aprFrom !== offer.aprFrom
        ) {
          this.history.push({
            id: `hist-${this.history.length + 1}`,
            offerId: offer.id,
            interestRateFrom: offer.interestRateFrom,
            aprFrom: offer.aprFrom,
            fixationYears: offer.fixationYears,
            previousInterestRateFrom: existing.interestRateFrom,
            previousAprFrom: existing.aprFrom,
            changeDetectedAt: new Date(),
            source: offer.source,
            ingestionRunId: input.runId,
          });
          historyRowsCreated += 1;
        }
      } else if (existing == null) {
        this.history.push({
          id: `hist-${this.history.length + 1}`,
          offerId: offer.id,
          interestRateFrom: offer.interestRateFrom,
          aprFrom: offer.aprFrom,
          fixationYears: offer.fixationYears,
          previousInterestRateFrom: null,
          previousAprFrom: null,
          changeDetectedAt: new Date(),
          source: offer.source,
          ingestionRunId: input.runId,
        });
        historyRowsCreated += 1;
      }

      this.offers.set(offer.id, {
        ...offer,
        dedupeKey,
      });
    }

    return { historyRowsCreated };
  }

  async markAllStale(): Promise<void> {
    for (const [id, offer] of this.offers) {
      this.offers.set(id, { ...offer, status: "stale" });
    }
  }
}

export function toExistingStored(
  offer: CanonicalMortgageOffer,
): ExistingStoredOffer {
  return {
    ...offer,
    dedupeKey: `${offer.bankName}::${offer.productName}::${offer.fixationYears ?? "none"}`,
  };
}
