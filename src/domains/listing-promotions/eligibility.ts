/**
 * Boost eligibility — inactive / banned / unverified listings cannot promote.
 * Pure predicates (no DB) for tests + service gates.
 */

import type { ListingBoostProductKey } from "@/config/listing-promotions";
import { isListingBoostProductKey } from "@/config/listing-promotions";

export type BoostEligibilityProperty = {
  status: string;
  visibility: string;
  listingVerificationStatus: string;
  listingQuotaState: string;
  listingModerationStatus: string;
  isDemo: boolean;
};

export type BoostEligibilityResult =
  | { ok: true }
  | {
      ok: false;
      code:
        | "inactive"
        | "not_public"
        | "unverified"
        | "over_limit"
        | "banned"
        | "restricted"
        | "demo"
        | "unknown_product";
      reason: string;
    };

/**
 * Eligibility for purchasing / keeping an active Boost.
 * Unverified, inactive, over-quota, restricted, or banned → reject.
 */
export function assertBoostEligibility(
  property: BoostEligibilityProperty,
  productKey?: string,
): BoostEligibilityResult {
  if (productKey != null && !isListingBoostProductKey(productKey)) {
    return {
      ok: false,
      code: "unknown_product",
      reason: "Neznámý boost produkt.",
    };
  }

  if (property.isDemo) {
    return {
      ok: false,
      code: "demo",
      reason: "Demo nabídky nelze promovat.",
    };
  }

  if (property.status !== "ACTIVE") {
    return {
      ok: false,
      code: "inactive",
      reason: "Promovat lze jen aktivní inzeráty.",
    };
  }

  if (property.visibility !== "PUBLIC") {
    return {
      ok: false,
      code: "not_public",
      reason: "Promovat lze jen veřejné inzeráty.",
    };
  }

  if (property.listingModerationStatus === "BANNED") {
    return {
      ok: false,
      code: "banned",
      reason: "Zakázané inzeráty nelze promovat.",
    };
  }

  if (property.listingModerationStatus === "RESTRICTED") {
    return {
      ok: false,
      code: "restricted",
      reason: "Omezené inzeráty nelze promovat.",
    };
  }

  if (property.listingVerificationStatus === "UNVERIFIED") {
    return {
      ok: false,
      code: "unverified",
      reason: "Neověřené inzeráty nelze promovat — nejdřív ověřte identitu nebo organizaci.",
    };
  }

  if (property.listingQuotaState === "OVER_LIMIT") {
    return {
      ok: false,
      code: "over_limit",
      reason: "Nabídka nad limitem tarifu nelze promovat.",
    };
  }

  return { ok: true };
}

export function productEnumForKey(
  key: ListingBoostProductKey,
): "BOOST_7_DAYS" | "BOOST_30_DAYS" {
  return key === "boost_30_days" ? "BOOST_30_DAYS" : "BOOST_7_DAYS";
}
