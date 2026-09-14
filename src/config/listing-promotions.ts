/**
 * Listing Promotion Engine config — paid Boost products.
 *
 * FIREWALL: Boost never affects Majetio Score, valuation, risk, or organic ranking.
 * Disclosure label is mandatory on every sponsored surface.
 */

export const SPONSORED_LABEL_CS = "Sponzorováno" as const;

export const LISTING_BOOST_PRODUCT_KEYS = [
  "boost_7_days",
  "boost_30_days",
] as const;

export type ListingBoostProductKey = (typeof LISTING_BOOST_PRODUCT_KEYS)[number];

export function isListingBoostProductKey(
  value: string,
): value is ListingBoostProductKey {
  return (LISTING_BOOST_PRODUCT_KEYS as readonly string[]).includes(value);
}

export const boost7DaysProduct = {
  productKey: "boost_7_days" as const,
  product: "BOOST_7_DAYS" as const,
  nameCs: "Boost 7 dní",
  durationDays: 7,
  /** Explicit product contract — never flip these to true. */
  firewall: {
    affectsMajetioScore: false,
    affectsValuation: false,
    affectsRiskAnalysis: false,
    affectsOrganicRanking: false,
  },
  sponsoredLabel: SPONSORED_LABEL_CS,
} as const;

export const boost30DaysProduct = {
  productKey: "boost_30_days" as const,
  product: "BOOST_30_DAYS" as const,
  nameCs: "Boost 30 dní",
  durationDays: 30,
  firewall: {
    affectsMajetioScore: false,
    affectsValuation: false,
    affectsRiskAnalysis: false,
    affectsOrganicRanking: false,
  },
  sponsoredLabel: SPONSORED_LABEL_CS,
} as const;

export const listingBoostProducts = {
  boost_7_days: boost7DaysProduct,
  boost_30_days: boost30DaysProduct,
} as const;

export function durationDaysForBoostKey(key: string): number {
  if (isListingBoostProductKey(key)) {
    return listingBoostProducts[key].durationDays;
  }
  return 0;
}

/** Max sponsored slots per discovery page (separate from organic page size). */
export const SPONSORED_PLACEMENTS_PER_PAGE = 3;
