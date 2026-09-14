import { describe, expect, it } from "vitest";

import {
  buildInternationalCacheKey,
  INTERNATIONAL_CACHE_VERSION,
} from "@/domains/i18n/cache-keys";
import {
  resolveInternationalPreference,
  suggestMarketFromGeoCountry,
} from "@/domains/i18n/preference/store";
import {
  buildSeoLocaleRoutes,
  getLocaleDir,
  languageFromLocale,
  stripLocalePrefix,
} from "@/domains/i18n";
import { loadMessageCatalog } from "@/domains/i18n/messages";
import {
  buildSeoDocumentMeta,
  toNextAlternates,
  SEO_HOSTS,
} from "@/domains/seo/architecture";
import { preparePageMeta } from "@/components/content/page-helpers";
import { HOME_MARKET_CODE } from "@/domains/markets/codes";

describe("geo suggestion never auto-applies market", () => {
  it("suggests AE from geo but keeps default CZ without cookies", () => {
    expect(suggestMarketFromGeoCountry("AE")).toBe("AE");
    const pref = resolveInternationalPreference({
      geoCountryHeader: "AE",
    });
    expect(pref.marketCode).toBe(HOME_MARKET_CODE);
    expect(pref.explicit).toBe(false);
    expect(pref.suggestedMarketCode).toBe("AE");
  });

  it("does not suggest when geo matches active market", () => {
    const pref = resolveInternationalPreference({
      cookieMarket: "CZ",
      geoCountryHeader: "CZ",
    });
    expect(pref.marketCode).toBe("CZ");
    expect(pref.explicit).toBe(true);
    expect(pref.suggestedMarketCode).toBeNull();
  });

  it("profile market wins over cookie; geo stays suggestion-only", () => {
    const pref = resolveInternationalPreference({
      cookieMarket: "CZ",
      profileMarket: "SK",
      geoCountryHeader: "AE",
    });
    expect(pref.marketCode).toBe("SK");
    expect(pref.suggestedMarketCode).toBe("AE");
  });
});

describe("cache keys (Rule 208)", () => {
  it("always includes market, locale, currency, version", () => {
    const key = buildInternationalCacheKey({
      market: "CZ",
      locale: "cs-CZ",
      currency: "CZK",
      resource: "/nemovitosti",
    });
    expect(key).toContain("m:CZ");
    expect(key).toContain("l:cs-CZ");
    expect(key).toContain("c:CZK");
    expect(key).toContain(`v:${INTERNATIONAL_CACHE_VERSION}`);
    expect(key).toContain("r:/nemovitosti");
  });
});

describe("locale routing + RTL", () => {
  it("strips /en prefix while leaving unprefixed CZ paths intact", () => {
    expect(stripLocalePrefix("/nemovitosti")).toEqual({
      locale: null,
      pathname: "/nemovitosti",
    });
    const en = stripLocalePrefix("/en/nemovitosti");
    expect(en.locale?.pathPrefix).toBe("en");
    expect(en.pathname).toBe("/nemovitosti");
  });

  it("marks Arabic as RTL", () => {
    expect(getLocaleDir("ar-AE")).toBe("rtl");
    expect(getLocaleDir("cs-CZ")).toBe("ltr");
    expect(languageFromLocale("ar-AE")).toBe("ar");
  });

  it("builds hreflang routes with empty prefix for default language", () => {
    const routes = buildSeoLocaleRoutes({
      pathname: "/nemovitosti",
      locales: ["cs-CZ", "en-GB"],
    });
    expect(routes.find((r) => r.locale === "cs-CZ")?.localizedPath).toBe(
      "/nemovitosti",
    );
    expect(routes.find((r) => r.locale === "en-GB")?.localizedPath).toBe(
      "/en/nemovitosti",
    );
  });
});

describe("lazy message catalogs", () => {
  it("loads EN catalog independently of CS default", async () => {
    const en = await loadMessageCatalog("en-GB");
    expect(en["nav.language"]).toBeTruthy();
    expect(typeof en["nav.language"]).toBe("string");
  });
});

describe("SEO preparePageMeta hreflang + canonical", () => {
  it("emits canonical and language alternates for CZ", () => {
    const meta = preparePageMeta({
      title: "Nemovitosti",
      description: "Seznam",
      path: "/nemovitosti",
      marketCode: "CZ",
      siteOrigin: SEO_HOSTS.cz.origin,
    });
    expect(meta.alternates?.canonical).toMatch(/majetio\.cz\/nemovitosti$/);
    const languages = meta.alternates?.languages as Record<string, string>;
    expect(languages["cs-CZ"]).toMatch(/\/nemovitosti$/);
    expect(languages["en-GB"]).toMatch(/\/en\/nemovitosti$/);
    expect(languages["x-default"]).toBe(meta.alternates?.canonical);

    const doc = buildSeoDocumentMeta({
      pathname: "/nemovitosti",
      marketCode: "CZ",
      siteOrigin: SEO_HOSTS.cz.origin,
    });
    expect(toNextAlternates(doc).canonical).toBe(doc.canonicalUrl);
    expect(doc.robots.index).toBe(true);
  });
});
