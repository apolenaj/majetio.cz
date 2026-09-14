/**
 * Sitemap builders — only PUBLIC / indexable URLs with real lastModified.
 * Private, demo, restricted listings never appear.
 */

import type { MetadataRoute } from "next";

import { listMethodologySlugs } from "@/content/methodology/hub";
import { GUIDE_ARTICLES } from "@/content/guides";
import { LEGAL_CONTENT_VERSION } from "@/domains/privacy/legal-content";
import { listIndexableCanonicalPaths } from "@/domains/locations/seo/location-urls";
import { getSiteOrigin } from "@/domains/seo/site-origin";
import { prisma } from "@/lib/db";

/** Content revision dates — not request-time Date.now(). */
export const STATIC_PAGE_REVISIONS: Record<string, string> = {
  "/": "2026-07-15",
  "/nemovitosti": "2026-07-15",
  "/nemovitosti/praha": "2026-07-10",
  "/nemovitosti/brno": "2026-07-10",
  "/nemovitosti/ostrava": "2026-07-10",
  "/nemovitosti/investicni-prilezitosti": "2026-07-10",
  // /analyza is user workspace (layout noindex) — never in sitemap
  "/porovnani": "2026-07-12",
  "/kalkulacky": "2026-07-12",
  "/kalkulacky/investicni-vynos": "2026-07-12",
  "/kalkulacky/cash-flow": "2026-07-12",
  "/kalkulacky/navratnost": "2026-07-12",
  "/kalkulacky/financovani": "2026-07-12",
  "/kalkulacky/rekonstrukce": "2026-07-12",
  "/kalkulacky/maximalni-nabidkova-cena": "2026-07-12",
  "/lokality": "2026-07-14",
  "/lokality/porovnani": "2026-07-14",
  "/strategie": "2026-07-08",
  "/strategie/vlastni-bydleni": "2026-07-08",
  "/strategie/dlouhodoby-pronajem": "2026-07-08",
  "/strategie/kratkodoby-pronajem": "2026-07-08",
  "/strategie/rekonstrukce": "2026-07-08",
  "/strategie/flip": "2026-07-08",
  "/jak-to-funguje": "2026-07-15",
  "/cenik": "2026-07-15",
  "/metodika": "2026-07-22",
  "/metodika/verze": "2026-07-22",
  "/zdroje-dat": "2026-07-22",
  "/majetio-skore": "2026-07-01",
  "/jak-pocitame-vynos": "2026-07-12",
  "/pruvodce": "2026-07-01",
  "/o-nas": "2026-07-22",
  "/duvera-a-bezpecnost": "2026-07-22",
  "/slovnik": "2026-07-22",
  "/kontakt": "2026-07-22",
  "/partneri": "2026-07-01",
  "/podminky": LEGAL_CONTENT_VERSION.TERMS,
  "/ochrana-soukromi": LEGAL_CONTENT_VERSION.PRIVACY,
  "/cookies": LEGAL_CONTENT_VERSION.COOKIES,
  "/pravni-upozorneni": LEGAL_CONTENT_VERSION.LEGAL_NOTICE,
};

function toDate(isoOrDay: string | Date): Date {
  if (isoOrDay instanceof Date) return isoOrDay;
  // YYYY-MM-DD → UTC noon to avoid TZ flip
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoOrDay)) {
    return new Date(`${isoOrDay}T12:00:00.000Z`);
  }
  return new Date(isoOrDay);
}

function entry(
  path: string,
  lastModified: string | Date,
  opts?: {
    changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority?: number;
  },
): MetadataRoute.Sitemap[number] {
  return {
    url: `${getSiteOrigin()}${path}`,
    lastModified: toDate(lastModified),
    changeFrequency: opts?.changeFrequency ?? "monthly",
    priority: opts?.priority ?? 0.7,
  };
}

export type SitemapSegmentId = "static" | "properties" | "locations" | "guides";

export const SITEMAP_SEGMENTS: SitemapSegmentId[] = [
  "static",
  "properties",
  "locations",
  "guides",
];

export function buildStaticSitemap(): MetadataRoute.Sitemap {
  const paths = Object.keys(STATIC_PAGE_REVISIONS);
  const methodology = listMethodologySlugs().map(
    (slug) => `/metodika/${slug}`,
  );

  const all = [...paths, ...methodology.filter((p) => !paths.includes(p))];

  return all.map((path) =>
    entry(path, STATIC_PAGE_REVISIONS[path] ?? "2026-07-22", {
      changeFrequency: path === "/" ? "weekly" : "monthly",
      priority:
        path === "/"
          ? 1
          : path.startsWith("/metodika") || path === "/zdroje-dat"
            ? 0.8
            : 0.7,
    }),
  );
}

/**
 * Only PUBLIC + ACTIVE + non-demo + clear moderation + within quota.
 */
export async function buildPropertiesSitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const rows = await prisma.property.findMany({
      where: {
        visibility: "PUBLIC",
        status: "ACTIVE",
        isDemo: false,
        listingQuotaState: "WITHIN_LIMIT",
        listingModerationStatus: "CLEAR",
      },
      select: {
        slug: true,
        updatedAt: true,
        publishedAt: true,
        lastSeenAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 45_000,
    });

    return rows.map((row) =>
      entry(
        `/nemovitosti/${row.slug}`,
        row.updatedAt ?? row.publishedAt ?? row.lastSeenAt,
        { changeFrequency: "daily", priority: 0.6 },
      ),
    );
  } catch {
    // DB unavailable (local without migrate) — omit properties rather than invent URLs
    return [];
  }
}

export function buildLocationsSitemap(): MetadataRoute.Sitemap {
  // Demo location profiles are filtered out by isLocationPageIndexable
  const paths = listIndexableCanonicalPaths();
  return paths.map((path) =>
    entry(path, "2026-07-14", {
      changeFrequency: "weekly",
      priority: 0.65,
    }),
  );
}

export function buildGuidesSitemap(): MetadataRoute.Sitemap {
  const hub = entry("/pruvodce", "2026-07-01", {
    changeFrequency: "weekly",
    priority: 0.7,
  });

  const articles = GUIDE_ARTICLES.filter((a) => a.status === "published").map(
    (a) =>
      entry(`/pruvodce/${a.slug}`, a.updatedAt ?? a.publishedAt ?? "2026-07-01", {
        changeFrequency: "monthly",
        priority: 0.55,
      }),
  );

  return [hub, ...articles];
}

export async function buildSitemapSegment(
  id: SitemapSegmentId,
): Promise<MetadataRoute.Sitemap> {
  switch (id) {
    case "static":
      return buildStaticSitemap();
    case "properties":
      return buildPropertiesSitemap();
    case "locations":
      return buildLocationsSitemap();
    case "guides":
      return buildGuidesSitemap();
    default:
      return [];
  }
}
