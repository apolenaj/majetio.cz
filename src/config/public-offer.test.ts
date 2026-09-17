import { describe, expect, it } from "vitest";

import { pricingCatalog } from "@/config/pricing-architecture";
import {
  isPublicCustomerOfferKey,
  publicCustomerOffer,
} from "@/config/public-offer";
import { isCatalogProductPubliclyListed } from "@/domains/commerce/product-availability";

describe("public customer offer", () => {
  it("exposes only deep_analysis at 4990 Kč on the public surface", () => {
    expect(publicCustomerOffer.priceGrossCzk).toBe(4990);
    expect(isPublicCustomerOfferKey("deep_analysis")).toBe(true);
    expect(isPublicCustomerOfferKey("buyer_pass")).toBe(false);

    const listed = pricingCatalog.filter((p) =>
      isCatalogProductPubliclyListed(p),
    );
    expect(listed.map((p) => p.key)).toEqual(["deep_analysis"]);
  });

  it("keeps buyer_pass in the internal catalog but not public", () => {
    const pass = pricingCatalog.find((p) => p.key === "buyer_pass");
    expect(pass?.priceGrossMinor).toBe(149_900);
    expect(pass?.publicCustomerOffer).toBeFalsy();
    if (pass) expect(isCatalogProductPubliclyListed(pass)).toBe(false);
  });
});
