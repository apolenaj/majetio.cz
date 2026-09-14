import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { preparePageMeta } from "@/components/content/page-helpers";
import {
  PageHeader,
  StandardPageLayout,
} from "@/components/layout/page-layouts";
import { MethodologySectionBody } from "@/components/methodology/methodology-blocks";
import { MethodologyLink } from "@/components/trust";
import {
  METHODOLOGY_REVALIDATE_SECONDS,
  getMethodologySection,
  listMethodologySlugs,
} from "@/content/methodology/hub";
import { buildMethodologySectionJsonLd } from "@/lib/seo/methodology-jsonld";

export const revalidate = METHODOLOGY_REVALIDATE_SECONDS;

type Props = { params: Promise<{ section: string }> };

export function generateStaticParams() {
  return listMethodologySlugs().map((section) => ({ section }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section: slug } = await params;
  const section = getMethodologySection(slug);
  if (!section) return { title: "Metodika", robots: { index: false } };
  return preparePageMeta({
    title: `${section.title} · Metodika`,
    description: section.description,
    path: `/metodika/${section.slug}`,
  });
}

export default async function MetodikaSectionPage({ params }: Props) {
  const { section: slug } = await params;
  const section = getMethodologySection(slug);
  if (!section) notFound();

  const jsonLd = buildMethodologySectionJsonLd(section);

  return (
    <StandardPageLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHeader
        title={section.title}
        description={section.lead}
        breadcrumbs={[
          { href: "/", label: "Domů" },
          { href: "/metodika", label: "Metodika" },
          { label: section.title },
        ]}
      />

      <MethodologySectionBody
        section={section}
        omitTitle
        showLead={false}
      />

      <nav
        aria-label="Navigace metodiky"
        className="mt-12 flex flex-wrap gap-4 border-t border-[var(--border-default)] pt-8 text-sm"
      >
        <Link
          href="/metodika"
          className="font-medium text-[var(--text-link)] underline-offset-2 hover:underline"
        >
          ← Celá metodika
        </Link>
        <MethodologyLink topic="data-sources" />
        <MethodologyLink topic="valuation" />
      </nav>
    </StandardPageLayout>
  );
}
