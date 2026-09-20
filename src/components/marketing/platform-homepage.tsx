import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building,
  Calculator,
  Gavel,
  Home,
  KeyRound,
  Landmark,
  LineChart,
  MapPinned,
  PiggyBank,
  RefreshCw,
  Scale,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";

import { CaseStudyCard } from "@/components/marketing/case-study-card";
import { HomeSearchPanel } from "@/components/marketing/home/home-search-panel";
import { PropertyAuditInquiryForm } from "@/components/marketing/property-audit-inquiry-form";
import { Container } from "@/components/ui/container";
import { listCaseStudies } from "@/content/case-studies";
import {
  publicCheckoutMode,
  publicCustomerOffer,
} from "@/config/public-offer";
import { formatCzk } from "@/components/marketing/format";
import type { PropertyCardData } from "@/components/property/property-card";
import { PropertyListingImage } from "@/components/property/property-listing-image";

const BENEFITS = [
  { label: "Bydlení podle vás", icon: Home },
  { label: "Přehled o nákladech", icon: Calculator },
  { label: "Informovanější rozhodnutí", icon: ShieldCheck },
] as const;

const ANALYSIS_POINTS = [
  {
    title: "Celkové náklady koupě",
    text: "Kupní cena, vedlejší náklady a vlastní prostředky na jednom místě.",
    icon: PiggyBank,
  },
  {
    title: "Rekonstrukce a potenciál",
    text: "Odhad stavebních nákladů, rezervy a dopadu na hodnotu.",
    icon: Wrench,
  },
  {
    title: "Scénáře a rizika",
    text: "Konzervativní až příznivý pohled a otázky před podpisem.",
    icon: BarChart3,
  },
] as const;

const TOOLS = [
  {
    href: "/kalkulacky/investicni-vynos",
    title: "Výnos a cash flow",
    text: "Modelujte nájem, náklady a měsíční bilanci.",
    icon: LineChart,
  },
  {
    href: "/kalkulacky/rekonstrukce",
    title: "Náklady rekonstrukce",
    text: "Orientujte se v rozsahu prací a rezervě.",
    icon: Wrench,
  },
  {
    href: "/kalkulacky/financovani",
    title: "Financování",
    text: "Spočítejte splátku a potřebu vlastních prostředků.",
    icon: Landmark,
  },
  {
    href: "/ukazky",
    title: "Modelové studie",
    text: "Prohlédněte ověřené ukázky metodiky analýzy.",
    icon: Sparkles,
  },
] as const;

const MODES = [
  {
    href: "/moznosti/sdilena-investice",
    title: "Sdílená investice",
    text: "Hledejte spoluinvestory k konkrétní nabídce.",
    icon: Users,
  },
  {
    href: "/moznosti/castecna-koupe",
    title: "Částečná koupě",
    text: "Kupte podíl a zbytek řešte nájem nebo postupný odkup.",
    icon: Scale,
  },
  {
    href: "/moznosti/sdileny-najem",
    title: "Sdílený nájem",
    text: "Spojte rozpočty pro společné bydlení.",
    icon: Home,
  },
  {
    href: "/moznosti/nabidnete-cenu",
    title: "Nabídněte cenu",
    text: "Pošlete nabídku pod inzerovanou cenu.",
    icon: PiggyBank,
  },
  {
    href: "/moznosti/aukce",
    title: "Aukce",
    text: "Připravovaná aukční cesta — zatím poptávka, ne ostrý prodej.",
    icon: Gavel,
  },
  {
    href: "/moznosti/bydleni-za-vypomoc",
    title: "Bydlení za výpomoc",
    text: "Ubytování výměnou za domluvenou pomoc.",
    icon: KeyRound,
  },
  {
    href: "/moznosti/smena",
    title: "Směna nemovitostí",
    text: "Nabídněte protinávrh včetně nepeněžních položek.",
    icon: RefreshCw,
  },
  {
    href: "/moznosti/zahranicni",
    title: "Zahraniční nemovitosti",
    text: "Nabídky mimo ČR s jasnou měnou a lokalitou.",
    icon: MapPinned,
  },
] as const;

