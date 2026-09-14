import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { preparePageMeta } from "@/components/content/page-helpers";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Grid } from "@/components/ui/layout-primitives";
import { PageHeader } from "@/components/layout/page-layouts";
import { getStrategyBySlug, STRATEGY_CONTENT } from "@/content/strategies";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return STRATEGY_CONTENT.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const strategy = getStrategyBySlug(slug);
  if (!strategy) return { title: "Strategie" };
  return preparePageMeta({
    title: strategy.title,
    description: strategy.perex ?? strategy.title,
    path: `/strategie/${strategy.slug}`,
  });
}

export default async function StrategieDetailPage({ params }: Props) {
  const { slug } = await params;
  const strategy = getStrategyBySlug(slug);
  if (!strategy) notFound();

  return (
    <Container className="py-12 sm:py-16">
      <PageHeader
        title={strategy.title}
        description={strategy.perex}
        breadcrumbs={[
          { href: "/", label: "Domů" },
          { href: "/strategie", label: "Strategie" },
          { label: strategy.title },
        ]}
        badge={<Badge tone="neutral">Bez garantovaných výnosů</Badge>}
      />

      <div className="max-w-3xl space-y-8 text-sm leading-relaxed text-[var(--text-secondary)]">
        <section>
          <h2 className="font-display text-xl text-[var(--text-primary)]">Pro koho je vhodná</h2>
          <p className="mt-2">{strategy.audience}</p>
        </section>
        <section>
          <h2 className="font-display text-xl text-[var(--text-primary)]">Hlavní výhody</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {strategy.pros.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="font-display text-xl text-[var(--text-primary)]">Hlavní rizika</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {strategy.risks.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="font-display text-xl text-[var(--text-primary)]">Potřebný kapitál</h2>
          <p className="mt-2">{strategy.capital}</p>
        </section>
        <section>
          <h2 className="font-display text-xl text-[var(--text-primary)]">Důležité metriky</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {strategy.metrics.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="font-display text-xl text-[var(--text-primary)]">Typické chyby</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {strategy.mistakes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="font-display text-xl text-[var(--text-primary)]">Jak Majetio pomáhá</h2>
          <p className="mt-2">{strategy.howMajetioHelps}</p>
        </section>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-xl text-[var(--text-primary)]">Relevantní kalkulačky</h2>
        <Grid cols={2} className="mt-4">
          {strategy.relatedCalculators.map((calc) => (
            <Card key={calc.href} variant="interactive" as="article">
              <Link href={calc.href} className="block">
                <h3 className="font-medium text-[var(--text-primary)]">{calc.label}</h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Otevřít nástroj →</p>
              </Link>
            </Card>
          ))}
        </Grid>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        {strategy.cta ? (
          <ButtonLink href={strategy.cta.href}>{strategy.cta.label}</ButtonLink>
        ) : null}
        <ButtonLink href="/nemovitosti" variant="secondary">
          Procházet nemovitosti
        </ButtonLink>
      </div>
    </Container>
  );
}
