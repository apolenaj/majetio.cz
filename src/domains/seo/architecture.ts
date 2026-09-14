/**
 * Multi-host SEO architecture (Prompt 17.5).
 * Majetio.cz = Czech home market; Majetio.com = international shell.
 * Prevents duplicate content via canonical + hreflang + host affinity.
 */

import {
  buildSeoLocaleRoutes,
  getLocaleDefinition,
  type SeoLocaleRoute,
} from "@/domains/i18n/locales";
import { marketRegistry } from "@/domains/markets/registry/market-registry";

export type MajetioHostKind = "CZ_HOME" | "INTERNATIONAL" | "MARKET_SUBDOMAIN";

export type SeoHostConfig = {
  kind: MajetioHostKind;
  /** Public origin without trailing slash. */
  origin: string;
  /** Primary market served by this host (null = multi-market hub). */
  primaryMarketCode: string | null;
  /** Hosts that must not duplicate indexable CZ Czech content. */
  noindexDuplicateOf?: string;
};

/**
 * Production host map. Override via env in runtime helpers.
 */
export const SEO_HOSTS = {
  cz: {
    kind: "CZ_HOME",
    origin: "https://www.majetio.cz",
    primaryMarketCode: "CZ",
  },
  com: {
    kind: "INTERNATIONAL",
    origin: "https://www.majetio.com",
    primaryMarketCode: null,
    noindexDuplicateOf: "https://www.majetio.cz",
  },
} as const satisfies Record<string, SeoHostConfig>;

export type LocationUrlPattern =
  | { kind: "country_landing"; path: string }
  | { kind: "location_hierarchy"; path: string }
  | { kind: "city_property_landing"; path: string };

/**
 * URL structure for locations / country landings (no thin spam paths).
 *
 * CZ home (majetio.cz):
 *   /lokality
 *   /lokality/{kraj}/{okres?}/{obec?}
 *   /nemovitosti/{city-slug}   (only curated city landings)
 *
 * International (majetio.com):
 *   /markets/{marketCode}                    country landing
 *   /markets/{marketCode}/locations/...      hierarchy
 *   /{lang}/markets/...                      when non-default locale
 *
 * Market is NOT in path on majetio.cz (always CZ).
 * Market subdomain later: ae.majetio.com → same path shapes without /markets/AE.
 */
export function buildCountryLandingPath(marketCode: string): string {
  const code = marketCode.toUpperCase();
  if (code === "CZ") return "/lokality";
  return `/markets/${code.toLowerCase()}`;
}

export function buildLocationHierarchyPath(input: {
  marketCode: string;
  segments: readonly string[];
}): string {
  const segs = input.segments.map((s) => s.replace(/^\/+|\/+$/g, "")).filter(Boolean);
  if (input.marketCode.toUpperCase() === "CZ") {
    return segs.length === 0 ? "/lokality" : `/lokality/${segs.join("/")}`;
  }
  const base = buildCountryLandingPath(input.marketCode);
  return segs.length === 0 ? `${base}/locations` : `${base}/locations/${segs.join("/")}`;
}

export type HreflangAlternate = {
  hreflang: string;
  href: string;
};

export type SeoDocumentMeta = {
  canonicalUrl: string;
  hreflangAlternates: HreflangAlternate[];
  /** x-default points at primary language for the market/host. */
  xDefaultHref: string;
  robots: { index: boolean; follow: boolean };
  /** Why index was denied (thin / wrong host / market not public). */
  indexDenialReason: string | null;
};

export function resolveSeoHost(input?: {
  siteOrigin?: string | null;
  marketCode?: string | null;
}): SeoHostConfig {
  const origin = (input?.siteOrigin ?? process.env.NEXT_PUBLIC_SITE_URL ?? SEO_HOSTS.cz.origin)
    .replace(/\/$/, "");
  if (origin.includes("majetio.com")) return { ...SEO_HOSTS.com, origin };
  if (input?.marketCode && input.marketCode.toUpperCase() !== "CZ") {
    return {
      kind: "INTERNATIONAL",
      origin: SEO_HOSTS.com.origin,
      primaryMarketCode: input.marketCode.toUpperCase(),
    };
  }
  return { ...SEO_HOSTS.cz, origin };
}

