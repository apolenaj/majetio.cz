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
import { HomeAssessmentEntry } from "@/components/marketing/home/home-assessment-entry";
import { HomeSearchPanel } from "@/components/marketing/home/home-search-panel";
import { Container } from "@/components/ui/container";
import { listCaseStudies, houseRenovationStudy } from "@/content/case-studies";
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
    text: "Kupní cena, vedlejší náklady a vlastní prostředky.",
    icon: PiggyBank,
  },
  {
    title: "Rekonstrukce a potenciál",
    text: "Odhad prací, rezervy a dopadu na hodnotu.",
    icon: Wrench,
  },
  {
    title: "Scénáře a rizika",
    text: "Konzervativní až příznivý pohled před podpisem.",
    icon: BarChart3,
  },
] as const;

const TOOLS = [
  {
    href: "/kalkulacky/investicni-vynos",
    title: "Výnos a cash flow",
    text: "Nájem, náklady a měsíční bilance.",
    icon: LineChart,
  },
  {
    href: "/kalkulacky/rekonstrukce",
    title: "Náklady rekonstrukce",
    text: "Rozsah prací a rezerva.",
    icon: Wrench,
  },
  {
    href: "/kalkulacky/financovani",
    title: "Financování",
    text: "Splátka a vlastní prostředky.",
    icon: Landmark,
  },
  {
    href: "/ukazky",
    title: "Modelové studie",
    text: "Ukázky metodiky analýzy.",
    icon: Sparkles,
  },
] as const;

