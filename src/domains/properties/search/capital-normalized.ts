/**
 * Capital-normalized search (Rules 193–195).
 * Compare listings by buyer's equity in *home* currency via frozen FX —
 * never mix raw AED vs CZK asking prices in one sort without conversion.
 */

import { Money } from "@/domains/finance/primitives/money";
import { assertCurrencyCode } from "@/domains/finance/primitives/currency";
import {
  convertMoneyWithFxEngine,
  type FxRateStore,
  type FxResolveMode,
  FxUnavailableError,
} from "@/domains/finance/fx/engine";
import type { ExchangeRateSnapshot } from "@/domains/finance/fx/exchange-rate";

export type CapitalNormalizedListingInput = {
  listingId: string;
  marketCode: string;
  /** Asking / estimated purchase price in listing currency (major). */
  priceMajor: number;
  currency: string;
  /**
   * Estimated cash equity required (down payment + costs) in listing currency.
   * When omitted, uses priceMajor * equityRatio.
   */
  equityMajor?: number | null;
  equityRatio?: number;
};

export type CapitalNormalizedHit = {
  listingId: string;
  marketCode: string;
  listingCurrency: string;
  /** Equity in listing currency (major). */
  equityListingMajor: number;
  /** Equity in buyer's home currency (major). */
  equityHomeMajor: number | null;
  homeCurrency: string;
  fxStatus: string | null;
  unavailableReason?: string;
};

/**
 * Normalize listing equity into the buyer's home currency for cross-market sort/filter.
 */
export function normalizeListingsByHomeCapital(input: {
  listings: CapitalNormalizedListingInput[];
  homeCurrency: string;
  store: FxRateStore;
  mode?: FxResolveMode;
  asOf?: Date;
  /** Optional pinned rates for reproducibility (scenario / saved search). */
  pinnedByPair?: Record<string, ExchangeRateSnapshot>;
}): CapitalNormalizedHit[] {
  const home = assertCurrencyCode(input.homeCurrency);

  return input.listings.map((listing) => {
    const listingCurrency = assertCurrencyCode(listing.currency);
    const ratio = listing.equityRatio ?? 0.2;
    const equityListing =
      listing.equityMajor != null
        ? listing.equityMajor
        : listing.priceMajor * ratio;

    if (listingCurrency === home) {
      return {
        listingId: listing.listingId,
        marketCode: listing.marketCode,
        listingCurrency,
        equityListingMajor: equityListing,
        equityHomeMajor: equityListing,
        homeCurrency: home,
        fxStatus: "IDENTITY",
      };
    }

    const pairKey = `${listingCurrency}/${home}`;
    try {
      const { money, resolution } = convertMoneyWithFxEngine({
        amount: Money.fromMajor(equityListing, listingCurrency),
        targetCurrency: home,
        store: input.store,
        mode: input.mode ?? "ALLOW_STALE",
        asOf: input.asOf,
        pinned: input.pinnedByPair?.[pairKey] ?? null,
      });
      return {
        listingId: listing.listingId,
        marketCode: listing.marketCode,
        listingCurrency,
        equityListingMajor: equityListing,
        equityHomeMajor: money.toMajorNumber(),
        homeCurrency: home,
        fxStatus: resolution.status,
      };
    } catch (e) {
      const reason =
        e instanceof FxUnavailableError
          ? e.message
          : e instanceof Error
            ? e.message
            : "FX unavailable";
      return {
        listingId: listing.listingId,
        marketCode: listing.marketCode,
        listingCurrency,
        equityListingMajor: equityListing,
        equityHomeMajor: null,
        homeCurrency: home,
        fxStatus: "UNAVAILABLE",
        unavailableReason: reason,
      };
    }
  });
}

/** Sort ascending by home equity; unavailable FX sorts last. */
export function sortByHomeCapital(
  hits: CapitalNormalizedHit[],
): CapitalNormalizedHit[] {
  return [...hits].sort((a, b) => {
    if (a.equityHomeMajor == null && b.equityHomeMajor == null) return 0;
    if (a.equityHomeMajor == null) return 1;
    if (b.equityHomeMajor == null) return -1;
    return a.equityHomeMajor - b.equityHomeMajor;
  });
}
