import Image from "next/image";
import Link from "next/link";

import { CaseStudyCard } from "@/components/marketing/case-study-card";
import { PropertyAuditInquiryForm } from "@/components/marketing/property-audit-inquiry-form";
import { Container } from "@/components/ui/container";
import { listCaseStudies } from "@/content/case-studies";
import { publicCustomerOffer } from "@/config/public-offer";
import { formatCzk } from "@/components/marketing/format";
import type { PropertyCardData } from "@/components/property/property-card";
import { PropertyCard } from "@/components/property/property-card";

const MODES = [
  {
    href: "/moznosti/sdilena-investice",
    title: "Sdílená investice",
    text: "Hledání spoluinvestorů — deklarovaný zájem ≠ vybrané peníze.",
  },
  {
    href: "/moznosti/castecna-koupe",
    title: "Částečná koupě",
    text: "Podíl, nájem za nevlastněnou část, postupný odkup — odděleně.",
  },
  {
    href: "/moznosti/sdileny-najem",
    title: "Sdílený nájem",
    text: "Párování rozpočtů a spolubydlení bez zveřejnění kontaktů.",
  },
  {
    href: "/moznosti/nabidnete-cenu",
    title: "Nabídněte cenu",
    text: "Neveřejný práh majitele, nezávazné nabídky a historie.",
  },
  {
    href: "/moznosti/aukce",
    title: "Aukce",
    text: "Konfigurovatelný modul — ostrá aktivace po právních pravidlech.",
  },
  {
    href: "/moznosti/bydleni-za-vypomoc",
    title: "Bydlení za výpomoc",
    text: "Ubytování výměnou za pomoc — ověření bez falešných štítků.",
  },
  {
    href: "/moznosti/smena",
    title: "Směna",
    text: "Protinabídky včetně nepeněžních položek.",
  },
  {
    href: "/moznosti/zahranicni",
    title: "Zahraniční nemovitosti",
    text: "Země, měna, jednotky — kurz jen orientačně.",
  },
] as const;

