/**
 * Phase 2 — frontend / SEO / edge / legal-gate regression.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  assertCatalogProductCheckoutAllowed,
  isCatalogProductCheckoutAllowed,
  isCatalogProductPubliclyListed,
} from "@/domains/commerce/product-availability";
import { pricingCatalog } from "@/config/pricing-architecture";
import { sanitizeUtmValue, parseUtmFromSearchParams } from "@/lib/analytics/utm";
import { applyUrlFiltersToListings } from "@/domains/properties/search/apply-filters";
import type { SearchableListing } from "@/domains/properties/search/apply-filters";
import { EMPTY_PROPERTY_URL_STATE } from "@/domains/properties/search/url-state";

const root = (...parts: string[]) => join(process.cwd(), ...parts);

describe("Phase 2 — product availability gates", () => {
  it("blocks purchase_concierge checkout when legal flag default OFF", () => {
    expect(isCatalogProductCheckoutAllowed("purchase_concierge")).toBe(false);
    expect(assertCatalogProductCheckoutAllowed("purchase_concierge").ok).toBe(
      false,
    );
  });

  it("hides flag-gated OFF products from public listing helper", () => {
    const concierge = pricingCatalog.find((p) => p.key === "purchase_concierge");
    expect(concierge).toBeTruthy();
    if (concierge) {
      expect(isCatalogProductPubliclyListed(concierge)).toBe(false);
    }
  });

  it("create-order and checkout wire the gate", () => {
    expect(
      readFileSync(
        root("src/domains/orders/service/create-order.ts"),
        "utf8",
      ),
    ).toMatch(/assertCatalogProductCheckoutAllowed/);
    expect(
      readFileSync(root("src/app/(account)/checkout/page.tsx"), "utf8"),
    ).toMatch(/isCatalogProductCheckoutAllowed/);
  });
});

describe("Phase 2 — UTM PII reject", () => {
  it("strips email-like utm values", () => {
    expect(sanitizeUtmValue("user@majetio.cz")).toBeNull();
    expect(sanitizeUtmValue("google")).toBe("google");
    const parsed = parseUtmFromSearchParams(
      new URLSearchParams("utm_source=a@b.cz&utm_medium=cpc"),
    );
    expect(parsed.utm_source).toBeUndefined();
    expect(parsed.utm_medium).toBe("cpc");
  });
});

describe("Phase 2 — edge price/area filters", () => {
  it("does not treat null askingPrice as 0 for cenaOd", () => {
    const listings = [
      {
        id: "1",
        slug: "a",
        title: "A",
        askingPrice: null,
        usableArea: null,
        propertyType: "FLAT",
        location: { label: "Praha", city: "Praha", district: null },
        tags: [],
      },
      {
        id: "2",
        slug: "b",
        title: "B",
        askingPrice: 5_000_000,
        usableArea: 60,
        propertyType: "FLAT",
        location: { label: "Praha", city: "Praha", district: null },
        tags: [],
      },
    ] as unknown as SearchableListing[];

    const filtered = applyUrlFiltersToListings(listings, {
      ...EMPTY_PROPERTY_URL_STATE,
      cenaOd: 1,
    });
    expect(filtered.map((p) => p.id)).toEqual(["2"]);
  });
});

describe("Phase 2 — SEO/PWA surface", () => {
  it("manifest and GSC verification hook exist", () => {
    expect(readFileSync(root("src/app/manifest.ts"), "utf8")).toMatch(
      /icon-192/,
    );
    expect(readFileSync(root("src/app/layout.tsx"), "utf8")).toMatch(
      /GOOGLE_SITE_VERIFICATION/,
    );
    expect(readFileSync(root("next.config.ts"), "utf8")).toMatch(
      /productionBrowserSourceMaps:\s*false/,
    );
  });

  it("apex host redirects toward www in production middleware", () => {
    expect(readFileSync(root("src/middleware.ts"), "utf8")).toMatch(
      /www\.majetio\.cz/,
    );
  });
});
