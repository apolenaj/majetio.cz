import type { Metadata } from "next";
import Link from "next/link";

import { preparePageMeta } from "@/components/content/page-helpers";
import {
  PageHeader,
  StandardPageLayout,
} from "@/components/layout/page-layouts";
import { ContextualDisclaimer, MethodologyLink } from "@/components/trust";
import { InlineAlert } from "@/components/feedback/states";
import { groupPublicDataSources } from "@/content/data-sources/public-catalog";
import { METHODOLOGY_REVALIDATE_SECONDS } from "@/content/methodology/hub";
import { buildDataSourcesJsonLd } from "@/lib/seo/methodology-jsonld";

export const revalidate = METHODOLOGY_REVALIDATE_SECONDS;

export const metadata: Metadata = preparePageMeta({
  title: "Zdroje dat",
  description:
    "Kategorie zdrojů dat Majetio: property listings, veřejné registry, partner data a odvozené metriky — včetně frekvence aktualizace a limitů.",
  path: "/zdroje-dat",
});

export default function ZdrojeDatPage() {
  const groups = groupPublicDataSources();
  const jsonLd = buildDataSourcesJsonLd();

  return (
    <StandardPageLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHeader
        title="Zdroje dat"
        description="Odkud Majetio bere vstupy. U každé kategorie uvádíme typ, frekvenci aktualizace a limity. Interní licenční detaily nezveřejňujeme."
        breadcrumbs={[
          { href: "/", label: "Domů" },
          { label: "Zdroje dat" },
        ]}
      />

      <InlineAlert tone="info" title="AI není source of truth">
        AI může shrnovat již spočtené výsledky. Primární pravda zůstává ve
        zdrojích níže, ve výpočetním jádru a v{" "}
        <Link
          href="/metodika/ai-a-vysvetlitelnost"
          className="font-medium underline-offset-2 hover:underline"
        >
          metodice AI
        </Link>
        . AI negeneruje právní fakta.
      </InlineAlert>

      <div className="mt-10 space-y-14">
        {groups.map((group) => (
          <section
            key={group.category}
            id={group.category}
            aria-labelledby={`cat-${group.category}`}
            className="max-w-3xl"
          >
            <h2
              id={`cat-${group.category}`}
              className="font-display text-h2 text-[var(--text-primary)]"
            >
              {group.label.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
              {group.label.description}
            </p>

            <ul className="mt-6 space-y-8">
              {group.items.map((item) => (
                <li key={item.id} id={item.id} className="scroll-mt-24">
                  <h3 className="text-h4 font-medium text-[var(--text-primary)]">
                    {item.name}
                  </h3>
                  <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-[var(--text-caption)] font-medium tracking-wide text-[var(--text-muted)] uppercase">
                        Typ
                      </dt>
                      <dd className="mt-1 text-[var(--text-secondary)]">
                        {item.type}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[var(--text-caption)] font-medium tracking-wide text-[var(--text-muted)] uppercase">
                        Aktualizace
                      </dt>
                      <dd className="mt-1 text-[var(--text-secondary)]">
                        {item.updateFrequency}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4">
                    <p className="text-[var(--text-caption)] font-medium tracking-wide text-[var(--text-muted)] uppercase">
                      Použití
                    </p>
                    <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
                      {item.usedFor.map((u) => (
                        <li key={u}>{u}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4">
                    <p className="text-[var(--text-caption)] font-medium tracking-wide text-[var(--text-muted)] uppercase">
                      Limity
                    </p>
                    <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
                      {item.limitations.map((l) => (
                        <li key={l}>{l}</li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section
          aria-labelledby="ai-boundary"
          className="max-w-2xl border-t border-[var(--border-default)] pt-10"
        >
          <h2
            id="ai-boundary"
            className="font-display text-h2 text-[var(--text-primary)]"
          >
            Hranice AI vůči zdrojům
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
            Shrnutí a vysvětlení mohou vzniknout z AI vrstvy, ale nemění listing,
            registry ani spočtené metriky. Právní fakta (katastr, smlouvy, daňové
            výklady, závazné úvěrové limity) AI negeneruje.
          </p>
          <p className="mt-4">
            <MethodologyLink
              topic="general"
              href="/metodika/ai-a-vysvetlitelnost"
            >
              AI a vysvětlitelnost
            </MethodologyLink>
          </p>
        </section>

        <ContextualDisclaimer context="general">
          <p>
            Katalog uvádí veřejné kategorie zdrojů. Konkrétní smluvní identifikátory
            a licenční podmínky partnerů zde neuvádíme.
          </p>
          <p className="mt-2">
            <MethodologyLink topic="general" />
            {" · "}
            <MethodologyLink topic="valuation" />
          </p>
        </ContextualDisclaimer>
      </div>
    </StandardPageLayout>
  );
}
