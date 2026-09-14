import { describe, expect, it } from "vitest";

import {
  aggregateSearchFilters,
  areaToBucket,
  locationToken,
  priceToBucket,
} from "./analytics-aggregates";
import { EMPTY_PROPERTY_URL_STATE } from "./url-state";
import {
  getSeoLanding,
  shouldNoIndexPropertySearch,
} from "./seo-landings";

describe("analytics aggregates", () => {
  it("maps prices to buckets without exposing exact CZK", () => {
    expect(priceToBucket(2_500_000)).toBe("under_3m");
    expect(priceToBucket(8_000_000)).toBe("8_12m");
    expect(priceToBucket(null)).toBe("none");
    expect(areaToBucket(55)).toBe("40_70");
  });

  it("tokenizes location without free-form street noise", () => {
    expect(locationToken("Praha")).toBe("praha");
    expect(locationToken("  Brno-město ")).toBe("brno-mesto");
  });

  it("builds filter aggregate without exact budget numbers", () => {
    const agg = aggregateSearchFilters({
      ...EMPTY_PROPERTY_URL_STATE,
      lokalita: "Praha",
      cenaDo: 8_000_000,
      typ: ["byt"],
      razeni: "recommended",
    });
    expect(agg.price_max_bucket).toBe("8_12m");
    expect(agg.location_token).toBe("praha");
    expect(JSON.stringify(agg)).not.toMatch(/8000000/);
  });
});

describe("SEO landings", () => {
  it("exposes top city landings", () => {
    expect(getSeoLanding("praha")?.lokalita).toBe("Praha");
    expect(getSeoLanding("xyz")).toBeUndefined();
  });

  it("noindexes filtered and paginated search", () => {
    expect(shouldNoIndexPropertySearch({ filterCount: 0, page: 1 })).toBe(false);
    expect(shouldNoIndexPropertySearch({ filterCount: 2, page: 1 })).toBe(true);
    expect(shouldNoIndexPropertySearch({ filterCount: 0, page: 2 })).toBe(true);
    expect(
      shouldNoIndexPropertySearch({
        filterCount: 0,
        page: 1,
        hasNonDefaultSort: true,
      }),
    ).toBe(true);
  });
});