const MODES = [
  {
    href: "/moznosti/sdilena-investice",
    title: "Sdílená investice",
    text: "Hledejte spoluinvestory k nabídce.",
    icon: Users,
  },
  {
    href: "/moznosti/castecna-koupe",
    title: "Částečná koupě",
    text: "Kupte podíl, zbytek řešte postupně.",
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
    text: "Připravovaná cesta — zatím jen poptávka.",
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
    text: "Protinávrh včetně nepeněžních položek.",
    icon: RefreshCw,
  },
  {
    href: "/moznosti/zahranicni",
    title: "Zahraniční nemovitosti",
    text: "Nabídky mimo ČR s jasnou měnou.",
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

const PREVIEW_ROWS = [
  {
    label: "Kupní cena",
    value: formatCzk(houseRenovationStudy.purchasePriceCzk),
  },
  {
    label: "Rekonstrukce",
    value: formatCzk(houseRenovationStudy.renovationCostCzk),
  },
  {
    label: "Rezerva",
    value: formatCzk(houseRenovationStudy.reserveCzk),
  },
  {
    label: "Modelové nájemné",
    value: `${formatCzk(houseRenovationStudy.baseMonthlyRentCzk)} / měs.`,
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
    <div>
      {/* Hero + search as one composition */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 lg:block"
          aria-hidden
        >
          <Image
            src="/case-studies/homepage-hero.png"
            alt=""
            fill
            priority
            className="object-cover object-[center_35%]"
            sizes="50vw"
          />
        </div>

        <Container className="relative grid lg:grid-cols-2 lg:items-center">
          <div className="py-6 sm:py-8 lg:py-9 lg:pr-8">
            <h1 className="font-display text-[clamp(2.125rem,4.2vw,3.75rem)] leading-[1.08] tracking-tight text-[var(--text-primary)]">
              Najděte nemovitost.
              <br />
              Poznejte její potenciál.
            </h1>
            <p className="mt-3 max-w-md text-base leading-relaxed text-[var(--text-secondary)]">
              Pro bydlení i investici. S přehledem o ceně, nákladech a možnostech.
            </p>
            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
              {BENEFITS.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"
                >
                  <item.icon
                    className="size-4 shrink-0 text-[var(--action-accent)]"
                    aria-hidden
                  />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mt-4 aspect-[16/10] overflow-hidden sm:aspect-[5/3] lg:mt-0 lg:aspect-auto lg:min-h-[360px] lg:opacity-0">
            <Image
              src="/case-studies/homepage-hero.png"
              alt="Moderní bytový dům s balkony a zelení"
              fill
              priority
              className="object-cover object-[center_35%] lg:hidden"
              sizes="(max-width: 1023px) 100vw, 1px"
            />
          </div>
        </Container>

        <Container className="relative z-10 -mt-6 pb-6 sm:-mt-8 sm:pb-8 lg:-mt-10">
          <HomeSearchPanel />
        </Container>
      </section>

      {/* Listings */}
      <section className="border-t border-[var(--border-default)] py-8 sm:py-10">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-[1.875rem] leading-tight text-[var(--text-primary)] sm:text-[2.125rem]">
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
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredListings.slice(0, 6).map((card) => (
                <HomeListingCard key={card.id ?? card.href} property={card} />
              ))}
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-5">
              <div className="flex items-start gap-3">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--action-accent)]/12 text-[var(--action-accent)]">
                  <Building className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    Zatím tu nejsou publikované nabídky
                  </p>
                  <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                    Přidejte vlastní nemovitost, nebo prohlédněte modelové studie.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 sm:shrink-0">
                <Link
                  href="/pridat-nemovitost"
                  className="inline-flex h-10 items-center rounded-[var(--radius-lg)] bg-[var(--action-primary)] px-4 text-sm font-medium text-white"
                >
                  Přidat nabídku
                </Link>
                <Link
                  href="/ukazky"
                  className="inline-flex h-10 items-center rounded-[var(--radius-lg)] border border-[var(--border-strong)] px-4 text-sm font-medium"
                >
                  Modelové studie
                </Link>
              </div>
            </div>
          )}
        </Container>
      </section>

      {/* Paid analysis */}
      <section className="bg-[var(--surface-inverse)] py-10 text-[var(--text-inverse)] sm:py-12">
        <Container className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <h2 className="font-display text-[1.875rem] leading-tight sm:text-[2.125rem]">
              Než koupíte, podívejte se na čísla.
            </h2>
            <p className="mt-3 max-w-md text-base text-white/80">
              Náklady, výnosy a rizika konkrétní nemovitosti v jedné analýze.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-3">
              {ANALYSIS_POINTS.map((item) => (
                <li key={item.title} className="flex gap-2.5 sm:flex-col sm:gap-2">
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--action-accent)]/20 text-[var(--action-accent)]">
                    <item.icon className="size-3.5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-medium leading-snug">{item.title}</p>
                    <p className="mt-1 text-xs leading-snug text-white/65">
                      {item.text}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-6 font-metric text-xl sm:text-2xl">
              Podrobná analýza {formatCzk(publicCustomerOffer.priceGrossCzk)}
            </p>
            <p className="mt-1 text-xs text-white/55">
              {publicCustomerOffer.billingCs}. Termín dodání potvrdíme po přijetí
              podkladů.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
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

          <div className="rounded-[var(--radius-card)] border border-[var(--action-accent)]/25 bg-white p-4 text-[var(--text-primary)] shadow-[var(--shadow-card)] sm:p-5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--action-accent)]">
                Modelová analýza
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Ukázková data · ne katalog
              </p>
            </div>
            <p className="mt-1 font-display text-lg text-[var(--text-primary)]">
              {houseRenovationStudy.shortTitle}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <figure className="overflow-hidden rounded-[var(--radius-lg)]">
                <Image
                  src="/case-studies/house-before.png"
                  alt="Stav před rekonstrukcí — modelová studie"
                  width={480}
                  height={280}
                  className="aspect-[4/3] w-full object-cover"
                />
                <figcaption className="mt-1 text-center text-[11px] text-[var(--text-muted)]">
                  Před
                </figcaption>
              </figure>
              <figure className="overflow-hidden rounded-[var(--radius-lg)] ring-1 ring-[var(--action-accent)]/30">
                <Image
                  src="/case-studies/house-after-visualization.png"
                  alt="Vizualizace po rekonstrukci — modelová studie"
                  width={480}
                  height={280}
                  className="aspect-[4/3] w-full object-cover"
                />
                <figcaption className="mt-1 text-center text-[11px] text-[var(--text-muted)]">
                  Po (model)
                </figcaption>
              </figure>
            </div>
            <dl className="mt-3 space-y-2 border-t border-[var(--border-default)] pt-3 text-sm">
              {PREVIEW_ROWS.map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-3">
                  <dt className="text-[var(--text-secondary)]">{row.label}</dt>
                  <dd className="font-metric font-medium text-[var(--text-primary)]">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </section>

      {/* Tools */}
      <section className="py-8 sm:py-10">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-[1.875rem] leading-tight text-[var(--text-primary)] sm:text-[2.125rem]">
              Analýzy a kalkulačky
            </h2>
            <Link
              href="/analyzy-a-kalkulacky"
              className="text-sm font-medium text-[var(--action-accent)] underline-offset-2 hover:underline"
            >
              Všechny nástroje
            </Link>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TOOLS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group flex items-start gap-3 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3.5 py-3.5 transition-colors hover:border-[var(--action-accent)]"
              >
                <tool.icon
                  className="mt-0.5 size-5 shrink-0 text-[var(--action-accent)]"
                  aria-hidden
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--action-accent)]">
                    {tool.title}
                  </span>
                  <span className="mt-0.5 block text-sm text-[var(--text-muted)]">
                    {tool.text}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Modes */}
      <section className="border-y border-[var(--border-default)] bg-[var(--surface-primary)] py-8 sm:py-10">
        <Container>
          <h2 className="font-display text-[1.875rem] leading-tight text-[var(--text-primary)] sm:text-[2.125rem]">
            Více možností bydlení a investování
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
            Alternativy ke klasickému prodeji a pronájmu. Každá cesta má vlastní
            pravidla — kliknutí není převod vlastnictví.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MODES.map((mode) => (
              <Link
                key={mode.href}
                href={mode.href}
                className="flex items-start gap-3 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--background-primary)] px-3.5 py-3.5 transition-colors hover:border-[var(--action-accent)]"
              >
                <mode.icon
                  className="mt-0.5 size-5 shrink-0 text-[var(--action-accent)]"
                  aria-hidden
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-[var(--text-primary)]">
                    {mode.title}
                  </span>
                  <span className="mt-0.5 block text-sm text-[var(--text-muted)]">
                    {mode.text}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Projects */}
      <section className="py-8 sm:py-10">
        <Container>
          <div className="grid gap-4 md:grid-cols-3">
            {PROJECTS.map((project) => (
              <Link
                key={project.href}
                href={project.href}
                className="group overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface-primary)]"
              >
                <div className="relative aspect-[16/9]">
                  <Image
                    src={project.image}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="px-4 py-3">
                  <h3 className="font-display text-lg text-[var(--text-primary)] group-hover:text-[var(--action-accent)]">
                    {project.title}
                  </h3>
                  <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                    {project.text}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Case studies */}
      <section className="border-t border-[var(--border-default)] py-8 sm:py-10">
        <Container>
          <h2 className="font-display text-[1.875rem] leading-tight text-[var(--text-primary)] sm:text-[2.125rem]">
            Podívejte se, co odhalí analýza
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Modelové studie metodiky — nejsou aktuální nabídky z trhu.
          </p>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {studies.map((study) => (
              <CaseStudyCard
                key={study.definition.slug}
                study={study}
                compact
              />
            ))}
          </div>
        </Container>
      </section>

      {/* Sellers */}
      <section className="border-y border-[var(--border-default)] bg-[color-mix(in_srgb,var(--background-primary)_70%,white)] py-6 sm:py-7">
        <Container className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--action-accent)]/15 text-[var(--action-accent)]">
              <KeyRound className="size-4" aria-hidden />
            </span>
            <div>
              <h2 className="font-display text-xl text-[var(--text-primary)] sm:text-2xl">
                Prodáváte nebo pronajímáte?
              </h2>
              <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                Pro majitele, makléře, realitní kanceláře i developery.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
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
              className="inline-flex h-11 items-center rounded-[var(--radius-lg)] px-4 text-sm font-medium text-[var(--action-accent)] underline-offset-2 hover:underline"
            >
              Správa nabídek
            </Link>
          </div>
        </Container>
      </section>

      {/* Lead entry */}
      <section id="posoudit" className="py-8 sm:py-10">
        <Container>
          <div id="posoudit-form">
            <HomeAssessmentEntry />
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
        <div className="space-y-1 p-3.5">
          <p className="font-metric text-lg text-[var(--text-primary)]">
            {property.priceCzk != null
              ? formatCzk(property.priceCzk)
              : "Cena na vyžádání"}
          </p>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {meta || property.title}
          </p>
          <p className="text-sm text-[var(--text-secondary)]">{property.location}</p>
        </div>
      </Link>
    </article>
  );
}
