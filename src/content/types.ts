/** CMS-agnostic content base — see docs/CONTENT_MODEL.md */
export type ContentStatus = "draft" | "demo" | "published" | "archived";

export type ContentBase = {
  id: string;
  slug: string;
  title: string;
  perex?: string;
  body?: string;
  status: ContentStatus;
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
  author?: { name: string; role?: string };
  publishedAt?: string;
  updatedAt?: string;
  category?: string;
  tags?: string[];
  sources?: { label: string; url?: string }[];
  relatedSlugs?: string[];
  cta?: { label: string; href: string };
};
