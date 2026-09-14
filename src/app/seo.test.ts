import { describe, expect, it } from "vitest";

import robots from "@/app/robots";
import {
  buildStaticSitemap,
  buildGuidesSitemap,
  buildLocationsSitemap,
  STATIC_PAGE_REVISIONS,
} from "@/domains/seo/sitemap-builders";
import { canonicalizePath, buildPageMetadata } from "@/domains/seo/metadata";
import { isPubliclySafeMediaUrl } from "@/domains/properties/service/media-public";
import { buildPropertyDetailJsonLd } from "@/domains/properties/service/detail-seo";
import { getDemoPublicProperty } from "@/content/demo-canonical-properties";

describe("SEO routes", () => {
  it("static sitemap uses revision dates, not request-time now", () => {
    const entries = buildStaticSitemap();
    expect(entries.some((e) => e.url.includes("/nemovitosti"))).toBe(true);
    expect(entries.every((e) => !e.url.includes("/ucet"))).toBe(true);
    expect(entries.every((e) => !e.url.includes("/admin"))).toBe(true);
    expect(entries.every((e) => !e.url.includes("/checkout"))).toBe(true);
    expect(entries.every((e) => !e.url.includes("/analyza"))).toBe(true);

    const homeEntry = entries.find((e) => {
      try {
        return new URL(e.url).pathname === "/";
      } catch {
        return false;
      }
    });
    expect(homeEntry?.lastModified).toEqual(
      new Date(`${STATIC_PAGE_REVISIONS["/"]!}T12:00:00.000Z`),
    );
  });

  it("guides sitemap excludes demo articles", () => {
    const urls = buildGuidesSitemap().map((e) => e.url);
    expect(urls.every((u) => !u.includes("co-je-majetio-skore"))).toBe(true);
  });

  it("locations sitemap is safe for demo-only profiles", () => {
    expect(Array.isArray(buildLocationsSitemap())).toBe(true);
  });

  it("robots disallows private zones including checkout and account aliases", () => {
    const result = robots();
    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    const disallow = rule?.disallow ?? [];
    const list = Array.isArray(disallow) ? disallow : [disallow];
    expect(list).toEqual(
      expect.arrayContaining([
        "/ucet",
        "/account",
        "/admin",
        "/checkout",
        "/private",
        "/hledat",
        "/prihlaseni",
        "/login",
        "/analyza",
        "/analyza/",
        "/profi",
      ]),
    );
  });
});

describe("canonical metadata", () => {
  it("strips query params from canonical path", () => {
    expect(canonicalizePath("/nemovitosti?city=Praha&page=2")).toBe(
      "/nemovitosti",
    );
    const meta = buildPageMetadata({
      title: "Test",
      description: "Popis",
      path: "/nemovitosti?q=x",
    });
    expect(String(meta.alternates?.canonical)).not.toContain("?");
  });
});

describe("private media URL gating", () => {
  it("blocks signed and localhost URLs", () => {
    expect(
      isPubliclySafeMediaUrl(
        "https://bucket.s3.amazonaws.com/x?X-Amz-Signature=abc",
      ),
    ).toBe(false);
    expect(isPubliclySafeMediaUrl("http://127.0.0.1/photo.jpg")).toBe(false);
    expect(
      isPubliclySafeMediaUrl("https://cdn.example.com/listings/photo.jpg"),
    ).toBe(true);
  });
});

describe("property JSON-LD", () => {
  it("never includes AggregateRating", () => {
    const dto = getDemoPublicProperty("demo-byt-3kk-vinohrady");
    if (!dto) return;
    const ld = JSON.stringify(buildPropertyDetailJsonLd(dto));
    expect(ld.toLowerCase()).not.toContain("aggregaterating");
    expect(ld.toLowerCase()).not.toContain("ratingvalue");
  });
});
