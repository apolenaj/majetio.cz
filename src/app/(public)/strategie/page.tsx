import type { Metadata } from "next";
import Link from "next/link";

import { preparePageMeta } from "@/components/content/page-helpers";
import { PageHeader } from "@/components/layout/page-layouts";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Grid } from "@/components/ui/layout-primitives";
import { STRATEGY_CONTENT } from "@/content/strategies";

export const metadata: Metadata = preparePageMeta({
  title: "Investiční strategie",
  description:
    "Vlastní bydlení, pronájem, rekonstrukce a flip — bez garantovaných výnosů.",
  path: "/strategie",
});

export default function StrategiePage() {
  return (
    <Container className="py-12 sm:py-16">
      <PageHeader
        title="Investiční strategie"
        description="Stejná nemovitost může dávat smysl jen pro určitý záměr. Vyberte strategii a pokračujte k analýze."
        breadcrumbs={[{ href: "/", label: "Domů" }, { label: "Strategie" }]}
      />
      <Grid cols={2}>
        {STRATEGY_CONTENT.map((strategy) => (
          <Card key={strategy.slug} variant="interactive" as="article">
            <Link href={`/strategie/${strategy.slug}`} className="block">
              <h2 className="font-display text-xl text-[var(--text-primary)]">
                {strategy.title}
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{strategy.perex}</p>
              <p className="mt-3 text-sm font-medium text-[var(--text-link)]">
                Zobrazit strategii →
              </p>
            </Link>
          </Card>
        ))}
      </Grid>
    </Container>
  );
}
