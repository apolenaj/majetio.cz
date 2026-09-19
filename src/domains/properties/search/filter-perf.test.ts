import { describe, expect, it } from "vitest";

import { applyUrlFiltersToListings } from "./apply-filters";
import { EMPTY_PROPERTY_URL_STATE } from "./url-state";
import type { SearchableListing } from "./apply-filters";

function makeListing(i: number): SearchableListing {
  const cities = ["Praha", "Brno", "Ostrava", "Plzeň"] as const;
  const types = ["APARTMENT", "HOUSE", "LAND"] as const;
  const city = cities[i % cities.length]!;
  const propertyType = types[i % types.length]!;
  return {
    id: `p-${i}`,
    slug: `listing-${i}`,
    status: "ACTIVE",
    visibility: "PUBLIC",
    transactionType: "SALE",
    title: `Nabídka ${i}`,
    description: null,
    propertyType,
    askingPrice: 2_000_000 + (i % 50) * 200_000,
    currency: "CZK",
    pricePerSqm: 80_000,
    usableArea: 40 + (i % 60),
    usableAreaDisplay: null,
    layout: i % 2 === 0 ? "2+kk" : "3+kk",
    location: {
      label: city,
      precision: "CITY",
      city,
      district: null,
      region: null,
      latitude: null,
      longitude: null,
      addressLine: null,
    },
    media: [],
    publishedAt: new Date(2026, 0, 1 + (i % 28)).toISOString(),
    updatedAt: null,
    isDemo: true,
    dataQuality: "estimated",
    tags: [],
    completenessScore: 50,
    grossYieldPct: 4,
    cashFlowMonthlyCzk: 0,
    majetioScore: 60,
    risk: "medium",
    priceHistory: [],
    sources: [],
    fieldConflicts: [],
    freshness: "FRESH",
    lastSeenAt: null,
    condition: null,
    shortDescription: null,
    acceptsPriceOffers: false,
    acceptsCoPurchaseSeekPartner: false,
    acceptsCoPurchaseSellerRetains: false,
  };
}

describe("filter performance on larger dataset", () => {
  it("filters 2000 listings under a soft time budget", () => {
    const all = Array.from({ length: 2000 }, (_, i) => makeListing(i));
    const state = {
      ...EMPTY_PROPERTY_URL_STATE,
      lokalita: "praha",
      cenaDo: 8_000_000,
      typ: ["byt"],
      razeni: "price_asc" as const,
    };

    const started = performance.now();
    const result = applyUrlFiltersToListings(all, state);
    const elapsed = performance.now() - started;

    expect(result.length).toBeGreaterThan(0);
    expect(result.every((r) => (r.askingPrice ?? 0) <= 8_000_000)).toBe(true);
    // Soft budget — CI machines vary; fail only on pathological slowdown
    expect(elapsed).toBeLessThan(1500);
  });
});
