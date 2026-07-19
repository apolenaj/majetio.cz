import { describe, expect, it } from "vitest";

import { toPublicPropertyDto } from "./dto";
import { canViewProperty } from "./authorization";
import { createPropertyService, type PropertyRepository } from "./property-service";
import {
  buildPropertyDetailJsonLd,
  buildPropertyDetailMetadata,
  isPropertyDetailIndexable,
} from "./detail-seo";
import { getDemoPropertyRecord } from "@/content/demo-canonical-properties";
import { derivePriceDecrease } from "./price-change";
import { assertAnalyticsSafe, track } from "@/lib/analytics/events";

function repoWith(...records: NonNullable<ReturnType<typeof getDemoPropertyRecord>>[]) {
  const map = new Map(records.map((r) => [r.slug, r]));
  const repository: PropertyRepository = {
    findBySlug: async (slug) => map.get(slug) ?? null,
    findById: async (id) => [...map.values()].find((r) => r.id === id) ?? null,
    search: async () => ({ items: [], hasMore: false }),
  };
  return createPropertyService({ repository });
}

describe("Prompt 9 Part 5 — missing data & unknown price", () => {
  it("does not invent price history decrease without points", () => {
    expect(derivePriceDecrease([], 5_000_000)).toBeNull();
    expect(
      derivePriceDecrease(
        [
          {
            amount: 5_000_000,
            currency: "CZK",
            changeType: "INITIAL",
            observedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        null,
      ),
    ).toBeNull();
  });

  it("public DTO keeps null asking price instead of coercing to 0", () => {
    const record = getDemoPropertyRecord("demo-byt-3kk-vinohrady")!;
    const dto = toPublicPropertyDto({
      ...record,
      askingPrice: null,
      pricePerSqm: null,
      grossYieldPct: null,
      cashFlowMonthlyCzk: null,
      majetioScore: null,
      priceHistory: [],
    });
    expect(dto.askingPrice).toBeNull();
    expect(dto.pricePerSqm).toBeNull();
    expect(dto.grossYieldPct).toBeNull();
    expect(dto.cashFlowMonthlyCzk).toBeNull();
    expect(dto.majetioScore).toBeNull();
    expect(dto.priceHistory).toEqual([]);
  });
});

describe("Prompt 9 Part 5 — IDOR on private property", () => {
  it("User A cannot open User B private listing (null = notFound)", async () => {
    const privateB = getDemoPropertyRecord("demo-private-owner-b")!;
    expect(privateB.visibility).toBe("PRIVATE");
    expect(privateB.ownerUserId).toBe("user-b-owner");

    expect(canViewProperty(privateB, { userId: "user-a", role: "USER" })).toBe(
      false,
    );
    expect(
      canViewProperty(privateB, { userId: "user-b-owner", role: "USER" }),
    ).toBe(true);

    const service = repoWith(privateB);
    expect(
      await service.getPublicBySlug(privateB.slug, {
        viewer: { userId: "user-a", role: "USER" },
      }),
    ).toBeNull();
    expect(
      await service.getPublicBySlug(privateB.slug, {
        viewer: { userId: "user-b-owner", role: "USER" },
      }),
    ).not.toBeNull();
  });
});

describe("Prompt 9 Part 5 — SEO", () => {
  it("demo and private listings are noindex", () => {
    const demo = toPublicPropertyDto(getDemoPropertyRecord("demo-byt-3kk-vinohrady")!);
    expect(isPropertyDetailIndexable(demo)).toBe(false);
    const meta = buildPropertyDetailMetadata(demo);
    expect(meta.robots).toMatchObject({ index: false });

    const privateRec = getDemoPropertyRecord("demo-private-owner-b")!;
    const privateDto = toPublicPropertyDto(privateRec);
    expect(privateDto.visibility).toBe("PRIVATE");
    expect(isPropertyDetailIndexable(privateDto)).toBe(false);
  });

  it("JSON-LD is RealEstateListing without Product or AggregateRating", () => {
    const dto = toPublicPropertyDto(getDemoPropertyRecord("demo-byt-3kk-vinohrady")!);
    const json = buildPropertyDetailJsonLd(dto);
    const raw = JSON.stringify(json);
    expect(json).toMatchObject({ "@type": "RealEstateListing" });
    expect(raw).not.toContain("AggregateRating");
    expect(raw).not.toContain('"@type":"Product"');
    expect(raw).toContain("Offer");
  });

  it("omits Offer when asking price is unknown", () => {
    const record = getDemoPropertyRecord("demo-byt-3kk-vinohrady")!;
    const dto = toPublicPropertyDto({ ...record, askingPrice: null });
    const json = buildPropertyDetailJsonLd(dto) as { offers?: unknown };
    expect(json.offers).toBeUndefined();
  });
});

describe("Prompt 9 Part 5 — analytics privacy", () => {
  it("allows detail events without CZK props", () => {
    expect(() =>
      assertAnalyticsSafe({
        name: "property_detail_viewed",
        props: {
          slug: "demo-byt-3kk-vinohrady",
          is_demo: true,
          has_asking_price: true,
          visibility: "PUBLIC",
        },
      }),
    ).not.toThrow();
    expect(() =>
      track({
        name: "scenario_changed",
        props: { scenario_id: "long_term_rent", is_demo: true },
      }),
    ).not.toThrow();
    expect(() =>
      track({
        name: "financing_cta_clicked",
        props: { location: "property_detail" },
      }),
    ).not.toThrow();
  });

  it("rejects forbidden finance keys", () => {
    const unsafe = {
      name: "property_detail_viewed" as const,
      props: {
        slug: "x",
        is_demo: true,
        has_asking_price: false,
        visibility: "PUBLIC",
        price: 6_490_000,
      },
    };
    expect(() =>
      assertAnalyticsSafe(unsafe as unknown as Parameters<typeof assertAnalyticsSafe>[0]),
    ).toThrow(/forbidden/i);
  });
});
