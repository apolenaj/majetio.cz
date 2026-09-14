/**
 * Prompt 20.5 — SEO, a11y & frontend performance regression.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import robots from "@/app/robots";
import { buildStaticSitemap } from "@/domains/seo/sitemap-builders";
import { buildOrganizationJsonLd } from "@/components/seo/json-ld";
import { resolveHypotekaJasneConfig } from "@/integrations/hypotekajasne/config";

describe("Prompt 20.5 — SEO indexability", () => {
  it("excludes /analyza from static sitemap (layout is noindex)", () => {
    const urls = buildStaticSitemap().map((e) => e.url);
    expect(urls.every((u) => !u.includes("/analyza"))).toBe(true);
  });

  it("robots disallows bare /analyza and nested /analyza/", () => {
    const result = robots();
    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    const disallow = rule?.disallow ?? [];
    const list = Array.isArray(disallow) ? disallow : [disallow];
    expect(list).toEqual(expect.arrayContaining(["/analyza", "/analyza/"]));
  });

  it("Organization JSON-LD uses canonical helper logo path", () => {
    const org = buildOrganizationJsonLd("https://majetio.cz");
    expect(org.logo).toContain("/brand/icons/apple-touch-icon.png");
    expect(org["@type"]).toBe("Organization");
  });
});

describe("Prompt 20.5 — A11y contracts", () => {
  it("Dialog sr-only description is Czech and includes title context", () => {
    const src = readFileSync(
      join(process.cwd(), "src/components/overlays/dialog.tsx"),
      "utf8",
    );
    expect(src).toMatch(/Dialogové okno/);
    expect(src).not.toMatch(/sr-only">\s*Dialog\s*</);
  });

  it("mobile filter sheet implements Tab focus trap", () => {
    const src = readFileSync(
      join(
        process.cwd(),
        "src/components/property/search/property-search-filters.tsx",
      ),
      "utf8",
    );
    expect(src).toMatch(/aria-labelledby="mobile-filters-title"/);
    expect(src).toMatch(/aria-haspopup="dialog"/);
    expect(src).toMatch(/focusable\.length/);
    expect(src).toMatch(/previouslyFocused/);
  });
});

describe("Prompt 20.5 — Performance contracts", () => {
  it("primary body font preloads; Arabic stays preload false", () => {
    const src = readFileSync(join(process.cwd(), "src/app/layout.tsx"), "utf8");
    expect(src).toMatch(/DM_Sans\([\s\S]*preload:\s*true/);
    expect(src).toMatch(/Noto_Sans_Arabic\([\s\S]*preload:\s*false/);
  });

  it("property cards use PropertyListingImage (next/image for same-origin)", () => {
    const card = readFileSync(
      join(process.cwd(), "src/components/property/property-card.tsx"),
      "utf8",
    );
    expect(card).toMatch(/PropertyListingImage/);
    const img = readFileSync(
      join(process.cwd(), "src/components/property/property-listing-image.tsx"),
      "utf8",
    );
    expect(img).toMatch(/from "next\/image"/);
  });
});

describe("Prompt 20.5 — Demo mortgage fail-closed", () => {
  it("disables mock HJ in production without ALLOW_MOCK", () => {
    const cfg = resolveHypotekaJasneConfig({
      NODE_ENV: "production",
      VERCEL_ENV: "production",
      HYPOTEKAJASNE_USE_MOCK: "true",
      HYPOTEKAJASNE_ENABLED: "false",
    } as NodeJS.ProcessEnv);
    expect(cfg.useMock).toBe(false);
  });

  it("allows mock in development", () => {
    const cfg = resolveHypotekaJasneConfig({
      NODE_ENV: "development",
      HYPOTEKAJASNE_USE_MOCK: "true",
    } as NodeJS.ProcessEnv);
    expect(cfg.useMock).toBe(true);
  });
});
