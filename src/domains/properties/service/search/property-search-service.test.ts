import { describe, expect, it } from "vitest";
import { propertySearchInputSchema } from "../../schemas/search";
import { buildSearchWhere, normalizeSearchFilters } from "./filters";
import { resolveSearchSort, toPrismaOrderBy } from "./sorts";
import { createPropertySearchService } from "./property-search-service";
import type { PropertyRecord } from "../dto";

describe("search input + normalize", () => {
  it("auto-swaps inverted price range", () => {
    const parsed = propertySearchInputSchema.parse({
      priceMin: 5_000_000,
      priceMax: 2_000_000,
    });
    const result = normalizeSearchFilters(parsed);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.filters.priceMin).toBe(2_000_000);
    expect(result.filters.priceMax).toBe(5_000_000);
    expect(result.warnings[0]).toMatch(/prohozeny/i);
  });

  it("errors on inverted price when rangeMode=error", () => {
    const parsed = propertySearchInputSchema.parse({
      priceMin: 9,
      priceMax: 1,
      rangeMode: "error",
    });
    const result = normalizeSearchFilters(parsed);
    expect(result.ok).toBe(false);
  });

  it("whitelists propertyType / condition / ownership and drops junk", () => {
    const parsed = propertySearchInputSchema.parse({
      propertyType: ["APARTMENT", "DROP TABLE", "HOUSE"],
      condition: ["GOOD", "HACK"],
      ownershipType: ["PERSONAL"],
      layout: ["2+kk", "'; 1=1;--"],
    });
    const result = normalizeSearchFilters(parsed);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.filters.propertyType).toEqual(["APARTMENT", "HOUSE"]);
    expect(result.filters.condition).toEqual(["GOOD"]);
    expect(result.filters.layout).toEqual(["2+kk"]);
  });

  it("always scopes public discovery to ACTIVE + PUBLIC", () => {
    const parsed = propertySearchInputSchema.parse({ city: "Brno" });
    const result = normalizeSearchFilters(parsed);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.filters.status).toBe("ACTIVE");
    expect(result.filters.visibility).toBe("PUBLIC");
    const where = buildSearchWhere(result.filters);
    expect(where.status).toBe("ACTIVE");
    expect(where.visibility).toBe("PUBLIC");
    expect(where.publicCity).toBe("Brno");
  });
});

describe("search sorts", () => {
  it("maps named presets and rejects raw SQL fragments", () => {
    expect(resolveSearchSort({ sort: "newest" })).toEqual({
      field: "publishedAt",
      direction: "desc",
    });
    expect(resolveSearchSort({ sort: "price_asc" })).toEqual({
      field: "askingPrice",
      direction: "asc",
    });
    expect(resolveSearchSort({ sort: "price_desc" })).toEqual({
      field: "askingPrice",
      direction: "desc",
    });
    expect(resolveSearchSort({ sort: "price_per_sqm" }).field).toBe("pricePerSqm");
    expect(resolveSearchSort({ sort: "recommended" })).toEqual({
      field: "publishedAt",
      direction: "desc",
    });
    expect(
      resolveSearchSort({ sortField: "askingPrice; DROP TABLE Property" }),
    ).toEqual({ field: "publishedAt", direction: "desc" });
    expect(toPrismaOrderBy({ field: "askingPrice", direction: "asc" })).toEqual({
      askingPrice: "asc",
    });
  });
});

describe("PropertySearchService", () => {
  const sample: PropertyRecord = {
    id: "p1",
    slug: "byt-brno",
    status: "ACTIVE",
    visibility: "PUBLIC",
    transactionType: "SALE",
    title: "Byt Brno",
    propertyType: "APARTMENT",
    askingPrice: 4_000_000,
    currency: "CZK",
    pricePerSqm: 80_000,
    usableArea: 50,
    layout: "2+kk",
    addressPrecision: "APPROXIMATE",
    publicCity: "Brno",
    publicLabel: "Brno",
    isDemo: true,
    publishedAt: "2026-07-01T00:00:00.000Z",
  };

  it("buildQuery never puts client strings into orderBy keys", () => {
    const service = createPropertySearchService({
      repository: { search: async () => ({ items: [] }) },
    });
    const plan = service.buildQuery({
      sortField: "price DESC; DELETE FROM Property",
      city: "Praha",
      priceMin: 1_000_000,
      priceMax: 8_000_000,
      propertyType: "APARTMENT",
      usableAreaMin: 40,
      condition: "GOOD",
      ownershipType: "PERSONAL",
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(Object.keys(plan.orderBy)).toEqual(["publishedAt"]);
    expect(plan.where.status).toBe("ACTIVE");
    expect(plan.where.askingPrice).toEqual({ gte: 1_000_000, lte: 8_000_000 });
  });

  it("search returns public DTO page with clamped pageSize", async () => {
    const service = createPropertySearchService({
      repository: {
        search: async ({ take }) => ({
          items: Array.from({ length: take }, (_, i) => ({
            ...sample,
            id: `p${i}`,
            slug: `slug-${i}`,
          })),
          total: 100,
        }),
      },
    });
    const result = await service.search({ pageSize: 999, sort: "price_asc" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.page.pagination.pageSize).toBe(50);
    expect(result.page.items.length).toBe(50);
    expect(result.page.pagination.hasMore).toBe(true);
    expect(result.page.sort).toEqual({ field: "askingPrice", direction: "asc" });
    expect(JSON.stringify(result.page.items[0])).not.toContain("canonicalKey");
  });

  it("rejects invalid zod input", () => {
    const service = createPropertySearchService({
      repository: { search: async () => ({ items: [] }) },
    });
    const plan = service.buildQuery({ page: 0 });
    expect(plan.ok).toBe(false);
  });
});
