/**
 * Central page metadata builder — Title, Description, OG, Twitter, canonical.
 * Strip query/hash from paths so filter URLs never become canonical.
 */

import type { Metadata } from "next";

import {
  buildSeoDocumentMeta,
  toNextAlternates,
} from "@/domains/seo/architecture";
import { getSiteOrigin } from "@/domains/seo/site-origin";

export type BuildPageMetadataInput = {
  title: string;
  description: string;
  /** Path only — query strings are stripped for canonical. */
  path: string;
  noIndex?: boolean;
  marketCode?: string;
  siteOrigin?: string | null;
  ogImage?: {
    url: string;
    alt?: string;
    width?: number;
    height?: number;
  } | null;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
};

/** Normalize pathname: leading slash, no query/hash (duplicate prevention). */
export function canonicalizePath(path: string): string {
  const withoutQuery = path.split("?")[0]?.split("#")[0] ?? "/";
  if (!withoutQuery.startsWith("/")) return `/${withoutQuery}`;
  return withoutQuery.replace(/\/{2,}/g, "/") || "/";
}

export function buildPageMetadata(input: BuildPageMetadataInput): Metadata {
  const path = canonicalizePath(input.path);
  const seo = buildSeoDocumentMeta({
    pathname: path,
    marketCode: input.marketCode ?? "CZ",
    siteOrigin: input.siteOrigin ?? getSiteOrigin(),
    forceNoIndex: input.noIndex,
    forceNoIndexReason: input.noIndex ? "page_noindex" : undefined,
  });
  const alternates = toNextAlternates(seo);
  const index = seo.robots.index && !input.noIndex;

  const ogImages = input.ogImage?.url
    ? [
        {
          url: input.ogImage.url,
          alt: input.ogImage.alt ?? input.title,
          width: input.ogImage.width,
          height: input.ogImage.height,
        },
      ]
    : undefined;

  return {
    title: input.title,
    description: input.description,
    alternates,
    robots: {
      index,
      follow: seo.robots.follow,
    },
    openGraph: {
      type: input.type ?? "website",
      title: `${input.title} · Majetio`,
      description: input.description,
      url: seo.canonicalUrl,
      siteName: "Majetio",
      locale: "cs_CZ",
      images: ogImages,
      ...(input.publishedTime
        ? { publishedTime: input.publishedTime }
        : {}),
      ...(input.modifiedTime ? { modifiedTime: input.modifiedTime } : {}),
    },
    twitter: {
      card: ogImages ? "summary_large_image" : "summary",
      title: `${input.title} · Majetio`,
      description: input.description,
      images: ogImages?.map((i) => i.url),
    },
  };
}
