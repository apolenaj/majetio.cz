import Image from "next/image";
import Link from "next/link";

import {
  formatCzk,
  formatPct,
  formatSignedCzk,
} from "@/components/marketing/format";
import { CaseStudyCard } from "@/components/marketing/case-study-card";
import { PropertyAuditInquiryForm } from "@/components/marketing/property-audit-inquiry-form";
import { Container } from "@/components/ui/container";
import { getCatalogProductByKey } from "@/config/pricing-architecture";
import {
  getFeaturedCaseStudy,
  listCaseStudies,
} from "@/content/case-studies";
import { COMPANY_PLACEHOLDER } from "@/content/trust";

function SectionHeading({
  id,
  eyebrow,
  title,
  description,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow ? (
        <p className="text-sm font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">
          {eyebrow}
        </p>
      ) : null}
      <h2
        id={id}
        className="mt-2 font-display text-3xl text-[var(--text-primary)] sm:text-4xl"
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-base leading-relaxed text-[var(--text-secondary)]">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function MarketingHomepage() {
  const studies = listCaseStudies();
  const featured = getFeaturedCaseStudy();
  const deep = getCatalogProductByKey("deep_analysis");
  const full = getCatalogProductByKey("full_analysis");
  const price =
    deep?.priceGrossMinor != null
      ? Math.round(deep.priceGrossMinor / 100)
      : full?.priceGrossMinor != null
        ? Math.round(full.priceGrossMinor / 100)
        : null;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[var(--border-default)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_srgb,var(--brand-sand-400)_28%,transparent),transparent_55%),linear-gradient(180deg,var(--brand-canvas-100),var(--brand-canvas-200))]"
        />
        <Container className="relative grid items-center gap-10 py-12 lg:grid-cols-2 lg:gap-14 lg:py-16">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Majetio
            </p>
            <h1 className="mt-3 font-display text-4xl leading-[1.08] text-[var(--text-primary)] sm:text-5xl">
              Než koupíte nemovitost, poznejte její čísla i rizika.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--text-secondary)]">
              Prověříme ekonomiku koupě, náklady a možné scénáře. Získáte přehled,
              co vychází, co je nejisté a co ještě ověřit.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#posoudit"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-[var(--action-primary)] px-6 text-sm font-medium text-white hover:bg-[var(--action-primary-hover)]"
              >
                Posoudit moji nemovitost
              </a>
              <Link
                href={`/ukazky/${featured.definition.slug}`}
                className="inline-flex h-12 items-center justify-center rounded-lg border border-[var(--border-strong)] bg-[var(--surface-primary)] px-6 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--background-secondary)]"
              >
                Prohlédnout ukázkovou analýzu
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-md)]">
              <div className="relative aspect-[16/10]">
                <Image
                  src="/case-studies/homepage-hero.png"
                  alt="Ilustrační fotografie bytového domu"
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <span className="absolute left-3 top-3 rounded-md bg-[var(--surface-inverse)]/85 px-2.5 py-1 text-xs font-medium text-[var(--text-inverse)]">
                  Ilustrační fotografie · Modelová analýza
                </span>
              </div>
              <div className="space-y-4 p-5 sm:p-6">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                    Výstup modelové studie
                  </p>
                  <p className="mt-1 font-display text-xl text-[var(--text-primary)]">
                    {featured.definition.title}
                  </p>
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div>
                    <dt className="text-[var(--text-muted)]">Kupní cena</dt>
                    <dd className="font-semibold text-[var(--text-primary)]">
                      {formatCzk(featured.definition.purchasePriceCzk)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--text-muted)]">Hrubý výnos</dt>
                    <dd className="font-semibold text-[var(--text-primary)]">
                      {formatPct(featured.base.grossYieldPct)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--text-muted)]">Provozní výnos</dt>
                    <dd className="font-semibold text-[var(--text-primary)]">
                      {formatPct(featured.base.operatingYieldPct)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--text-muted)]">Cash flow</dt>
                    <dd className="font-semibold text-[var(--text-primary)]">
                      {formatSignedCzk(featured.base.monthlyCashFlowCzk)}
                    </dd>
                  </div>
                </dl>
                <p className="text-xs text-[var(--text-muted)]">
                  Čísla z jednoho datového modelu studie — před zdaněním, ne
                  tržní ocenění.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Case studies */}
      <section className="py-16 sm:py-20" aria-labelledby="ukazky-heading">
        <Container>
          <SectionHeading
            id="ukazky-heading"
            eyebrow="Ukázky analýz"
            title="Tři modelové studie"
            description="Každá studie je označená jako modelová. Nejde o aktuální nabídky k prodeji ani o klientské realizace."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {studies.map((study, index) => (
              <CaseStudyCard
                key={study.definition.slug}
                study={study}
                priority={index === 0}
              />
            ))}
          </div>
        </Container>
      </section>

      {/* What you get */}
      <section
        id="co-ziskate"
        className="border-y border-[var(--border-default)] bg-[var(--surface-primary)] py-16 sm:py-20"
        aria-labelledby="deliverable-heading"
      >
        <Container>
          <div className="grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <SectionHeading
              id="deliverable-heading"
              eyebrow="Co získáte"
              title="Přehled, který odpovídá skutečnému výstupu"
              description="Ne marketingové kartičky — struktura výstupu z modelové analýzy."
            />
            <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--background-primary)]">
              <div className="border-b border-[var(--border-default)] px-5 py-4">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Náhled výstupu · {featured.definition.shortTitle}
                </p>
                <p className="text-xs text-[var(--text-muted)]">Modelová data</p>
              </div>
              <div className="grid gap-0 sm:grid-cols-2">
                {[
                  {
                    title: "Ekonomika koupě",
                    body: `Pořizovací náklady ${formatCzk(featured.totalAcquisitionCostCzk)} včetně vedlejších nákladů, rekonstrukce a rezervy.`,
                  },
                  {
                    title: "Přehled nákladů",
                    body: "Správa, údržba, pojištění, daň z nemovitosti a náklady vlastníka — bez dvojího započtení.",
                  },
                  {
                    title: "Scénáře",
                    body: featured.scenarios
                      .map(
                        (s) =>
                          `${s.label}: CF ${formatSignedCzk(s.monthlyCashFlowCzk)}`,
                      )
                      .join(" · "),
                  },
                  {
                    title: "Otázky před podpisem",
                    body: featured.definition.missingDocuments
                      .slice(0, 2)
                      .join(" · "),
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="border-t border-[var(--border-default)] p-5 sm:border-t-0 sm:odd:border-r"
                  >
                    <h3 className="font-medium text-[var(--text-primary)]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* How it works */}
      <section
        id="jak-to-funguje"
        className="py-16 sm:py-20"
        aria-labelledby="how-heading"
      >
        <Container>
          <SectionHeading
            id="how-heading"
            eyebrow="Jak to funguje"
            title="Tři kroky k posouzení"
          />
          <ol className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Pošlete nemovitost",
                text: "Odkaz na inzerát, nebo základní údaje ručně. Import z portálů zatím neběží automaticky.",
              },
              {
                step: "2",
                title: "Doplníme podklady",
                text: "Upřesníme chybějící vstupy a oddělíme zadané údaje od modelových předpokladů.",
              },
              {
                step: "3",
                title: "Získáte analýzu",
                text: "Ekonomika, scénáře, rizika a otázky k ověření — s vysvětlením výpočtů.",
              },
            ].map((item) => (
              <li key={item.step} className="text-center sm:text-left">
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-[var(--action-primary)] text-sm font-semibold text-white">
                  {item.step}
                </span>
                <h3 className="mt-4 font-display text-xl text-[var(--text-primary)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {item.text}
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Pricing */}
      <section
        id="cena"
        className="border-y border-[var(--border-default)] bg-[var(--surface-primary)] py-16 sm:py-20"
        aria-labelledby="price-heading"
      >
        <Container>
          <SectionHeading
            id="price-heading"
            eyebrow="Cena"
            title="Přehledná nabídka"
            description="Ceny bereme z centrálního ceníku. Dokud neběží kompletní objednávka online, používejte nezávaznou poptávku."
          />
          <div className="mx-auto mt-10 max-w-3xl rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--background-primary)] p-6 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-display text-2xl text-[var(--text-primary)]">
                  {deep?.nameCs ?? full?.nameCs ?? "Hloubková analýza"}
                </p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  {deep?.taglineCs ??
                    "Jednorázová analýza konkrétní nemovitosti."}
                </p>
              </div>
              <p className="font-display text-3xl text-[var(--text-primary)]">
                {price != null ? `${formatCzk(price)}` : "Na dotaz"}
              </p>
            </div>
            <ul className="mt-6 grid gap-2 text-sm text-[var(--text-secondary)] sm:grid-cols-2">
              {(deep?.features ?? full?.features ?? []).slice(0, 4).map((f) => (
                <li key={f}>• {f}</li>
              ))}
              <li>• Ekonomika koupě, náklady, scénáře a rizika</li>
              <li>• Oddělení zadaných údajů a modelových předpokladů</li>
            </ul>
            <p className="mt-6 text-sm text-[var(--text-muted)]">
              Termín dodání potvrdíme po přijetí podkladů. V ceníku je u Deep
              Analysis uveden refresh 90 dní — není to SLA na první dodání.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#posoudit"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-[var(--action-primary)] px-5 text-sm font-medium text-white hover:bg-[var(--action-primary-hover)]"
              >
                Nezávazně poptat
              </a>
              <Link
                href="/cenik"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-[var(--border-strong)] px-5 text-sm font-medium text-[var(--text-primary)]"
              >
                Kompletní ceník
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* FAQ + form */}
      <section className="py-16 sm:py-20" aria-labelledby="faq-heading">
        <Container className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              id="faq-heading"
              eyebrow="FAQ"
              title="Stručné odpovědi"
            />
            <dl className="mt-8 space-y-5">
              {[
                {
                  q: "Umíte načíst inzerát automaticky?",
                  a: "Zatím ne. Pošlete odkaz nebo údaje ručně — podklady doplníme při zpracování poptávky.",
                },
                {
                  q: "Je odeslání formuláře objednávkou?",
                  a: "Ne. Jde o nezávaznou poptávku. Platbu nespouštíme, dokud nebude funkční objednávkový proces.",
                },
                {
                  q: "Co znamená modelová analýza?",
                  a: "Ukázky používají smyšlené, ale konzistentní vstupy. Nejsou to aktuální nabídky ani klientské výsledky.",
                },
                {
                  q: "Jak souvisí HypotekaJasne.cz?",
                  a: "Po analýze můžete řešit financování s partnerem. Citlivé údaje neposíláme v URL.",
                },
              ].map((item) => (
                <div key={item.q}>
                  <dt className="font-medium text-[var(--text-primary)]">
                    {item.q}
                  </dt>
                  <dd className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {item.a}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-8 text-sm text-[var(--text-muted)]">
              Kontakt:{" "}
              <a
                href={`mailto:${COMPANY_PLACEHOLDER.contactEmail}`}
                className="underline underline-offset-2"
              >
                {COMPANY_PLACEHOLDER.contactEmail}
              </a>
            </p>
          </div>
          <PropertyAuditInquiryForm />
        </Container>
      </section>
    </>
  );
}
