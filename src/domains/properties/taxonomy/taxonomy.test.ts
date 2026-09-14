import { describe, expect, it } from "vitest";

import { getMarketPlugin } from "@/domains/markets";
import {
  resolveCanonicalPropertyType,
  toAnalyticsPropertyType,
  toPrismaPropertyType,
  parseLayoutToCanonical,
  formatLayoutForMarket,
  resolveCanonicalLayout,
  toCanonicalSqm,
  fromCanonicalSqm,
  formatAreaValue,
  resolvePropertyDetailSections,
  resolveSearchFiltersForMarket,
  isSearchFilterEnabled,
  inferListingMarketChannel,
  defaultOffPlanFramework,
  buildPropertyDetailNavSections,
} from "@/domains/properties/taxonomy-index";
import {
  getLocationTypeRegistry,
  labelForLocationType,
  buildLocationPath,
  assertValidParentChild,
} from "@/domains/locations/market/location-graph";

describe("Canonical property taxonomy (Prompt 17.3)", () => {
  it("maps CZ and AE aliases onto canonical types", () => {
    expect(
      resolveCanonicalPropertyType({ marketCode: "CZ", raw: "rodinný dům" }),
    ).toBe("HOUSE");
    expect(
      resolveCanonicalPropertyType({ marketCode: "AE", raw: "villa" }),
    ).toBe("VILLA");
    expect(
      resolveCanonicalPropertyType({ marketCode: "AE", raw: "studio" }),
    ).toBe("STUDIO");
  });

  it("rolls villa/studio for analytics and prisma persistence", () => {
    expect(toAnalyticsPropertyType("VILLA")).toBe("HOUSE");
    expect(toAnalyticsPropertyType("STUDIO")).toBe("APARTMENT");
    expect(toPrismaPropertyType("VILLA")).toBe("VILLA");
    expect(toPrismaPropertyType("STUDIO")).toBe("APARTMENT");
  });
});

describe("Dual layout model", () => {
  it("parses CZ disposition into bedrooms", () => {
    const layout = parseLayoutToCanonical("3+kk");
    expect(layout?.bedrooms).toBe(2);
    expect(layout?.kitchenKind).toBe("kk");
  });

  it("formats for CZ vs bedroom markets", () => {
    const layout = resolveCanonicalLayout({ bedroomsCount: 2, bathroomsCount: 1 });
    expect(
      formatLayoutForMarket({
        layout,
        notationSystem: "CZ_DISPOSITION",
        locale: "cs-CZ",
      }).label,
    ).toBe("3+kk");
    expect(
      formatLayoutForMarket({
        layout,
        notationSystem: "BEDROOM_COUNT",
        locale: "en-AE",
        bathrooms: 1,
      }).label,
    ).toMatch(/2 bedrooms/);
  });
});

describe("Area conversion (canonical m²)", () => {
  it("round-trips sqft via canonical sqm", () => {
    const sqm = toCanonicalSqm(1000, "sqft");
    const back = fromCanonicalSqm(sqm, "sqft");
    expect(back).toBeCloseTo(1000, 5);
    expect(formatAreaValue(100, "sqm").label).toContain("m²");
    expect(formatAreaValue(100, "sqft").unit).toBe("sqft");
  });

  it("AE plugin prefers sqft display unit", () => {
    expect(getMarketPlugin("AE")?.property.areaUnit).toBe("sqft");
    expect(getMarketPlugin("CZ")?.property.areaUnit).toBe("sqm");
  });
});