export function PlatformHomepage({
  featuredListings,
}: {
  featuredListings: PropertyCardData[];
}) {
  const studies = listCaseStudies();

  return (
    <div className="pb-20">
      <section className="relative overflow-hidden border-b border-[var(--border-default)]">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/case-studies/homepage-hero.png"
            alt=""
            fill
            priority
            className="object-cover opacity-35"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[color-mix(in_srgb,var(--background-primary)_55%,transparent)] via-[color-mix(in_srgb,var(--background-primary)_78%,transparent)] to-[var(--background-primary)]" />
        </div>
        <Container className="py-16 sm:py-24">
          <p className="text-sm font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
            Majetio
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl leading-tight text-[var(--text-primary)] sm:text-5xl">
            Nemovitosti, které hledáte — a způsoby, jak je získat
          </h1>
          <p className="mt-4 max-w-2xl text-base text-[var(--text-secondary)] sm:text-lg">
            Najděte nabídku, nabídněte vlastní, zvolte režim koupě či spolupráce, nebo
            si nechte posoudit konkrétní nemovitost.
          </p>

          <form
            action="/nemovitosti"
            method="get"
            className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row"
          >
            <label className="sr-only" htmlFor="home-q">
              Hledat nemovitost
            </label>
            <input
              id="home-q"
              name="q"
              placeholder="Město, lokalita, klíčová slova…"
              className="h-12 flex-1 rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] px-4 text-sm"
            />
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-[var(--action-primary)] px-6 text-sm font-medium text-white"
            >
              Najít nemovitost
            </button>
          </form>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/pridat-nemovitost"
              className="inline-flex h-11 items-center rounded-lg border border-[var(--border-strong)] bg-[var(--surface-primary)] px-5 text-sm font-medium"
            >
              Nabídnout nemovitost
            </Link>
            <Link
              href="/moznosti"
              className="inline-flex h-11 items-center rounded-lg border border-[var(--border-default)] px-5 text-sm font-medium text-[var(--text-secondary)]"
            >
              Způsoby koupě a spolupráce
            </Link>
            <Link
              href="/#posoudit"
              className="inline-flex h-11 items-center rounded-lg border border-[var(--border-default)] px-5 text-sm font-medium text-[var(--text-secondary)]"
            >
              Posoudit nemovitost
            </Link>
          </div>
        </Container>
      </section>

      <Container className="py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-[var(--text-primary)] sm:text-3xl">
              Publikované nabídky
            </h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Reálné inzeráty z katalogu. Modelové studie jsou oddělené níže.
            </p>
          </div>
          <Link
            href="/nemovitosti"
            className="text-sm font-medium underline underline-offset-2"
          >
            Celý katalog
          </Link>
        </div>

        {featuredListings.length ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredListings.slice(0, 6).map((card) => (
              <PropertyCard key={card.id} property={card} />
            ))}
          </div>
        ) : (
          <p className="mt-8 rounded-lg border border-dashed border-[var(--border-default)] px-4 py-8 text-center text-sm text-[var(--text-muted)]">
            Zatím nejsou publikované nabídky.{" "}
            <Link href="/pridat-nemovitost" className="underline underline-offset-2">
              Buďte první inzerent
            </Link>
            , nebo prohlédněte modelové studie.
          </p>
        )}
      </Container>

      <section className="border-y border-[var(--border-default)] bg-[color-mix(in_srgb,var(--surface-primary)_70%,transparent)]">
        <Container className="py-14">
          <h2 className="font-display text-2xl text-[var(--text-primary)] sm:text-3xl">
            Možnosti bydlení a investování
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
            Alternativní režimy vedle klasického prodeje a pronájmu. Každý má vlastní
            pravidla — kliknutí není převod vlastnictví.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MODES.map((mode) => (
              <Link
                key={mode.href}
                href={mode.href}
                className="rounded-lg border border-[var(--border-default)] bg-[var(--background-primary)] p-4 transition-colors hover:border-[var(--border-strong)]"
              >
                <h3 className="font-medium text-[var(--text-primary)]">{mode.title}</h3>
                <p className="mt-2 text-sm text-[var(--text-muted)]">{mode.text}</p>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <Container className="py-14">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl text-[var(--text-primary)]">
              Pro inzerenty
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
              Soukromí majitelé, makléři, kanceláře, developeři i firmy — stejný účet,
              různá oprávnění. Inzerce má pevnou cenu za období zveřejnění, ne procento
              z prodeje.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/pridat-nemovitost"
                className="inline-flex h-11 items-center rounded-lg bg-[var(--action-primary)] px-5 text-sm font-medium text-white"
              >
                Přidat nemovitost
              </Link>
              <Link
                href="/pro-inzerenty"
                className="inline-flex h-11 items-center rounded-lg border border-[var(--border-strong)] px-5 text-sm font-medium"
              >
                Jak to funguje
              </Link>
            </div>
          </div>
          <div id="posoudit">
            <h2 className="font-display text-2xl text-[var(--text-primary)]">
              Posoudit vybranou nemovitost
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
              Doplňková služba Investiční rentgen — {formatCzk(publicCustomerOffer.priceGrossCzk)}.
              Nejde o náhradu katalogu ani inzertní platformy.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/#posoudit-form"
                className="inline-flex h-11 items-center rounded-lg border border-[var(--border-strong)] px-5 text-sm font-medium"
              >
                Nezávazná poptávka analýzy
              </Link>
              <Link
                href="/ukazky"
                className="inline-flex h-11 items-center rounded-lg border border-[var(--border-default)] px-5 text-sm font-medium text-[var(--text-secondary)]"
              >
                Modelové studie
              </Link>
            </div>
          </div>
        </div>
      </Container>

      <div id="posoudit-form">
      <Container className="pb-14">
        <h2 className="font-display text-2xl text-[var(--text-primary)]">
          Nezávazná poptávka analýzy
        </h2>
        <p className="mt-2 mb-6 max-w-2xl text-sm text-[var(--text-secondary)]">
          Doplněk k inzertní platformě — nezávazná poptávka analýzy, ne objednávka inzerátu.
        </p>
        <PropertyAuditInquiryForm />

        <h2 className="mt-16 font-display text-2xl text-[var(--text-primary)]">
          Modelové studie (ne inzeráty)
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Ukázky metodiky analýzy. Nejsou aktuální nabídky z trhu.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {studies.map((study) => (
            <CaseStudyCard key={study.definition.slug} study={study} />
          ))}
        </div>
      </Container>
      </div>
    </div>
  );
}
