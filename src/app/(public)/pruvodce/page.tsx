import type { Metadata } from "next";
import Link from "next/link";

import { preparePageMeta } from "@/components/content/page-helpers";
import { InlineAlert } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-layouts";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Grid } from "@/components/ui/layout-primitives";
import { GUIDE_ARTICLES, GUIDE_CATEGORIES } from "@/content/guides";

export const metadata: Metadata = preparePageMeta({
  title: "Průvodce",
  description: "Průvodce koupí, investováním a financováním — srozumitelně a bez falešných tipů.",
  path: "/pruvodce",
});

export default function PruvodcePage() {
  return (
    <Container className="py-12 sm:py-16">
      <PageHeader
        title="Průvodce"
        description="Obsahový hub. Ukázkové články jsou označené jako demo / návrh."
        breadcrumbs={[{ href: "/", label: "Domů" }, { label: "Průvodce" }]}
      />

      <InlineAlert tone="info" title="Obsahový model" className="mb-8">
        Kategorie a články mají připravený content model pro budoucí CMS. Nejsou to
        automaticky generované SEO stránky.
      </InlineAlert>

      <h2 className="font-display text-xl text-[var(--text-primary)]">Kategorie</h2>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {GUIDE_CATEGORIES.map((cat) => (
          <li key={cat.slug}>
            <span className="text-sm text-[var(--text-secondary)]">{cat.title}</span>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 font-display text-xl text-[var(--text-primary)]">
        Ukázkové články
      </h2>
      <Grid cols={2} className="mt-4">
        {GUIDE_ARTICLES.map((article) => (
          <Card key={article.slug} variant="interactive" as="article">
            <Link href={`/pruvodce/${article.slug}`} className="block">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="info">Demo obsah</Badge>
                <span className="text-xs text-[var(--text-muted)]">
                  {article.readingMinutes} min čtení
                </span>
              </div>
              <h3 className="mt-3 font-display text-lg text-[var(--text-primary)]">
                {article.title}
              </h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{article.perex}</p>
            </Link>
          </Card>
        ))}
      </Grid>
    </Container>
  );
}
