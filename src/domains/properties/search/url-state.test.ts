import { describe, expect, it } from "vitest";
import {
  buildPropertySearchHref,
  countActiveFilters,
  getActiveFilterChips,
  parsePropertySearchParams,
  serializePropertySearchParams,
} from "./url-state";
import { foldDiacritics, fuzzyIncludes } from "./text-match";
import { applyUrlFiltersToListings } from "./apply-filters";
import type { SearchableListing } from "./apply-filters";

describe("url-state", () => {
  it("parses Czech query params and survives round-trip", () => {
    const state = parsePropertySearchParams({
      lokalita: "praha",
      "cena-do": "8000000",
      typ: "byt,dum",
      dispozice: "2kk,3+kk",
      razeni: "cena-sestupne",
      energie: "B,C",
      kvalita: "overena",
      strategie: "dlouhodoby-pronajem",
    });
    expect(state.lokalita).toBe("praha");
    expect(state.cenaDo).toBe(8_000_000);
    expect(state.typ).toEqual(["byt", "dum"]);
    expect(state.dispozice).toContain("2+kk");
    expect(state.razeni).toBe("price_desc");
    expect(state.energie).toEqual(["B", "C"]);

    const href = buildPropertySearchHref(state);
    expect(href).toContain("lokalita=praha");
    expect(href).toContain("cena-do=8000000");
    expect(href).toContain("razeni=cena-sestupne");

    const again = parsePropertySearchParams(
      Object.fromEntries(new URL(href, "https://majetio.cz").searchParams),
    );
    expect(again.cenaDo).toBe(8_000_000);
    expect(again.razeni).toBe("price_desc");
  });

  it("builds chips and clear-all count", () => {
    const state = parsePropertySearchParams({
      lokalita: "Brno",
      "cena-do": "5000000",
      typ: "byt",
    });
    expect(countActiveFilters(state)).toBeGreaterThanOrEqual(3);
    const chips = getActiveFilterChips(state);
    expect(chips.some((c) => c.label.includes("Brno") || c.label === "Brno")).toBe(
      true,
    );
    expect(chips.some((c) => /mil/i.test(c.label))).toBe(true);
    expect(serializePropertySearchParams(state)["cena-do"]).toBe("5000000");
  });

  it("round-trips investment filters (ROI, cashflow, rekonstrukce)", () => {
    const state = parsePropertySearchParams({
      "roi-od": "5.5",
      "cashflow-od": "8000",
      "rekonstrukce-od": "100000",
      "rekonstrukce-do": "500000",
    });
    expect(state.roiOd).toBe(5.5);
    expect(state.cashflowOd).toBe(8000);
    expect(state.rekonstrukceOd).toBe(100_000);
    expect(state.rekonstrukceDo).toBe(500_000);

    const href = buildPropertySearchHref(state);
    expect(href).toContain("roi-od=5.5");
    expect(href).toContain("cashflow-od=8000");
    expect(href).toContain("rekonstrukce-od=100000");
    expect(href).toContain("rekonstrukce-do=500000");

    const chips = getActiveFilterChips(state);
    expect(chips.some((c) => c.id === "roi")).toBe(true);
    expect(chips.some((c) => c.id === "cashflow")).toBe(true);
    expect(chips.some((c) => c.id === "rekonstrukce")).toBe(true);
    expect(countActiveFilters(state)).toBe(3);
  });

  it("parses and serializes kraje map selection", () => {
    const state = parsePropertySearchParams({
      kraje: "praha,bratislavsky,unknown",
    });
    expect(state.kraje).toEqual(["praha", "bratislavsky"]);
    expect(buildPropertySearchHref(state)).toContain("kraje=praha%2Cbratislavsky");
    expect(getActiveFilterChips(state).some((c) => c.id === "kraj-praha")).toBe(
      true,
    );
  });
});

describe("text-match", () => {
  it("folds diacritics and tolerates small typos", () => {
    expect(foldDiacritics("Praha")).toBe("praha");
    expect(fuzzyIncludes("Vinohrady Praha", "praha")).toBe(true);
    expect(fuzzyIncludes("Vinohrady", "Vinohady")).toBe(true);
  });
});

describe("applyUrlFiltersToListings", () => {
  const sample: SearchableListing[] = [
    {
      id: "1",
      slug: "a",
      status: "ACTIVE",
      visibility: "PUBLIC",
      transactionType: "SALE",
      title: "Byt Vinohrady",
      description: null,
      propertyType: "APARTMENT",
      askingPrice: 6_000_000,
      currency: "CZK",
      pricePerSqm: 80_000,
      usableArea: 70,
      usableAreaDisplay: "70 m²",
      layout: "3+kk",
      location: {
        label: "Praha — Vinohrady",
        precision: "APPROXIMATE",
        city: "Praha",
        district: "Vinohrady",
        region: null,
        latitude: null,
        longitude: null,
        addressLine: null,
      },
      media: [],
      publishedAt: "2026-07-01T00:00:00.000Z",
      updatedAt: null,
      isDemo: true,
      dataQuality: "estimated",
      tags: ["Pronájem"],
      completenessScore: null,
      grossYieldPct: null,
      cashFlowMonthlyCzk: null,
      majetioScore: null,
      risk: null,
      priceHistory: [],
      sources: [],
      fieldConflicts: [],
      freshness: null,
      lastSeenAt: null,
      energyRating: "C",
      strategySlugs: ["dlouhodoby-pronajem"],
    },
  ];

  it("filters by lokalita fuzzy and cena-do", () => {
    const state = parsePropertySearchParams({
      q: "praha",
      "cena-do": "7000000",
      typ: "byt",
    });
    expect(applyUrlFiltersToListings(sample, state)).toHaveLength(1);
    const none = parsePropertySearchParams({ "cena-do": "1000000" });
    expect(applyUrlFiltersToListings(sample, none)).toHaveLength(0);
  });

  it("filters by ROI, cashflow and renovation range", () => {
    const withMetrics: SearchableListing[] = [
      {
        ...sample[0]!,
        id: "high",
        grossYieldPct: 7.2,
        cashFlowMonthlyCzk: 12_000,
        estimatedRenovationCostCzk: 250_000,
      },
      {
        ...sample[0]!,
        id: "low",
        grossYieldPct: 3.1,
        cashFlowMonthlyCzk: 1_500,
        estimatedRenovationCostCzk: 900_000,
      },
    ];
    const state = parsePropertySearchParams({
      "roi-od": "5",
      "cashflow-od": "5000",
      "rekonstrukce-od": "100000",
      "rekonstrukce-do": "400000",
    });
    const hits = applyUrlFiltersToListings(withMetrics, state);
    expect(hits).toHaveLength(1);
    expect(hits[0]?.id).toBe("high");
  });
});

describe("recommended sort URL", () => {
  it("parses and serializes razeni=doporucene", () => {
    const state = parsePropertySearchParams({ razeni: "doporucene" });
    expect(state.razeni).toBe("recommended");
    expect(buildPropertySearchHref(state)).toContain("razeni=doporucene");
  });
});
