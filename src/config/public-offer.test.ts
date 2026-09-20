import { describe, expect, it } from "vitest";

import { pricingCatalog } from "@/config/pricing-architecture";
import {
  assertPublicOfferAlignedWithCatalog,
  isPublicCustomerOfferKey,
  listPublicCustomerProducts,
  publicCheckoutMode,
  publicCustomerOffer,
  PUBLIC_CUSTOMER_OFFER_KEYS,
} from "@/config/public-offer";
import { isCatalogProductPubliclyListed } from "@/domains/commerce/product-availability";

describe("public customer offer", () => {
  it("lists fixed listing and service products, not only deep_analysis", () => {
    expect(PUBLIC_CUSTOMER_OFFER_KEYS).toContain("listing_basic_30");
    expect(PUBLIC_CUSTOMER_OFFER_KEYS).toContain("listing_premium_30");
    expect(PUBLIC_CUSTOMER_OFFER_KEYS).toContain("listing_prep");
    expect(PUBLIC_CUSTOMER_OFFER_KEYS).toContain("deep_analysis");
    expect(PUBLIC_CUSTOMER_OFFER_KEYS).toContain("property_search_project");
    expect(PUBLIC_CUSTOMER_OFFER_KEYS).toContain("firm_starter_monthly");
    expect(assertPublicOfferAlignedWithCatalog().ok).toBe(true);

    const listed = listPublicCustomerProducts();
    expect(listed.map((p) => p.key)).toEqual([...PUBLIC_CUSTOMER_OFFER_KEYS]);
    expect(listed.every((p) => isCatalogProductPubliclyListed(p))).toBe(true);
  });

  it("keeps analysis at 4990 Kč and listing basic at 299 Kč", () => {
    expect(publicCustomerOffer.priceGrossCzk).toBe(4990);
    const basic = pricingCatalog.find((p) => p.key === "listing_basic_30");
    expect(basic?.priceGrossMinor).toBe(29_900);
    const premium = pricingCatalog.find((p) => p.key === "listing_premium_30");
    expect(premium?.priceGrossMinor).toBe(79_900);
    expect(isPublicCustomerOfferKey("buyer_pass")).toBe(false);
  });

  it("stays in inquiry mode without verified operator identity", () => {
    expect(publicCheckoutMode()).toBe("inquiry");
  });

  it("keeps buyer_pass internal", () => {
    const pass = pricingCatalog.find((p) => p.key === "buyer_pass");
    expect(pass?.priceGrossMinor).toBe(149_900);
    expect(pass?.publicCustomerOffer).toBeFalsy();
    if (pass) expect(isCatalogProductPubliclyListed(pass)).toBe(false);
  });
});
