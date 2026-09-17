import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  formatCzk,
  formatPct,
  formatSignedCzk,
} from "@/components/marketing/format";
import {
  PageHeader,
  StandardPageLayout,
} from "@/components/layout/page-layouts";
import { preparePageMeta } from "@/components/content/page-helpers";
import {
  getCaseStudy,
  isCaseStudySlug,
  listCaseStudies,
} from "@/content/case-studies";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return listCaseStudies().map((study) => ({
    slug: study.definition.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const study = getCaseStudy(slug);
  if (!study) return { title: "Ukázková analýza" };
  return preparePageMeta({
    title: `${study.definition.title} — modelová analýza`,
    description: study.definition.assignment,
    path: `/ukazky/${study.definition.slug}`,
  });
}

const provenanceLabel = {
  stated: "Zadaný údaj",
  documented: "Doložený údaj",
  model_assumption: "Modelový předpoklad",
} as const;

export default async function CaseStudyDetailPage({ params }: Props) {
  const { slug } = await params;
  if (!isCaseStudySlug(slug)) notFound();
  const study = getCaseStudy(slug);
  if (!study) notFound();

  const { definition, base, scenarios } = study;

  return (
    <StandardPageLayout>
      <PageHeader
        title={definition.title}
        description={definition.assignment}
        breadcrumbs={[
          { href: "/", label: "Domů" },
          { href: "/ukazky", label: "Ukázky analýz" },
          { label: definition.shortTitle },
        ]}
      />

      <div className="mt-4 inline-flex items-center gap-2 rounded-md bg-[var(--surface-inverse)] px-3 py-1.5 text-xs font-medium text-[var(--text-inverse)]">
        Modelová analýza · Nejde o nabídku k prodeji
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)]">
            <Image
              src={definition.heroImage.src}
              alt={definition.heroImage.alt}
              width={definition.heroImage.width}
              height={definition.heroImage.height}
              className="h-auto w-full object-cover"
              sizes="(max-width: 1024px) 100vw, 60vw"
              priority
            />
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            {definition.heroImage.caption}
          </p>
          {definition.secondaryImages?.map((image) => (
            <div key={image.src} className="space-y-2">
              <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)]">
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={image.width}
                  height={image.height}
                  className="h-auto w-full object-cover"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  loading="lazy"
                />
                <span className="absolute left-3 top-3 rounded-md bg-[var(--surface-inverse)]/85 px-2.5 py-1 text-xs font-medium text-[var(--text-inverse)]">
                  Vizualizace možného stavu
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">{image.caption}</p>
            </div>
          ))}
        </div>

        <aside className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-5">
          <h2 className="font-display text-xl text-[var(--text-primary)]">
            Zadání
          </h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-[var(--text-muted)]">Účel</dt>
              <dd className="text-[var(--text-primary)]">{definition.purposeLabel}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Typ</dt>
              <dd className="text-[var(--text-primary)]">
                {definition.propertyTypeLabel}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Lokalita</dt>
              <dd className="text-[var(--text-primary)]">
                {definition.locationLabel}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Plocha</dt>
              <dd className="text-[var(--text-primary)]">
                {definition.areaSqm} m²
                {definition.units ? ` · ${definition.units} jednotky` : ""}
              </dd>
            </div>
          </dl>
          <Link
            href="/#posoudit"
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[var(--action-primary)] px-4 text-sm font-medium text-white hover:bg-[var(--action-primary-hover)]"
          >
            Chci takto posoudit svou nemovitost
          </Link>
        </aside>
      </div>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-[var(--text-primary)]">
          Vstupní údaje a původ
        </h2>
        <div className="mt-4 overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border-default)]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--background-secondary)] text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Údaj</th>
                <th className="px-4 py-3 font-medium">Hodnota</th>
                <th className="px-4 py-3 font-medium">Původ</th>
              </tr>
            </thead>
            <tbody>
              {definition.inputFields.map((field) => (
                <tr
                  key={field.label}
                  className="border-t border-[var(--border-default)]"
                >
                  <td className="px-4 py-3 text-[var(--text-primary)]">
                    {field.label}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {field.value}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">
                    {provenanceLabel[field.provenance]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Kupní cena", formatCzk(definition.purchasePriceCzk)],
          ["Vedlejší náklady", formatCzk(definition.closingCostsCzk)],
          ["Rekonstrukce", formatCzk(definition.renovationCostCzk)],
          ["Rezerva", formatCzk(definition.reserveCzk)],
          ["Vlastní prostředky", formatCzk(definition.equityCzk)],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-4"
          >
            <p className="text-xs text-[var(--text-muted)]">{label}</p>
            <p className="mt-1 font-medium text-[var(--text-primary)]">{value}</p>
          </div>
        ))}
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-3">
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-5">
          <h2 className="font-display text-xl text-[var(--text-primary)]">
            Příjmy a provoz
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--text-muted)]">EGI / rok</dt>
              <dd>{formatCzk(base.annualEgiCzk)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--text-muted)]">NOI / rok</dt>
              <dd>{formatCzk(base.annualNoiCzk)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--text-muted)]">Neobsazenost</dt>
              <dd>{formatPct(base.vacancyRatePct, 0)}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-5">
          <h2 className="font-display text-xl text-[var(--text-primary)]">
            Financování
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--text-muted)]">Úvěr</dt>
              <dd>{formatCzk(study.loanPrincipalCzk)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--text-muted)]">Splátka / měs.</dt>
              <dd>{formatCzk(base.monthlyDebtServiceCzk)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--text-muted)]">Sazba (základ)</dt>
              <dd>{formatPct(base.interestRatePctPoints)}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-5">
          <h2 className="font-display text-xl text-[var(--text-primary)]">
            Metriky (základ)
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--text-muted)]">Hrubý výnos</dt>
              <dd>{formatPct(base.grossYieldPct)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--text-muted)]">Provozní výnos</dt>
              <dd>{formatPct(base.operatingYieldPct)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--text-muted)]">Cash flow / měs.</dt>
              <dd
                className={cn(
                  base.monthlyCashFlowCzk < 0 &&
                    "text-[var(--action-destructive)]",
                )}
              >
                {formatSignedCzk(base.monthlyCashFlowCzk)}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-[var(--text-primary)]">
          Scénáře
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-5"
            >
              <h3 className="font-medium text-[var(--text-primary)]">
                {scenario.label}
              </h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[var(--text-muted)]">Hrubý výnos</dt>
                  <dd>{formatPct(scenario.grossYieldPct)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--text-muted)]">Provozní výnos</dt>
                  <dd>{formatPct(scenario.operatingYieldPct)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--text-muted)]">Cash flow</dt>
                  <dd>{formatSignedCzk(scenario.monthlyCashFlowCzk)}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
        <ul className="mt-4 space-y-1 text-xs text-[var(--text-muted)]">
          <li>{study.metricNotes.grossYield}</li>
          <li>{study.metricNotes.operatingYield}</li>
          <li>{study.metricNotes.cashFlow}</li>
          <li>{study.metricNotes.tax}</li>
        </ul>
      </section>

      {study.priceAtTargetGrossYieldCzk != null &&
      definition.targetGrossYieldPct != null ? (
        <section className="mt-12 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--background-secondary)] p-5">
          <h2 className="font-display text-xl text-[var(--text-primary)]">
            Cena při cílovém hrubém výnosu {formatPct(definition.targetGrossYieldPct, 1)}
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Při základním EGI by samotná kupní cena{" "}
            <strong>{formatCzk(study.priceAtTargetGrossYieldCzk)}</strong>{" "}
            odpovídala tomuto výnosovému cíli. Nejde o odhad tržní hodnoty —
            tržní ocenění neuvádíme, protože chybí srovnávací podklady.
          </p>
        </section>
      ) : null}

      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-xl text-[var(--text-primary)]">
            Hlavní rizika
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
            {definition.risks.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-display text-xl text-[var(--text-primary)]">
            Chybějící podklady
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
            {definition.missingDocuments.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl text-[var(--text-primary)]">
          Zjištění
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
          {definition.findings.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="mt-12 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-6">
        <h2 className="font-display text-xl text-[var(--text-primary)]">
          Závěr (podmíněný předpoklady)
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
          {definition.conclusion}
        </p>
        <Link
          href="/#posoudit"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-[var(--action-primary)] px-5 text-sm font-medium text-white hover:bg-[var(--action-primary-hover)]"
        >
          Chci takto posoudit svou nemovitost
        </Link>
      </section>
    </StandardPageLayout>
  );
}