describe("Section + search filter plugins", () => {
  it("attaches CZ extras without country ifs in catalog", () => {
    const cz = resolvePropertyDetailSections({ marketCode: "CZ" });
    expect(cz.map((s) => s.id)).toEqual(
      expect.arrayContaining(["overview", "svj", "penb"]),
    );
    const ae = resolvePropertyDetailSections({ marketCode: "AE" });
    expect(ae.map((s) => s.id)).toEqual(
      expect.arrayContaining([
        "service_charge",
        "payment_plan",
        "off_plan",
        "freehold",
      ]),
    );
  });

  it("builds CZ nav with Czech anchors only for rendered sections", () => {
    const nav = buildPropertyDetailNavSections({
      marketCode: "CZ",
      locale: "cs-CZ",
    });
    expect(nav.map((n) => n.id)).toContain("prehled");
    expect(nav.map((n) => n.id)).not.toContain("svj");
  });

  it("resolves shared + market search filters", () => {
    expect(isSearchFilterEnabled("CZ", "layout")).toBe(true);
    expect(isSearchFilterEnabled("CZ", "freehold")).toBe(false);
    expect(isSearchFilterEnabled("AE", "freehold")).toBe(true);
    expect(isSearchFilterEnabled("AE", "offPlan")).toBe(true);
    const shared = resolveSearchFiltersForMarket("AE").filter((f) => f.shared);
    expect(shared.map((f) => f.key)).toEqual(
      expect.arrayContaining(["price", "propertyType", "area", "marketChannel"]),
    );
  });
});

describe("Listing channel + off-plan", () => {
  it("infers PRIMARY from off-plan / NEW condition", () => {
    expect(inferListingMarketChannel({ isOffPlan: true })).toBe(
      "PRIMARY_NEW_BUILD",
    );
    expect(inferListingMarketChannel({ condition: "NEW" })).toBe(
      "PRIMARY_NEW_BUILD",
    );
    expect(inferListingMarketChannel({})).toBe("SECONDARY_RESALE");
    expect(defaultOffPlanFramework("PRIMARY_NEW_BUILD").isOffPlan).toBe(true);
  });
});

describe("Location type registry + graph", () => {
  it("labels CZ kraj vs AE emirate on same REGION type", () => {
    expect(labelForLocationType("CZ", "REGION")).toBe("Kraj");
    expect(labelForLocationType("AE", "REGION", "en")).toBe("Emirate");
    const ae = getLocationTypeRegistry("AE");
    expect(ae.levels.some((l) => l.roleKey === "community")).toBe(true);
    expect(ae.levels.some((l) => l.roleKey === "building")).toBe(true);
  });

  it("builds parent path and validates hierarchy", () => {
    const byId = new Map([
      [
        "c",
        {
          id: "c",
          type: "COUNTRY" as const,
          parentId: null,
          countryCode: "AE",
          name: "UAE",
          slug: "ae",
        },
      ],
      [
        "e",
        {
          id: "e",
          type: "REGION" as const,
          parentId: "c",
          countryCode: "AE",
          name: "Dubai",
          slug: "dubai",
        },
      ],
      [
        "n",
        {
          id: "n",
          type: "NEIGHBORHOOD" as const,
          parentId: "e",
          countryCode: "AE",
          name: "Marina",
          slug: "marina",
        },
      ],
    ]);
    const path = buildLocationPath(byId.get("n")!, byId);
    expect(path.map((p) => p.slug)).toEqual(["ae", "dubai", "marina"]);
    expect(
      assertValidParentChild({ parentType: "REGION", childType: "NEIGHBORHOOD" }),
    ).toBe(true);
    expect(
      assertValidParentChild({ parentType: "NEIGHBORHOOD", childType: "REGION" }),
    ).toBe(false);
  });
});

describe("MarketPlugin property config (17.3 fields)", () => {
  it("exposes layoutNotation and filter/section extras", () => {
    const cz = getMarketPlugin("CZ")!.property;
    expect(cz.layoutNotation).toBe("CZ_DISPOSITION");
    expect(cz.detailSectionExtraIds).toContain("svj");
    expect(cz.searchFilterExtraKeys).toContain("layout");
    const ae = getMarketPlugin("AE")!.property;
    expect(ae.layoutNotation).toBe("BEDROOM_COUNT");
    expect(ae.supportedPropertyTypes).toContain("VILLA");
  });
});
