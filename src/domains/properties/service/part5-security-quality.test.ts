import { describe, expect, it } from "vitest";
import { canViewProperty, resolveViewerRole } from "./authorization";
import { createPropertyService, type PropertyRepository } from "./property-service";
import { detectDataQualityIssues } from "./data-quality";
import { formatAreaConflict } from "./field-conflicts";
import { normalizeCurrency, areaToSquareMeters } from "@/domains/property-sources/service/normalize";
import { computeDedupeScore } from "./dedupe-score";
import { getDemoPropertyRecord } from "@/content/demo-canonical-properties";
import type { PropertyRecord } from "./dto";

describe("IDOR authorization", () => {
  const privateB = getDemoPropertyRecord("demo-private-owner-b")!;

  it("User A cannot view User B private property", async () => {
    expect(canViewProperty(privateB, { userId: "user-a", role: "USER" })).toBe(false);

    const repository: PropertyRepository = {
      findBySlug: async (slug) =>
        slug === privateB.slug ? privateB : null,
      findById: async (id) => (id === privateB.id ? privateB : null),
      search: async () => ({ items: [privateB], hasMore: false }),
    };
    const service = createPropertyService({ repository });

    expect(
      await service.getPublicBySlug(privateB.slug, {
        viewer: { userId: "user-a", role: "USER" },
      }),
    ).toBeNull();

    expect(
      await service.getPublicById(privateB.id, {
        viewer: { userId: "user-b-owner", role: "USER" },
      }),
    ).not.toBeNull();
  });

  it("anonymous cannot view PRIVATE", () => {
    expect(canViewProperty(privateB, {})).toBe(false);
    expect(resolveViewerRole(privateB, { userId: "user-b-owner" })).toBe("OWNER");
  });
});

describe("data quality rules", () => {
  it("negative price and zero area trigger critical issues", () => {
    const issues = detectDataQualityIssues({ askingPrice: -100, usableArea: 0 });
    expect(issues.map((i) => i.ruleCode).sort()).toEqual([
      "AREA_NON_POSITIVE",
      "PRICE_NON_POSITIVE",
    ]);
  });
});

describe("field conflicts + currency + dedupe", () => {
  it("formats area conflict as range", () => {
    const conflict = formatAreaConflict([
      { value: 72, sourceLabel: "A" },
      { value: 74, sourceLabel: "B" },
    ]);
    expect(conflict?.display).toBe("72–74 m² podle zdrojů");
  });

  it("normalizes currency aliases", () => {
    expect(normalizeCurrency("Kč")).toBe("CZK");
    expect(areaToSquareMeters(10.764, "sqft")).toBeCloseTo(1, 1);
  });

  it("scores near-duplicate addresses highly", () => {
    const score = computeDedupeScore(
      {
        id: "1",
        street: "Korunní",
        houseNumber: "100",
        publicCity: "Praha",
        usableArea: 74,
        askingPrice: 6_490_000,
      },
      {
        id: "2",
        street: "Korunní",
        houseNumber: "100",
        publicCity: "Praha",
        usableArea: 72,
        askingPrice: 6_500_000,
      },
    );
    expect(score.aboveReviewThreshold).toBe(true);
  });
});

describe("price history on demo records", () => {
  it("vinohrady demo includes price decrease timeline", () => {
    const record = getDemoPropertyRecord("demo-byt-3kk-vinohrady") as PropertyRecord;
    expect(record.priceHistory?.length).toBeGreaterThanOrEqual(2);
    expect(record.priceHistory?.[1]?.changeType).toBe("DECREASED");
    expect(record.isDemo).toBe(true);
  });
});

describe("card mapper", () => {
  it("maps public DTO to PropertyCard including conflict area display", async () => {
    const { mapPublicDtoToPropertyCard } = await import("./card-mapper");
    const { getDemoPublicProperty } = await import("@/content/demo-canonical-properties");
    const dto = getDemoPublicProperty("demo-byt-3kk-vinohrady")!;
    const card = mapPublicDtoToPropertyCard(dto);
    expect(card.href).toContain(dto.slug);
    expect(card.isDemo).toBe(true);
    expect(card.areaDisplay).toContain("podle zdrojů");
    expect(card.dataQuality).toBeTruthy();
    expect(card.tags?.length).toBeGreaterThan(0);
  });
});
