import { describe, expect, it } from "vitest";

import type { CanonicalMortgageOffer } from "@/integrations/hypotekajasne";
import {
  buildFinancingRateSensitivity,
  buildMortgageOfferComparison,
  buildMortgageOfferTermsUrl,
  filterDisplayableMortgageOffers,
  sortMortgageOffers,
} from "@/domains/financing/mortgage-offer-catalog";

function sampleOffer(
  partial: Partial<CanonicalMortgageOffer> & Pick<CanonicalMortgageOffer, "id" | "interestRateFrom">,
): CanonicalMortgageOffer {
  return {
    bankName: "Banka",
    productName: "Produkt",
    aprFrom: partial.interestRateFrom + 0.2,
    fixationYears: 5,
    ltvMaxPct: 80,
    ltvMinPct: 0,
    source: "hypotekajasne",
    status: "active",
    dataTier: "live",
    retrievedAt: new Date(),
    verifiedAt: new Date(),
    schemaVersion: "mortgage-offer.v1",
    isSponsored: false,
    termsUrl: null,
    productSlug: null,
    ...partial,
  };
}

describe("mortgage offer catalog", () => {
  it("filters inactive and stale offers", () => {
    const fresh = sampleOffer({ id: "a", interestRateFrom: 5 });
    const stale = sampleOffer({
      id: "b",
      interestRateFrom: 4,
      retrievedAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
    });
    const inactive = sampleOffer({ id: "c", interestRateFrom: 4.5, status: "inactive" });

    const result = filterDisplayableMortgageOffers([fresh, stale, inactive]);
    expect(result.map((o) => o.id)).toEqual(["a"]);
  });

  it("sorts by rate without promoting sponsored offers", () => {
    const sponsored = sampleOffer({
      id: "s",
      interestRateFrom: 6,
      isSponsored: true,
    });
    const cheaper = sampleOffer({ id: "c", interestRateFrom: 5 });
    const sorted = sortMortgageOffers([sponsored, cheaper], "rate_asc");
    expect(sorted.map((o) => o.id)).toEqual(["c", "s"]);
  });

  it("builds safe terms URL without query params", () => {
    const url = buildMortgageOfferTermsUrl(
      sampleOffer({
        id: "x",
        interestRateFrom: 5,
        productSlug: "standard-5",
      }),
    );
    expect(url).toBe("https://www.hypotekajasne.cz/produkty/standard-5");
    expect(url).not.toContain("email=");
  });

  it("compares offers with payment metrics", () => {
    const rows = buildMortgageOfferComparison({
      offers: [
        sampleOffer({ id: "low", interestRateFrom: 5 }),
        sampleOffer({ id: "high", interestRateFrom: 6 }),
      ],
      baseFinancingInput: {
        askingPriceCzk: 4_000_000,
        valuationCzk: null,
        userEquityCzk: 800_000,
        requestedLoanCzk: null,
        termYears: 30,
        nominalInterestRatePp: 5,
        aprPp: null,
        offerLtvMaxPct: 80,
        defaultEquityShareOfPrice: 0.2,
      },
    });

    expect(rows).toHaveLength(2);
    const low = rows.find((r) => r.offerId === "low")!;
    const high = rows.find((r) => r.offerId === "high")!;
    expect(low.monthlyPaymentCzk!).toBeLessThan(high.monthlyPaymentCzk!);
  });

  it("increases payment monotonically in rate sensitivity", () => {
    const rows = buildFinancingRateSensitivity({
      baseFinancingInput: {
        askingPriceCzk: 4_000_000,
        valuationCzk: null,
        userEquityCzk: 800_000,
        requestedLoanCzk: null,
        termYears: 30,
        nominalInterestRatePp: 5.19,
        aprPp: null,
        offerLtvMaxPct: 80,
        defaultEquityShareOfPrice: 0.2,
      },
    });

    expect(rows).toHaveLength(3);
    expect(rows[0]!.monthlyPaymentCzk!).toBeLessThan(rows[1]!.monthlyPaymentCzk!);
    expect(rows[1]!.monthlyPaymentCzk!).toBeLessThan(rows[2]!.monthlyPaymentCzk!);
  });
});
