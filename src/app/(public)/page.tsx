import type { Metadata } from "next";
import Link from "next/link";

import { AnnouncementBar, HomepageHero } from "@/components/homepage";
import { HomeDemoAnalysis } from "@/components/home/home-demo-analysis";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Grid, Section } from "@/components/ui/layout-primitives";
import { brand } from "@/config/brand";
import { STRATEGIES } from "@/config/navigation";
import { commerceConfig } from "@/config/commerce";
import { homepageContent } from "@/content/homepage";
import { formatCzk } from "@/lib/format";

export const metadata: Metadata = {
  title: { absolute: `${brand.name} — ${homepageContent.hero.headline}` },
  description: homepageContent.hero.subheadline,
  alternates: { canonical: "/" },
};

const AUDIENCES = [
  {
    title: "Vlastní bydlení",
    text: "Realistická cena, rizika lokality a financovatelnost před podpisem.",
  },
  {
    title: "První investice",
    text: "Srozumitelný výnos, cash flow a srovnání nabídek bez zbytečného žargonu.",
  },
  {
    title: "Zkušený investor",
    text: "Scénáře, renovace, flip a porovnání více nemovitostí.",
  },
  {
    title: "Rekonstrukce a flip",
    text: "Odhad nákladů, rezervy a dopad na hodnotu i exit cenu.",
  },
] as const;

