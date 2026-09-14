import type { MetadataRoute } from "next";

import {
  SITEMAP_SEGMENTS,
  buildSitemapSegment,
  type SitemapSegmentId,
} from "@/domains/seo/sitemap-builders";

/**
 * Split sitemaps: static / properties / locations / guides.
 * Next.js 16: `id` is a Promise<string>.
 */
export async function generateSitemaps() {
  return SITEMAP_SEGMENTS.map((id) => ({ id }));
}

export default async function sitemap(props: {
  id: Promise<string> | string;
}): Promise<MetadataRoute.Sitemap> {
  const id = typeof props.id === "string" ? props.id : await props.id;
  if (!SITEMAP_SEGMENTS.includes(id as SitemapSegmentId)) {
    return [];
  }
  return buildSitemapSegment(id as SitemapSegmentId);
}
