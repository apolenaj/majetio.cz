/**
 * Listing Promotion Engine — Boost eligibility, firewall, organic/sponsored split.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  SPONSORED_LABEL_CS,
  assertBoostEligibility,
  boost7DaysProduct,
  boost30DaysProduct,
  composeDiscoverySearchPage,
  listingBoostProducts,
} from "@/domains/listing-promotions";

const eligibleProperty = {
  status: "ACTIVE",
  visibility: "PUBLIC",
  listingVerificationStatus: "IDENTITY_VERIFIED",
  listingQuotaState: "WITHIN_LIMIT",
  listingModerationStatus: "CLEAR",
  isDemo: false,
};

describe("Boost products", () => {
  it("defines Boost 7 and Boost 30 with firewall flags false", () => {
    expect(boost7DaysProduct.durationDays).toBe(7);
    expect(boost30DaysProduct.durationDays).toBe(30);
    expect(listingBoostProducts.boost_7_days.firewall.affectsOrganicRanking).toBe(
      false,
    );
    expect(listingBoostProducts.boost_7_days.firewall.affectsMajetioScore).toBe(
      false,
    );
    expect(listingBoostProducts.boost_30_days.firewall.affectsValuation).toBe(
      false,
    );
    expect(listingBoostProducts.boost_30_days.firewall.affectsRiskAnalysis).toBe(
      false,
    );
    expect(boost7DaysProduct.sponsoredLabel).toBe(SPONSORED_LABEL_CS);
  });
});

describe("Boost eligibility", () => {
  it("allows verified active public listings", () => {
    expect(assertBoostEligibility(eligibleProperty).ok).toBe(true);
    expect(
      assertBoostEligibility({
        ...eligibleProperty,
        listingVerificationStatus: "ORGANIZATION_VERIFIED",
      }).ok,
    ).toBe(true);
  });

  it("rejects inactive, banned, unverified, over-limit, demo", () => {
    expect(
      assertBoostEligibility({ ...eligibleProperty, status: "DRAFT" }).ok,
    ).toBe(false);
    expect(
      assertBoostEligibility({
        ...eligibleProperty,
        listingModerationStatus: "BANNED",
      }),
    ).toMatchObject({ ok: false, code: "banned" });
    expect(
      assertBoostEligibility({
        ...eligibleProperty,
        listingVerificationStatus: "UNVERIFIED",
      }),
    ).toMatchObject({ ok: false, code: "unverified" });
    expect(
      assertBoostEligibility({
        ...eligibleProperty,
        listingQuotaState: "OVER_LIMIT",
      }),
    ).toMatchObject({ ok: false, code: "over_limit" });
    expect(
      assertBoostEligibility({ ...eligibleProperty, isDemo: true }),
    ).toMatchObject({ ok: false, code: "demo" });
  });
});

describe("organic vs sponsored separation", () => {
  it("keeps organic order and forces Sponzorováno on placements", () => {
    const organic = [
      { id: "o1" } as never,
      { id: "boosted" } as never,
      { id: "o2" } as never,
    ];
    const sponsored = [
      {
        placementId: "b1",
        sponsored: true as const,
        label: SPONSORED_LABEL_CS,
        productKey: "boost_7_days",
        endsAt: null,
        property: { id: "boosted" } as never,
      },
    ];

    const page = composeDiscoverySearchPage({
      organicItems: organic,
      sponsoredPlacements: sponsored,
      pagination: {
        mode: "page",
        page: 1,
        pageSize: 20,
        nextCursor: null,
        hasMore: false,
      },
      sort: { field: "publishedAt", direction: "desc" },
      warnings: [],
      appliedFilters: {},
    });

    expect(page.organicResults.map((r) => r.id)).toEqual(["o1", "o2"]);
    expect(page.sponsoredPlacements).toHaveLength(1);
    expect(page.sponsoredPlacements[0]?.sponsored).toBe(true);
    expect(page.sponsoredPlacements[0]?.label).toBe("Sponzorováno");
    expect(page.integrity.boostAffectsOrganicRanking).toBe(false);
    expect(page.integrity.boostAffectsMajetioScore).toBe(false);
  });

  it("does not reorder organic by sponsored weight", () => {
    const organic = [{ id: "cheap" } as never, { id: "expensive" } as never];
    const page = composeDiscoverySearchPage({
      organicItems: organic,
      sponsoredPlacements: [
        {
          placementId: "b",
          sponsored: true,
          label: "Sponzorováno",
          productKey: "boost_30_days",
          endsAt: null,
          property: { id: "other" } as never,
        },
      ],
      pagination: {
        mode: "page",
        pageSize: 10,
        nextCursor: null,
        hasMore: false,
      },
      sort: { field: "askingPrice", direction: "asc" },
      warnings: [],
      appliedFilters: {},
      dedupeOrganicAgainstSponsored: false,
    });
    expect(page.organicResults.map((r) => r.id)).toEqual([
      "cheap",
      "expensive",
    ]);
  });
});

describe("schema + search firewall", () => {
  it("ListingBoost model documents firewall", () => {
    const schema = readFileSync(
      join(process.cwd(), "prisma/schema.prisma"),
      "utf8",
    );
    expect(schema).toMatch(/model ListingBoost/);
    expect(schema).toMatch(/BOOST_7_DAYS/);
    expect(schema).toMatch(/BOOST_30_DAYS/);
    expect(schema).toMatch(/Sponzorováno/);
    expect(schema).toMatch(/ListingModerationStatus/);
  });

  it("organic search where never references ListingBoost", () => {
    const sorts = readFileSync(
      join(process.cwd(), "src/domains/properties/service/search/sorts.ts"),
      "utf8",
    );
    const filters = readFileSync(
      join(process.cwd(), "src/domains/properties/service/search/filters.ts"),
      "utf8",
    );
    expect(sorts).not.toMatch(/ListingBoost|placementWeight|boost/i);
    expect(filters).not.toMatch(/ListingBoost|placementWeight/i);
  });
});
