import { describe, expect, it } from "vitest";

import {
  computePropertyMatchScore,
  isMatchProfileComplete,
  sortByMatchScore,
  type MatchListing,
  type MatchProfile,
} from "./match-score";

const baseListing: MatchListing = {
  id: "p1",
  askingPrice: 6_000_000,
  locationCity: "Praha",
  locationDistrict: "Vinohrady",
  locationRegion: "Hlavní město Praha",
  propertyType: "APARTMENT",
  layout: "3+kk",
  usableArea: 78,
  condition: "GOOD",
  strategySlugs: ["dlouhodoby-pronajem"],
  tags: ["Pronájem"],
  grossYieldPct: 5.5,
};

const completeProfile: MatchProfile = {
  maxPriceCzk: 8_000_000,
  preferredCity: "Praha",
  regions: ["Hlavní město Praha"],
  propertyTypes: ["APARTMENT"],
  dispositions: ["3+kk", "2+kk"],
  minAreaSqm: 50,
  maxAreaSqm: 100,
  strategies: ["dlouhodoby-pronajem"],
  riskTolerance: "BALANCED",
  goal: "INVESTMENT",
  targetGrossYieldPct: 5,
};

describe("isMatchProfileComplete", () => {
  it("requires at least budget, location, or type", () => {
    expect(isMatchProfileComplete(null)).toBe(false);
    expect(isMatchProfileComplete({})).toBe(false);
    expect(isMatchProfileComplete({ maxPriceCzk: 5_000_000 })).toBe(true);
    expect(isMatchProfileComplete({ preferredCity: "Brno" })).toBe(true);
    expect(isMatchProfileComplete({ propertyTypes: ["HOUSE"] })).toBe(true);
  });
});

describe("computePropertyMatchScore", () => {
  it("returns incomplete CTA when profile is empty", () => {
    const result = computePropertyMatchScore(baseListing, null);
    expect(result.profileComplete).toBe(false);
    expect(result.score).toBe(0);
    expect(result.reasons[0]?.code).toBe("PROFILE_INCOMPLETE");
  });

  it("scores positively for budget + city + type fit", () => {
    const result = computePropertyMatchScore(baseListing, completeProfile);
    expect(result.profileComplete).toBe(true);
    expect(result.score).toBeGreaterThan(70);
    expect(result.reasons.some((r) => r.code === "BUDGET_OK")).toBe(true);
    expect(result.reasons.some((r) => r.code === "LOCATION_CITY")).toBe(true);
    expect(result.reasons.some((r) => r.label.startsWith("✓"))).toBe(true);
  });

  it("warns when renovation exceeds conservative risk", () => {
    const result = computePropertyMatchScore(
      { ...baseListing, condition: "NEEDS_RENOVATION" },
      { ...completeProfile, riskTolerance: "CONSERVATIVE", goal: "OWN_HOME" },
    );
    expect(result.reasons.some((r) => r.code === "RENO_VS_CONSERVATIVE")).toBe(
      true,
    );
    expect(
      result.reasons.some((r) => r.label.includes("rekonstrukce")),
    ).toBe(true);
  });

  it("sorts listings by match score descending", () => {
    const low = computePropertyMatchScore(
      { ...baseListing, id: "low", askingPrice: 20_000_000 },
      completeProfile,
    );
    const high = computePropertyMatchScore(baseListing, completeProfile);
    const sorted = sortByMatchScore(
      [{ id: "low" }, { id: "p1" }],
      new Map([
        ["low", low],
        ["p1", high],
      ]),
    );
    expect(sorted.map((x) => x.id)).toEqual(["p1", "low"]);
  });
});