/**
 * Build canonical + hreflang for a path on a given market.
 * CZ Czech content on majetio.com must noindex (duplicate of majetio.cz).
 */
export function buildSeoDocumentMeta(input: {
  pathname: string;
  marketCode: string;
  siteOrigin?: string | null;
  /** Force noindex (demo, thin page, unpublished). */
  forceNoIndex?: boolean;
  forceNoIndexReason?: string;
}): SeoDocumentMeta {
  const market = marketRegistry.get(input.marketCode);
  const host = resolveSeoHost({
    siteOrigin: input.siteOrigin,
    marketCode: input.marketCode,
  });

  const locales =
    market?.supportedLocales ??
    (input.marketCode.toUpperCase() === "CZ" ? ["cs-CZ", "en-GB"] : ["en-GB"]);

  const routes = buildSeoLocaleRoutes({
    pathname: input.pathname,
    locales,
  });

  const defaultLocale =
    market?.defaultLocale ??
    (input.marketCode.toUpperCase() === "CZ" ? "cs-CZ" : "en-GB");
  const defaultRoute =
    routes.find((r) => r.locale === defaultLocale) ?? routes[0]!;

  const canonicalUrl = `${host.origin}${defaultRoute.localizedPath}`;

  const hreflangAlternates: HreflangAlternate[] = routes.map((r) => ({
    hreflang: r.hreflang,
    href: `${host.origin}${r.localizedPath}`,
  }));

  // Cross-host: CZ market on .com must notindex; canonical still points at rendered host
  // but hreflang includes majetio.cz as the authoritative cs-CZ home.
  if (
    input.marketCode.toUpperCase() === "CZ" &&
    host.kind === "INTERNATIONAL"
  ) {
    const czPath =
      defaultRoute.pathPrefix === ""
        ? input.pathname.startsWith("/")
          ? input.pathname
          : `/${input.pathname}`
        : defaultRoute.localizedPath;
    const filtered = hreflangAlternates.filter((a) => a.hreflang !== "cs-CZ");
    filtered.push({
      hreflang: "cs-CZ",
      href: `${SEO_HOSTS.cz.origin}${czPath}`,
    });
    hreflangAlternates.length = 0;
    hreflangAlternates.push(...filtered);
  }

  let index = true;
  let indexDenialReason: string | null = null;

  if (input.forceNoIndex) {
    index = false;
    indexDenialReason = input.forceNoIndexReason ?? "force_noindex";
  } else if (
    input.marketCode.toUpperCase() === "CZ" &&
    host.kind === "INTERNATIONAL"
  ) {
    // Prevent duplicate Czech home content on .com
    index = false;
    indexDenialReason = "duplicate_cz_content_use_majetio_cz";
  } else if (market && !marketRegistry.listPubliclyActive().some((m) => m.marketCode === market.marketCode)) {
    index = false;
    indexDenialReason = "market_not_publicly_active";
  }

  return {
    canonicalUrl,
    hreflangAlternates,
    xDefaultHref: canonicalUrl,
    robots: { index, follow: true },
    indexDenialReason,
  };
}

/** Next.js Metadata-compatible alternates fragment. */
export function toNextAlternates(meta: SeoDocumentMeta): {
  canonical: string;
  languages: Record<string, string>;
} {
  const languages: Record<string, string> = {
    "x-default": meta.xDefaultHref,
  };
  for (const a of meta.hreflangAlternates) {
    languages[a.hreflang] = a.href;
  }
  return { canonical: meta.canonicalUrl, languages };
}

export function seoLocaleRoutesForMarket(
  marketCode: string,
  pathname: string,
): SeoLocaleRoute[] {
  const market = marketRegistry.get(marketCode);
  const locales = market?.supportedLocales ?? ["en-GB"];
  return buildSeoLocaleRoutes({ pathname, locales });
}

export function assertLocaleDefinition(locale: string): boolean {
  return getLocaleDefinition(locale) != null;
}