const PROJECTS = [
  {
    href: "/novostavby",
    title: "Novostavby a projekty",
    text: "Developerské projekty a nové byty.",
    image: "/case-studies/homepage-hero.png",
  },
  {
    href: "/domy-na-klic",
    title: "Domy na klíč",
    text: "Stavba nebo katalogový dům na míru.",
    image: "/case-studies/house-after-visualization.png",
  },
  {
    href: "/nemovitosti/investicni-prilezitosti",
    title: "Investiční nemovitosti",
    text: "Nabídky vhodné k výnosovému pohledu.",
    image: "/case-studies/rental-apartment.png",
  },
] as const;

export function PlatformHomepage({
  featuredListings,
}: {
  featuredListings: PropertyCardData[];
}) {
  const studies = listCaseStudies();
  const checkoutMode = publicCheckoutMode();
  const analysisCtaHref =
    checkoutMode === "checkout"
      ? "/checkout?product=deep_analysis"
      : "/sluzby/analyza-pred-koupi#poptavka";
  const analysisCtaLabel =
    checkoutMode === "checkout" ? "Objednat analýzu" : "Poptat analýzu";

  return (
    <div className="pb-0">
      {/* B. Hero */}
      <section className="relative overflow-hidden">
        <Container className="grid items-center gap-8 py-10 lg:grid-cols-2 lg:gap-12 lg:py-14">
          <div>
            <h1 className="font-display text-[clamp(2.25rem,4.5vw,3.5rem)] leading-[1.08] tracking-tight text-[var(--text-primary)]">
              Najděte nemovitost.
              <br />
              Poznejte její potenciál.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
              Pro bydlení i investici. S přehledem o ceně, nákladech a možnostech.
            </p>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
              {BENEFITS.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"
                >
                  <item.icon
                    className="size-4 text-[var(--action-accent)]"
                    aria-hidden
                  />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative aspect-[5/4] overflow-hidden rounded-[var(--radius-card)] sm:aspect-[4/3] lg:aspect-auto lg:min-h-[420px]">
            <Image
              src="/case-studies/homepage-hero.png"
              alt="Moderní bytový dům s balkony a zelení"
              fill
              priority
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </Container>

        <Container className="pb-10">
          <HomeSearchPanel />
        </Container>
      </section>

      {/* D. Listings */}
      <section className="border-t border-[var(--border-default)] bg-[var(--background-primary)] py-14">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-3xl text-[var(--text-primary)] sm:text-4xl">
              Objevte své další místo
            </h2>
            <Link
              href="/nemovitosti"
              className="inline-flex items-center gap-1 text-sm font-medium text-[var(--action-accent)] underline-offset-2 hover:underline"
            >
              Všechny nemovitosti
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          {featuredListings.length ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredListings.slice(0, 6).map((card) => (
                <HomeListingCard key={card.id ?? card.href} property={card} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-[var(--radius-card)] border border-dashed border-[var(--border-strong)] bg-[var(--surface-primary)] px-6 py-12 text-center">
              <Building className="mx-auto size-8 text-[var(--action-accent)]" aria-hidden />
              <p className="mt-4 font-display text-xl text-[var(--text-primary)]">
                Zatím tu nejsou publikované nabídky
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-secondary)]">
                Katalog je prázdný — nejde o chybu načtení. Můžete přidat vlastní
                nemovitost, nebo si prohlédnout modelové studie metodiky.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/pridat-nemovitost"
                  className="inline-flex h-11 items-center rounded-[var(--radius-lg)] bg-[var(--action-primary)] px-5 text-sm font-medium text-white"
                >
                  Přidat nemovitost
                </Link>
                <Link
                  href="/ukazky"
                  className="inline-flex h-11 items-center rounded-[var(--radius-lg)] border border-[var(--border-strong)] px-5 text-sm font-medium"
                >
                  Modelové studie
                </Link>
              </div>
            </div>
          )}
        </Container>
      </section>

      {/* E. Paid analysis */}
      <section className="bg-[var(--surface-inverse)] py-16 text-[var(--text-inverse)] sm:py-20">
        <Container className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <h2 className="font-display text-3xl leading-tight sm:text-4xl">
              Než koupíte, podívejte se na čísla.
            </h2>
            <p className="mt-4 max-w-md text-base text-white/80">
              Náklady, výnosy a rizika konkrétní nemovitosti v jedné analýze.
            </p>
            <ul className="mt-8 space-y-5">
              {ANALYSIS_POINTS.map((item) => (
                <li key={item.title} className="flex gap-3">
                  <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--action-accent)]/20 text-[var(--action-accent)]">
                    <item.icon className="size-4" aria-hidden />
                  </span>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-1 text-sm text-white/70">{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-8 font-metric text-2xl">
              Podrobná analýza {formatCzk(publicCustomerOffer.priceGrossCzk)}
            </p>
            <p className="mt-1 text-xs text-white/60">
              {publicCustomerOffer.billingCs}. Termín dodání potvrdíme po přijetí
              podkladů.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/ukazky/byt-dlouhodoby-pronajem"
                className="inline-flex h-11 items-center rounded-[var(--radius-lg)] border border-white/40 px-5 text-sm font-medium text-white hover:bg-white/10"
              >
                Prohlédnout ukázku
              </Link>
              <Link
                href={analysisCtaHref}
                className="inline-flex h-11 items-center rounded-[var(--radius-lg)] bg-[var(--action-accent)] px-5 text-sm font-semibold text-white hover:bg-[var(--action-accent-hover)]"
              >
                {analysisCtaLabel}
              </Link>
            </div>
          </div>

          <div className="rounded-[var(--radius-card)] border border-white/10 bg-white/5 p-4 backdrop-blur-sm sm:p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--action-accent)]">
              Modelová analýza
            </p>
            <p className="mt-1 text-sm text-white/70">
              Ukázková data — nejde o aktuální nabídku z katalogu.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <figure className="overflow-hidden rounded-[var(--radius-lg)]">
                <Image
                  src="/case-studies/house-before.png"
                  alt="Stav před rekonstrukcí — modelová studie"
                  width={480}
                  height={320}
                  className="aspect-[4/3] w-full object-cover"
                />
                <figcaption className="mt-1 text-center text-xs text-white/60">
                  Před
                </figcaption>
              </figure>
              <figure className="overflow-hidden rounded-[var(--radius-lg)]">
                <Image
                  src="/case-studies/house-after-visualization.png"
                  alt="Vizualizace po rekonstrukci — modelová studie"
                  width={480}
                  height={320}
                  className="aspect-[4/3] w-full object-cover"
                />
                <figcaption className="mt-1 text-center text-xs text-white/60">
                  Po (model)
                </figcaption>
              </figure>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              {[
                { label: "Kupní cena", pct: 62 },
                { label: "Rekonstrukce a rezerva", pct: 28 },
                { label: "Odhad po rekonstrukci", pct: 88 },
              ].map((row) => (
                <div key={row.label}>
                  <div className="mb-1 flex justify-between text-white/80">
                    <dt>{row.label}</dt>
                    <dd className="text-white/50">model</dd>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[var(--action-accent)]"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </section>

      {/* F. Tools */}
      <section className="py-14">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-3xl text-[var(--text-primary)]">
              Analýzy a kalkulačky
            </h2>
            <Link
              href="/analyzy-a-kalkulacky"
              className="text-sm font-medium text-[var(--action-accent)] underline-offset-2 hover:underline"
            >
              Všechny nástroje
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TOOLS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-raised)] transition-shadow hover:shadow-[var(--shadow-card)]"
              >
                <tool.icon
                  className="size-6 text-[var(--action-accent)]"
                  aria-hidden
                />
                <h3 className="mt-4 font-medium text-[var(--text-primary)] group-hover:text-[var(--action-accent)]">
                  {tool.title}
                </h3>
                <p className="mt-2 text-sm text-[var(--text-muted)]">{tool.text}</p>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* G. Modes */}
      <section className="border-y border-[var(--border-default)] bg-[var(--surface-primary)] py-14">
        <Container>
          <h2 className="font-display text-3xl text-[var(--text-primary)]">
            Více možností bydlení a investování
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
            Alternativy ke klasickému prodeji a pronájmu. Každá cesta má vlastní
            pravidla — kliknutí není převod vlastnictví.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MODES.map((mode) => (
              <Link
                key={mode.href}
                href={mode.href}
                className="rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--background-primary)] p-4 transition-colors hover:border-[var(--action-accent)]"
              >
                <mode.icon
                  className="size-5 text-[var(--action-accent)]"
                  aria-hidden
                />
                <h3 className="mt-3 font-medium text-[var(--text-primary)]">
                  {mode.title}
                </h3>
                <p className="mt-1.5 text-sm text-[var(--text-muted)]">{mode.text}</p>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* H. Projects */}
      <section className="py-14">
        <Container>
          <div className="grid gap-5 md:grid-cols-3">
            {PROJECTS.map((project) => (
              <Link
                key={project.href}
                href={project.href}
                className="group relative overflow-hidden rounded-[var(--radius-card)]"
              >
                <div className="relative aspect-[16/10]">
                  <Image
                    src={project.image}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-inverse)]/85 via-[var(--surface-inverse)]/25 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <h3 className="font-display text-2xl">{project.title}</h3>
                    <p className="mt-1 text-sm text-white/80">{project.text}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* I. Case studies */}
      <section className="border-t border-[var(--border-default)] py-14">
        <Container>
          <h2 className="font-display text-3xl text-[var(--text-primary)]">
            Podívejte se, co odhalí analýza
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Modelové studie metodiky — nejsou aktuální nabídky z trhu.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {studies.map((study) => (
              <CaseStudyCard key={study.definition.slug} study={study} />
            ))}
          </div>
        </Container>
      </section>

      {/* J. Sellers */}
      <section className="border-y border-[var(--border-default)] bg-[color-mix(in_srgb,var(--background-primary)_70%,white)] py-10">
        <Container className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--action-accent)]/15 text-[var(--action-accent)]">
              <KeyRound className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="font-display text-2xl text-[var(--text-primary)]">
                Prodáváte nebo pronajímáte?
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Pro majitele, makléře, realitní kanceláře i developery.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/pridat-nemovitost"
              className="inline-flex h-11 items-center rounded-[var(--radius-lg)] bg-[var(--action-primary)] px-5 text-sm font-medium text-white"
            >
              Přidat nemovitost
            </Link>
            <Link
              href="/pro-inzerenty"
              className="inline-flex h-11 items-center rounded-[var(--radius-lg)] border border-[var(--border-strong)] px-5 text-sm font-medium"
            >
              Služby a ceník inzerce
            </Link>
            <Link
              href="/ucet/nabidky"
              className="inline-flex h-11 items-center rounded-[var(--radius-lg)] px-5 text-sm font-medium text-[var(--action-accent)] underline-offset-2 hover:underline"
            >
              Správa nabídek
            </Link>
          </div>
        </Container>
      </section>

      {/* K. Lead / assessment */}
      <section id="posoudit" className="py-14">
        <Container>
          <div className="mx-auto max-w-3xl rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-6 shadow-[var(--shadow-raised)] sm:p-8">
            <h2 className="font-display text-2xl text-[var(--text-primary)] sm:text-3xl">
              Máte vybranou nemovitost?
            </h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Vložte odkaz nebo údaje k nabídce. Odeslání je nezávazná poptávka —
              neobjednávka ani platba.
            </p>
            <div id="posoudit-form" className="mt-6">
              <PropertyAuditInquiryForm id="home-posoudit" />
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}

function HomeListingCard({ property }: { property: PropertyCardData }) {
  const highlight =
    property.featureHighlights?.[0] ??
    property.tags?.[0] ??
    property.conditionLabel ??
    null;
  const meta = [
    property.propertyTypeLabel,
    property.disposition,
    property.areaDisplay ??
      (property.areaSqm != null ? `${property.areaSqm} m²` : null),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="group overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-overlay)]">
      <Link href={property.href} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-[var(--surface-sunken)]">
          <PropertyListingImage
            src={property.imageUrl}
            alt=""
            className="transition-transform duration-500 group-hover:scale-[1.03]"
          />
          {highlight ? (
            <span className="absolute left-3 top-3 z-10 rounded-md bg-white/95 px-2.5 py-1 text-xs font-medium text-[var(--text-primary)] shadow-sm">
              {highlight}
            </span>
          ) : null}
          {property.sponsored ? (
            <span className="absolute right-3 top-3 z-10 rounded-md bg-[var(--surface-inverse)]/85 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-white">
              Sponzorováno
            </span>
          ) : null}
        </div>
        <div className="space-y-1.5 p-4">
          <p className="font-metric text-xl text-[var(--text-primary)]">
            {property.priceCzk != null
              ? formatCzk(property.priceCzk)
              : "Cena na vyžádání"}
          </p>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {meta || property.title}
          </p>
          <p className="text-sm text-[var(--text-secondary)]">{property.location}</p>
          {property.shortDescription ? (
            <p className="line-clamp-2 text-sm text-[var(--text-muted)]">
              {property.shortDescription}
            </p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