const TOOLS = [
  { href: "/analyza", title: "Analýza nemovitosti", text: "Od rychlého přehledu po kompletní verdikt." },
  { href: "/porovnani", title: "Porovnání", text: "Cena, výnos a rizika vedle sebe." },
  { href: "/kalkulacky", title: "Kalkulačky", text: "Výnos, cash flow, financování, rekonstrukce." },
  { href: "/lokality", title: "Lokality", text: "Kontext místa kolem konkrétní nabídky." },
] as const;

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Majetio",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "https://majetio.cz",
    description: brand.claims.primary,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AnnouncementBar />
      <HomepageHero />

      {/* Remaining homepage sections — rebuilt in Část 2 / 3 */}
      <Section aria-labelledby="value-heading">
        <Container>
          <h2 id="value-heading" className="text-h2 text-[var(--text-primary)]">
            Hlavní hodnota Majetio
          </h2>
          <p className="mt-3 max-w-2xl text-[var(--text-secondary)]">
            Nestačí najít inzerát. Majetio spojuje nabídku s analýzou hodnoty, výnosů, cash
            flow, rizik a financování — aby rozhodnutí stálo na datech.
          </p>
        </Container>
      </Section>

      <HomeDemoAnalysis />

      <Section
        className="border-y border-[var(--border-default)] bg-[var(--surface-primary)]"
        aria-labelledby="how-heading"
      >
        <Container>
          <h2 id="how-heading" className="text-h2">
            Jak Majetio funguje
          </h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-4">
            {[
              "Vyberte nebo vložte nemovitost.",
              "Získáte přehled ceny, výnosu a rizik.",
              "Porovnáte scénáře a možnosti financování.",
              "Rozhodnete se s větší jistotou.",
            ].map((step, i) => (
              <li key={step}>
                <p className="text-overline text-[var(--action-premium)]">0{i + 1}</p>
                <p className="mt-2 font-display text-lg text-[var(--text-primary)]">{step}</p>
              </li>
            ))}
          </ol>
          <ButtonLink href="/jak-to-funguje" variant="secondary" className="mt-8">
            Podrobný popis procesu
          </ButtonLink>
        </Container>
      </Section>

      <Section aria-labelledby="audience-heading">
        <Container>
          <h2 id="audience-heading" className="text-h2">
            Pro koho je Majetio
          </h2>
          <Grid cols={2} className="mt-8">
            {AUDIENCES.map((item) => (
              <Card key={item.title} variant="muted">
                <h3 className="font-display text-xl">{item.title}</h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{item.text}</p>
              </Card>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section
        className="border-y border-[var(--border-default)] bg-[var(--surface-primary)]"
        aria-labelledby="strategies-heading"
      >
        <Container>
          <h2 id="strategies-heading" className="text-h2">
            Investiční strategie
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STRATEGIES.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/strategie/${s.slug}`}
                  className="block rounded-[var(--radius-md)] border border-transparent py-2 hover:border-[var(--border-default)] hover:bg-[var(--background-primary)] hover:px-3"
                >
                  <h3 className="font-display text-lg">{s.title}</h3>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{s.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section aria-labelledby="tools-heading">
        <Container>
          <h2 id="tools-heading" className="text-h2">
            Klíčové nástroje
          </h2>
          <Grid cols={2} className="mt-8">
            {TOOLS.map((tool) => (
              <Card key={tool.href} variant="interactive" as="article">
                <Link href={tool.href} className="block">
                  <h3 className="font-display text-xl">{tool.title}</h3>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">{tool.text}</p>
                </Link>
              </Card>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section
        className="border-y border-[var(--border-default)] bg-[var(--surface-inverse)] text-[var(--text-inverse)]"
        aria-labelledby="hj-heading"
      >
        <Container>
          <h2 id="hj-heading" className="font-display text-2xl sm:text-3xl">
            Financování s HypotekaJasne.cz
          </h2>
          <p className="mt-4 max-w-2xl text-sm text-white/75 sm:text-base">
            Majetio drží kontext nemovitosti a investiční záměr. HypotekaJasne řeší sazby,
            RPSN a hypoteční poradenství. Předání dat jen se souhlasem.
          </p>
          <a
            href="https://hypotekajasne.cz"
            className="mt-6 inline-flex text-sm font-medium text-[var(--action-premium)] underline-offset-2 hover:underline"
            rel="noopener noreferrer"
            target="_blank"
          >
            Přejít na HypotekaJasne.cz
          </a>
        </Container>
      </Section>

      <Section aria-labelledby="pricing-heading">
        <Container>
          <h2 id="pricing-heading" className="text-h2">
            Bezplatná versus profesionální analýza
          </h2>
          <Grid cols={2} className="mt-8">
            <Card>
              <h3 className="font-display text-xl">
                {commerceConfig.products.basicAnalysis.name}
              </h3>
              <p className="mt-2 text-2xl font-semibold text-[var(--investment-positive)]">
                Zdarma
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Základní metriky a orientace — po spuštění analytického modulu.
              </p>
            </Card>
            <Card>
              <h3 className="font-display text-xl">
                {commerceConfig.products.fullAnalysis.name}
              </h3>
              <p className="mt-2 text-2xl font-semibold">
                {formatCzk(commerceConfig.products.fullAnalysis.priceCzk)}
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Scénáře, rizika, lokalita a doporučení. Objednávka ve Fázi 4.
              </p>
              <ButtonLink href="/cenik" variant="secondary" className="mt-4">
                Detail ceníku
              </ButtonLink>
            </Card>
          </Grid>
        </Container>
      </Section>

      <Section
        className="border-t border-[var(--border-default)] bg-[var(--background-secondary)]"
        aria-labelledby="trust-heading"
      >
        <Container>
          <h2 id="trust-heading" className="text-h2">
            Metodika a důvěra
          </h2>
          <p className="mt-3 max-w-2xl text-[var(--text-secondary)]">
            Bez falešných referencí. Transparentní metodika, zdroje dat, označení odhadů a
            možnost upravit předpoklady.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/metodika" variant="secondary">
              Metodika
            </ButtonLink>
            <ButtonLink href="/zdroje-dat" variant="outline">
              Zdroje dat
            </ButtonLink>
            <ButtonLink href="/pravni-upozorneni" variant="ghost">
              Právní upozornění
            </ButtonLink>
          </div>
        </Container>
      </Section>

      <Section className="bg-[var(--surface-inverse)] py-16 text-[var(--text-inverse)] sm:py-20">
        <Container className="max-w-3xl text-center">
          <h2 className="font-display text-2xl sm:text-3xl">{brand.claims.primary}</h2>
          <p className="mt-4 text-sm text-white/75 sm:text-base">{brand.claims.secondary}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink
              href="/analyza"
              className="bg-[var(--background-primary)] text-[var(--text-primary)] hover:bg-white"
            >
              Analyzovat nemovitost
            </ButtonLink>
            <ButtonLink
              href="/nemovitosti"
              variant="ghost"
              className="text-[var(--text-inverse)] hover:bg-white/10"
            >
              Procházet nemovitosti
            </ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  );
}
