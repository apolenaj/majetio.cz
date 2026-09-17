import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  formatCzk,
  formatPct,
  formatSignedCzk,
} from "@/components/marketing/format";
import { PropertyAuditInquiryForm } from "@/components/marketing/property-audit-inquiry-form";
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

  const { definition, base, scenarios, decision, financing } = study;

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
          <a
            href="#poptavka-studie"
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[var(--action-primary)] px-4 text-sm font-medium text-white hover:bg-[var(--action-primary-hover)]"
          >
            Chci takto posoudit svou nemovitost
          </a>
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
      <p className="mt-3 text-sm text-[var(--text-muted)]">
        {study.reserveTreatment} Celkové pořizovací náklady:{" "}
        {formatCzk(study.totalAcquisitionCostCzk)}.
      </p>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-[var(--text-primary)]">
          Provozní náklady vlastníka
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Položky níže hradí vlastník. Nezahrnují zálohy nájemce za energie a
          služby. Rezerva z koupě sem nevstupuje.
        </p>
        <div className="mt-4 overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border-default)]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--background-secondary)] text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Položka</th>
                <th className="px-4 py-3 font-medium">Ročně</th>
                <th className="px-4 py-3 font-medium">Poznámka</th>
              </tr>
            </thead>
            <tbody>
              {base.opexLines.map((line) => (
                <tr
                  key={line.key}
                  className="border-t border-[var(--border-default)]"
                >
                  <td className="px-4 py-3">{line.label}</td>
                  <td className="px-4 py-3">{formatCzk(line.annualCzk)}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">
                    {line.note}
                  </td>
                </tr>
              ))}
              <tr className="border-t border-[var(--border-default)] font-medium">
                <td className="px-4 py-3">Celkem provozní náklady</td>
                <td className="px-4 py-3">{formatCzk(base.opexTotalCzk)}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">
                  Rozdíl efektivního hrubého příjmu a provozního výsledku:{" "}
                  {formatCzk(base.annualEgiCzk - base.annualNoiCzk)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {study.managementFeeCheck.declaredPct != null ? (
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            Deklarovaná správa {formatPct(study.managementFeeCheck.declaredPct, 0)}{" "}
            ze smluvního nájemného
            {study.managementFeeCheck.impliedPctOfContractRent != null
              ? ` · ve výpočtu ${formatPct(study.managementFeeCheck.impliedPctOfContractRent, 1)}`
              : ""}
            {study.managementFeeCheck.matchesDeclared
              ? " · sedí."
              : " · nesedí, zkontrolujte model."}
          </p>
        ) : null}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-[var(--text-primary)]">
          Od nájemného k cash flow
        </h2>
        <ol className="mt-4 space-y-3 text-sm">
          {[
            [
              "Smluvní nájemné / rok",
              formatCzk(base.waterfall.annualContractRentCzk),
            ],
            [
              "− Ztráta z neobsazenosti",
              formatCzk(base.waterfall.vacancyLossCzk),
            ],
            [
              "= Efektivní hrubý příjem",
              formatCzk(base.waterfall.effectiveGrossIncomeCzk),
            ],
            [
              "− Provozní náklady vlastníka",
              formatCzk(base.waterfall.opexTotalCzk),
            ],
            [
              "= Provozní výsledek před financováním",
              formatCzk(base.waterfall.noiCzk),
            ],
            [
              "− Splátky úvěru / rok",
              formatCzk(base.waterfall.annualDebtServiceCzk),
            ],
            [
              "= Roční cash flow (před daní)",
              formatCzk(base.waterfall.annualCashFlowCzk),
            ],
            [
              "Měsíční cash flow",
              formatSignedCzk(base.waterfall.monthlyCashFlowCzk),
            ],
          ].map(([label, value]) => (
            <li
              key={label}
              className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--border-default)] pb-2"
            >
              <span className="text-[var(--text-secondary)]">{label}</span>
              <span className="font-medium text-[var(--text-primary)]">
                {value}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-3">
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-5">
          <h2 className="font-display text-xl text-[var(--text-primary)]">
            Financování
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--text-muted)]">Úvěr</dt>
              <dd>{formatCzk(financing.loanPrincipalCzk)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--text-muted)]">Vlastní kapitál</dt>
              <dd>{formatCzk(financing.equityCzk)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--text-muted)]">Úrok</dt>
              <dd>{formatPct(financing.interestRatePctPoints)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--text-muted)]">Splatnost</dt>
              <dd>{financing.termYears} let</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--text-muted)]">Splátka / měs.</dt>
              <dd>{formatCzk(financing.monthlyDebtServiceCzk)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-[var(--text-muted)]">
            {financing.repaymentMethod}
          </p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-5 lg:col-span-2">
          <h2 className="font-display text-xl text-[var(--text-primary)]">
            Metriky výnosu (základní scénář)
          </h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-3 text-sm">
            <div>
              <dt className="text-[var(--text-muted)]">
                Hrubý nájemní výnos z kupní ceny
              </dt>
              <dd className="mt-1 text-lg font-semibold">
                {formatPct(base.grossRentalYieldOnPurchasePct)}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">
                Výnos po neobsazenosti z pořizovacích nákladů
              </dt>
              <dd className="mt-1 text-lg font-semibold">
                {formatPct(base.yieldAfterVacancyOnTacPct)}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">
                Provozní výnos před financováním
              </dt>
              <dd className="mt-1 text-lg font-semibold">
                {formatPct(base.operatingYieldOnTacPct)}
              </dd>
            </div>
          </dl>
          <ul className="mt-4 space-y-1 text-xs text-[var(--text-muted)]">
            <li>{study.metricNotes.grossRentalYieldOnPurchase}</li>
            <li>{study.metricNotes.yieldAfterVacancyOnTac}</li>
            <li>{study.metricNotes.operatingYieldOnTac}</li>
            <li>{study.metricNotes.tax}</li>
          </ul>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-[var(--text-primary)]">
          Scénáře — vstupy i výsledky
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
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--text-muted)]">Nájem / měs.</dt>
                  <dd>{formatCzk(scenario.inputs.monthlyContractRentCzk)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--text-muted)]">Neobsazenost</dt>
                  <dd>{formatPct(scenario.inputs.vacancyRatePct, 0)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--text-muted)]">Opex násobitel</dt>
                  <dd>×{scenario.inputs.opexMultiplier}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--text-muted)]">Úrok</dt>
                  <dd>{formatPct(scenario.inputs.interestRatePctPoints)}</dd>
                </div>
                <div className="mt-2 border-t border-[var(--border-default)] pt-2 flex justify-between gap-2">
                  <dt className="text-[var(--text-muted)]">Po neobsazenosti</dt>
                  <dd>{formatPct(scenario.yieldAfterVacancyOnTacPct)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--text-muted)]">Provozní výnos</dt>
                  <dd>{formatPct(scenario.operatingYieldOnTacPct)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--text-muted)]">Cash flow</dt>
                  <dd
                    className={cn(
                      scenario.monthlyCashFlowCzk < 0 &&
                        "text-[var(--action-destructive)]",
                    )}
                  >
                    {formatSignedCzk(scenario.monthlyCashFlowCzk)}
                  </dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </section>

      {study.priceAtTargetYieldOnTacCzk != null && study.targetYieldLabel ? (
        <section className="mt-12 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--background-secondary)] p-5">
          <h2 className="font-display text-xl text-[var(--text-primary)]">
            {study.targetYieldLabel}
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Při pevném efektivním hrubém příjmu a pevných vedlejších nákladech,
            rekonstrukci a rezervě by kupní cena{" "}
            <strong>{formatCzk(study.priceAtTargetYieldOnTacCzk)}</strong>{" "}
            odpovídala tomuto cíli (výnos po neobsazenosti z celkových
            pořizovacích nákladů). Nejde o odhad tržní hodnoty.
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
            Co ověřit před podpisem
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
            {definition.missingDocuments.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-12 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-6">
        <h2 className="font-display text-xl text-[var(--text-primary)]">
          Závěr pro rozhodnutí
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
          {decision.narrative}
        </p>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-[var(--text-muted)]">Pokryje nájem provoz i splátku?</dt>
            <dd className="font-medium text-[var(--text-primary)]">
              {decision.coversOpsAndDebt ? "Ano (v modelu)" : "Ne — vychází doplatek"}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">Měsíční / roční doplatek</dt>
            <dd className="font-medium text-[var(--text-primary)]">
              {decision.coversOpsAndDebt
                ? "0 Kč"
                : `${formatCzk(decision.monthlyTopUpCzk)} / ${formatCzk(decision.annualTopUpCzk)}`}
            </dd>
          </div>
          {decision.breakEvenPurchasePriceCzk != null ? (
            <div className="sm:col-span-2">
              <dt className="text-[var(--text-muted)]">
                Kupní cena při nulovém cash flow
              </dt>
              <dd className="font-medium text-[var(--text-primary)]">
                {formatCzk(decision.breakEvenPurchasePriceCzk)}
              </dd>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {decision.breakEvenAssumptions}
              </p>
            </div>
          ) : null}
        </dl>
        <p className="mt-4 text-sm text-[var(--text-secondary)]">
          {decision.principalAmortizationNote}
        </p>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          {decision.pathToTarget}
        </p>
        <h3 className="mt-6 font-medium text-[var(--text-primary)]">
          Nejcitlivější předpoklady
        </h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
          {decision.mostSensitiveAssumptions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section id="poptavka-studie" className="mt-12 scroll-mt-24">
        <h2 className="font-display text-2xl text-[var(--text-primary)]">
          Chci takto posoudit svou nemovitost
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Do poptávky předáme odkaz na tuto modelovou studii, abychom věděli, jaký
          formát výstupu očekáváte.
        </p>
        <div className="mt-6">
          <PropertyAuditInquiryForm
            id={`posoudit-${definition.slug}`}
            caseStudySlug={definition.slug}
          />
        </div>
      </section>
    </StandardPageLayout>
  );
}
