import { describe, expect, it } from "vitest";
import { toPublicPropertyDto } from "./dto";
import {
  decodeCursor,
  encodeCursor,
  resolvePagination,
  resolvePropertySort,
  MAX_PAGE_SIZE,
} from "./pagination";
import { createPropertySearchProvider } from "./search-provider";
import { createPropertyService, type PropertyRepository } from "./property-service";

const baseRecord = {
  id: "prop-1",
  slug: "byt-praha",
  status: "ACTIVE",
  visibility: "PUBLIC" as const,
  transactionType: "SALE",
  title: "Byt 2+kk",
  description: "Popis",
  propertyType: "APARTMENT",
  askingPrice: 5_000_000,
  currency: "CZK",
  pricePerSqm: 80_000,
  usableArea: 62,
  layout: "2+kk",
  publicLabel: "Praha 2 — Vinohrady",
  addressPrecision: "EXACT" as const,
  publicCity: "Praha",
  publicDistrict: "Vinohrady",
  publicRegion: "Hlavní město Praha",
  street: "Vinohradská",
  houseNumber: "12",
  latitude: 50.07,
  longitude: 14.44,
  internalNotes: "SECRET analyst note",
  auditMeta: { actor: "admin" },
  canonicalKey: "portal:1",
  media: [
    {
      url: "/img.jpg",
      type: "PHOTO",
      isPrimary: true,
      isPlaceholder: false,
      alt: "foto",
    },
  ],
};

describe("public DTO", () => {
  it("strips precise address, notes, audit for public viewers on private listings", () => {
    const dto = toPublicPropertyDto(
      { ...baseRecord, visibility: "PRIVATE" },
      { viewerRole: "PUBLIC" },
    );
    expect(dto.location.latitude).toBeNull();
    expect(dto.location.district).toBeNull();
    expect(JSON.stringify(dto)).not.toContain("Vinohradská");
    expect(JSON.stringify(dto)).not.toContain("SECRET");
    expect(JSON.stringify(dto)).not.toContain("canonicalKey");
  });

  it("exposes street via addressLine on public EXACT (Prompt 9), still strips secrets", () => {
    const dto = toPublicPropertyDto(baseRecord, { viewerRole: "PUBLIC" });
    expect(dto.location.latitude).toBe(50.07);
    expect(dto.location.addressLine).toContain("Vinohradská");
    expect(JSON.stringify(dto)).not.toContain("SECRET");
    expect(JSON.stringify(dto)).not.toContain("canonicalKey");
    expect(JSON.stringify(dto)).not.toContain("auditMeta");
  });

  it("keeps street hidden when addressPrecision is HIDDEN", () => {
    const dto = toPublicPropertyDto(
      { ...baseRecord, addressPrecision: "HIDDEN" },
      { viewerRole: "PUBLIC" },
    );
    expect(dto.location.addressLine).toBeNull();
    expect(JSON.stringify(dto)).not.toContain("Vinohradská");
  });
});

describe("pagination + sort", () => {
  it("clamps page size and rejects unsafe sort fields", () => {
    const page = resolvePagination({ page: 2, pageSize: 999 });
    expect(page.mode).toBe("page");
    if (page.mode === "page") {
      expect(page.pageSize).toBe(MAX_PAGE_SIZE);
      expect(page.skip).toBe(MAX_PAGE_SIZE);
    }
    expect(resolvePropertySort("drop table", "asc").field).toBe("updatedAt");
    expect(resolvePropertySort("askingPrice", "asc")).toEqual({
      field: "askingPrice",
      direction: "asc",
    });
  });

  it("round-trips cursors", () => {
    const encoded = encodeCursor({ id: "a", sortValue: 100 });
    expect(decodeCursor(encoded)).toEqual({ id: "a", sortValue: 100 });
  });
});

describe("PropertySearchProvider + PropertyService", () => {
  it("builds filtered where with safe defaults", () => {
    const provider = createPropertySearchProvider();
    const query = provider.buildQuery({
      filters: { city: "Brno", priceMin: 1_000_000, priceMax: 5_000_000 },
      sortField: "askingPrice",
      sortDirection: "asc",
      pagination: { page: 1, pageSize: 10 },
    });
    expect(query.where.status).toBe("ACTIVE");
    expect(query.where.visibility).toBe("PUBLIC");
    expect(query.where.publicCity).toBe("Brno");
    expect(query.orderBy).toEqual({ askingPrice: "asc" });
  });

  it("maps repository results through public DTOs", async () => {
    const repository: PropertyRepository = {
      findBySlug: async (slug) => (slug === baseRecord.slug ? baseRecord : null),
      findById: async () => baseRecord,
      search: async () => ({ items: [baseRecord], total: 1, hasMore: false }),
    };
    const service = createPropertyService({ repository });
    const detail = await service.getPublicBySlug("byt-praha");
    expect(detail?.title).toBe("Byt 2+kk");
    expect(JSON.stringify(detail)).not.toContain("SECRET");

    const list = await service.searchPublic({ filters: { city: "Praha" } });
    expect(list.items).toHaveLength(1);
    expect(list.pageSize).toBeGreaterThan(0);
  });

  it("hides private listings from public getBySlug", async () => {
    const repository: PropertyRepository = {
      findBySlug: async () => ({
        ...baseRecord,
        visibility: "PRIVATE",
        ownerUserId: "owner-x",
      }),
      findById: async () => null,
      search: async () => ({ items: [], hasMore: false }),
    };
    const service = createPropertyService({ repository });
    expect(await service.getPublicBySlug("byt-praha")).toBeNull();
  });
});
