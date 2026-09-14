import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { preparePageMeta } from "@/components/content/page-helpers";
import { PageHeader } from "@/components/layout/page-layouts";
import {
  JsonLd,
  buildArticleJsonLd,
  buildBreadcrumbListJsonLd,
} from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { GUIDE_ARTICLES, GUIDE_CATEGORIES, getGuideBySlug } from "@/content/guides";
import { getSiteOrigin } from "@/domains/seo/site-origin";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return GUIDE_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getGuideBySlug(slug);
  if (!article) return { title: "Průvodce", robots: { index: false } };
  return preparePageMeta({
    title: article.title,
    description: article.perex ?? article.title,
    path: `/pruvodce/${article.slug}`,
    noIndex: article.status !== "published",
  });
}

export default async function PruvodceArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getGuideBySlug(slug);
  if (!article) notFound();

  const category = GUIDE_CATEGORIES.find((c) => c.slug === article.categorySlug);
  const origin = getSiteOrigin();
  const path = `/pruvodce/${article.slug}`;

  return (
    <Container width="article" className="py-12 sm:py-16">
      {article.status === "published" ? (
        <>
          <JsonLd
            id="guide-article"
            data={buildArticleJsonLd({
              origin,
              path,
              headline: article.title,
              description: article.perex,
              datePublished: article.publishedAt,
              dateModified: article.updatedAt ?? article.publishedAt,
              authorName: article.author?.name,
            })}
          />
          <JsonLd
            id="guide-breadcrumbs"
            data={buildBreadcrumbListJsonLd(origin, [
              { name: "Domů", path: "/" },
              { name: "Průvodce", path: "/pruvodce" },
              { name: article.title },
            ])}
          />
        </>
      ) : null}
      <PageHeader
        title={article.title}
        description={article.perex}
        breadcrumbs={[
          { href: "/", label: "Domů" },
          { href: "/pruvodce", label: "Průvodce" },
          { label: article.title },
        ]}
        badge={<Badge tone="info">Demo / návrh obsahu</Badge>}
        metadata={
          <>
            {category?.title}
            {article.author ? ` · ${article.author.name}` : null}
            {article.publishedAt ? ` · ${article.publishedAt}` : null}
            {` · ${article.readingMinutes} min`}
          </>
        }
      />
      <div className="prose-majetio max-w-none space-y-4 text-[var(--text-secondary)]">
        <p>{article.body}</p>
      </div>
      {article.cta ? (
        <div className="mt-8">
          <ButtonLink href={article.cta.href}>{article.cta.label}</ButtonLink>
        </div>
      ) : null}
    </Container>
  );
}
