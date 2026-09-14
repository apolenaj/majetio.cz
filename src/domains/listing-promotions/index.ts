/**
 * Listing Promotion Engine — paid Boost / sponsored placements.
 *
 * FIREWALL: never affects Majetio Score, valuation, risk, or organic ranking.
 */

export {
  assertBoostEligibility,
  productEnumForKey,
  type BoostEligibilityProperty,
  type BoostEligibilityResult,
} from "./eligibility";

export {
  activateListingBoost,
  checkPropertyBoostEligibility,
  expireListingBoosts,
  sweepAndCountActiveBoosts,
  revokeListingBoost,
  listActiveBoostsForProperty,
} from "./service";

export {
  fetchSponsoredPlacements,
  composeDiscoverySearchPage,
  type SponsoredPlacementDto,
  type DiscoverySearchPageDto,
  type SponsoredPlacementFilters,
} from "./sponsored-search";

export { loadSponsoredPropertyCards } from "./load-sponsored-cards";

export {
  COMMERCIAL_FIREWALL_CONTRACT,
  FORBIDDEN_COMMERCIAL_FEATURE_KEYS,
  assertProductFirewallHardFalse,
  scrubCommercialSignalsFromFeatures,
  majetioScoreIntegrityFingerprint,
  assertScoreUnchangedByBoost,
  detectCommercialContamination,
} from "./commercial-firewall";

export {
  SPONSORED_LABEL_CS,
  SPONSORED_PLACEMENTS_PER_PAGE,
  boost7DaysProduct,
  boost30DaysProduct,
  listingBoostProducts,
  isListingBoostProductKey,
  type ListingBoostProductKey,
} from "@/config/listing-promotions";
