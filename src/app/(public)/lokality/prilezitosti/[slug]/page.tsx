import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { preparePageMeta } from "@/components/content/page-helpers";
import { PageHeader } from "@/components/layout/page-layouts";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import {
  getMarketOpportunity,
  MARKET_OPPORTUNITY_REGISTRY,
} from "@/domains/locations/integration/market-opportunities/registry";
import { listComparableLocationSlugs, loadLocationPageProfile } from "@/domains/locations/service/location-page-service";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return MARKET_OPPORTUNITY_REGISTRY.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const def = getMarketOpportunity(slug);
  if (!def) {
    return preparePageMeta({
      title: "Příležitost nenalezena",
      description: "Ranking lokality není k dispozici.",
      path: `/lokality/prilezitosti/${slug}`,
      noIndex: true,
    });
  }
  return preparePageMeta({
    title: def.title,
    description: `${def.goal} ${def.methodologySummary}`,
    path: `/lokality/prilezitosti/${slug}`,
  });
}

export default async function MarketOpportunityPage({ params }: Props) {
  const { slug } = await params;
  const def = getMarketOpportunity(slug);
  if (!def) notFound();

  const slugs = listComparableLocationSlugs();
  const rows = await Promise.all(
    slugs.map(async (s) => {
      const profile = await loadLocationPageProfile(s);
      if (!profile) return null;
      const metric = profile.summary.find((m) => m.key === def.metricKey);
      const liquidity = profile.supplyDemand.medianDom;
      const value =
        def.metricKey === "property_market.median_days_on_market"
          ? liquidity.value
          : metric?.value ?? null;
      return {
        slug: s,
        name: profile.location.publicLabel,
        value,
        formatted: metric?.formattedValue ?? liquidity.formattedValue,
        sampleCount: metric?.sampleCount ?? liquidity.sampleCount,
      };
    }),
  );

  const ranked = rows
    .filter((r): r is NonNullable<typeof r> => r != null && r.value != null)
    .filter((r) => (r.sampleCount ?? 0) >= def.minSampleCount)
    .sort((a, b) =>
      def.sortDirection === "asc" ? a.value! - b.value! : b.value! - a.value!,
    );

  return (
    <Container className="py-12 sm:py-16">
      <PageHeader
        title={def.title}
        description={def.goal}
        breadcrumbs={[
          { href: "/", label: "Domů" },
          { href: "/lokality", label: "Lokality" },
          { label: def.title },
        ]}
      />

      <Card padding="md" className="mb-8">
        <h2 className="font-display text-lg text-[var(--text-primary)]">Metodika</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{def.methodologySummary}</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
          <li>Období: {def.periodLabel}</li>
          <li>Cílová skupina: {def.audience}</li>
          <li>Min. vzorek na lokalitu: {def.minSampleCount}</li>
          <li>Segment: {def.segmentKey}</li>
        </ul>
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          Toto není clickbait ranking „nejlepších lokalit“ — každá stránka má definovaný
          investiční cíl a transparentní pravidla řazení.
        </p>
      </Card>

      {ranked.length < def.minLocations ? (
        <p className="text-sm text-[var(--text-secondary)]">
          Nedostatek lokalit s dostatečným pokrytím dat pro tento ranking.
        </p>
      ) : (
        <ol className="space-y-3">
          {ranked.map((row, i) => (
            <li key={row.slug}>
              <Card variant="interactive" padding="md" as="article">
                <Link href={`/lokality/${row.slug}`} className="flex items-center justify-between">
                  <span>
                    <span className="font-metric text-[var(--text-muted)]">{i + 1}.</span>{" "}
                    <span className="font-medium text-[var(--text-primary)]">{row.name}</span>
                  </span>
                  <span className="font-metric font-semibold">{row.formatted}</span>
                </Link>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </Container>
  );
}
