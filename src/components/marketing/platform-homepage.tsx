import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Gavel,
  Heart,
  Home,
  KeyRound,
  Landmark,
  LineChart,
  MapPinned,
  PiggyBank,
  RefreshCw,
  Scale,
  Sparkles,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";

import { HomeAssessmentEntry } from "@/components/marketing/home/home-assessment-entry";
import { HomeSearchPanel } from "@/components/marketing/home/home-search-panel";
import { Container } from "@/components/ui/container";
import { listCaseStudies, houseRenovationStudy, rentalApartmentStudy, smallBuildingStudy } from "@/content/case-studies";
import {
  publicCheckoutMode,
  publicCustomerOffer,
} from "@/config/public-offer";
import { formatCzk } from "@/components/marketing/format";
import type { PropertyCardData } from "@/components/property/property-card";
import { PropertyListingImage } from "@/components/property/property-listing-image";
import { cn } from "@/lib/utils";

const BENEFITS = [
  { label: "Krásnější domov", icon: Home },
  { label: "Lepší investice", icon: TrendingUp },
  { label: "Jistější budoucnost", icon: Sparkles },
] as const;

const ANALYSIS_POINTS = [
  {
    title: "Celkové náklady koupě",
    text: "Kupní cena, vedlejší náklady a vlastní prostředky.",
    icon: PiggyBank,
  },
  {
    title: "Rekonstrukce a potenciál",
    text: "Odhad stavebních nákladů, rezervy a dopadu.",
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
    text: "Spočítejte potenciální výnos.",
    icon: LineChart,
  },
  {
    href: "/kalkulacky/rekonstrukce",
    title: "Náklady rekonstrukce",
    text: "Odhadněte náklady na úpravy.",
    icon: Wrench,
  },
  {
    href: "/kalkulacky/financovani",
    title: "Financování",
    text: "Porovnejte možnosti financování.",
    icon: Landmark,
  },
  {
    href: "/ukazky",
    title: "Modelové studie",
    text: "Prohlédněte ověřené scénáře.",
    icon: Sparkles,
  },
] as const;

const MODES = [
  {
    href: "/moznosti/sdilena-investice",
    title: "Sdílená investice",
    text: "Najděte partnera pro společnou investici.",
    icon: Users,
  },
  {
    href: "/moznosti/castecna-koupe",
    title: "Částečná koupě",
    text: "Prozkoumejte koupi podílu a postupný odkup.",
    icon: Scale,
  },
  {
    href: "/moznosti/sdileny-najem",
    title: "Sdílený nájem",
    text: "Najděte spolubydlení podle svých možností.",
    icon: Home,
  },
  {
    href: "/moznosti/nabidnete-cenu",
    title: "Nabídněte cenu",
    text: "Navrhněte majiteli vlastní kupní cenu.",
    icon: PiggyBank,
  },
  {
    href: "/moznosti/aukce",
    title: "Aukce",
    text: "Prohlédněte si možnosti aukčního prodeje.",
    icon: Gavel,
  },
  {
    href: "/moznosti/bydleni-za-vypomoc",
    title: "Bydlení za výpomoc",
    text: "Objevte bydlení spojené s pomocí.",
    icon: KeyRound,
  },
  {
    href: "/moznosti/smena",
    title: "Směna nemovitostí",
    text: "Prozkoumejte výměnu nemovitostí.",
    icon: RefreshCw,
  },
  {
    href: "/moznosti/zahranicni",
    title: "Zahraniční nemovitosti",
    text: "Objevte příležitosti za hranicemi.",
    icon: MapPinned,
  },
] as const;

const PROJECTS = [
  {
    href: "/novostavby",
    title: "Novostavby a projekty",
    text: "Moderní bydlení s budoucností.",
    image: "/case-studies/homepage-hero.png",
  },
  {
    href: "/domy-na-klic",
    title: "Domy na klíč",
    text: "Kompletní řešení bez starostí.",
    image: "/case-studies/house-after-visualization.png",
  },
  {
    href: "/nemovitosti/investicni-prilezitosti",
    title: "Investiční nemovitosti",
    text: "Stabilita, která dává smysl.",
    image: "/case-studies/rental-apartment.png",
  },
] as const;

const STUDY_TEASERS = [
  {
    slug: "byt-dlouhodoby-pronajem",
    title: "Byt k pronájmu",
    text: "Nájem, náklady a měsíční cash flow",
    image: "/case-studies/rental-apartment.png",
  },
  {
    slug: "dum-pred-rekonstrukci",
    title: "Dům k rekonstrukci",
    text: "Kupní cena, rekonstrukce a odhad hodnoty po úpravách",
    image: "/case-studies/house-before.png",
  },
  {
    slug: "mensi-bytovy-dum",
    title: "Malý bytový dům",
    text: "Obsazenost, nájemné a potenciál výnosu",
    image: "/case-studies/small-building.png",
  },
] as const;

/** Showcase cards when live catalog is empty — clearly labeled as model data. */
export const HOMEPAGE_SHOWCASE_LISTINGS: PropertyCardData[] = [
  {
    href: "/ukazky/byt-dlouhodoby-pronajem",
    title: rentalApartmentStudy.title,
    location: rentalApartmentStudy.locationLabel,
    propertyTypeLabel: "Byt",
    disposition: "2+kk",
    areaSqm: rentalApartmentStudy.areaSqm,
    priceCzk: rentalApartmentStudy.purchasePriceCzk,
    imageUrl: rentalApartmentStudy.heroImage.src,
    shortDescription: "Ukázková data — metodika analýzy nájmu a cash flow.",
    tags: ["Ukázková data"],
    isDemo: true,
  },
  {
    href: "/ukazky/dum-pred-rekonstrukci",
    title: houseRenovationStudy.title,
    location: houseRenovationStudy.locationLabel,
    propertyTypeLabel: "Dům",
    areaSqm: houseRenovationStudy.areaSqm,
    priceCzk: houseRenovationStudy.purchasePriceCzk,
    imageUrl: houseRenovationStudy.heroImage.src,
    shortDescription: "Ukázková data — náklady rekonstrukce a rezervy.",
    tags: ["Ukázková data"],
    isDemo: true,
  },
  {
    href: "/ukazky/mensi-bytovy-dum",
    title: smallBuildingStudy.title,
    location: smallBuildingStudy.locationLabel,
    propertyTypeLabel: "Bytový dům",
    areaSqm: smallBuildingStudy.areaSqm,
    priceCzk: smallBuildingStudy.purchasePriceCzk,
    imageUrl: smallBuildingStudy.heroImage.src,
    shortDescription: "Ukázková data — obsazenost a výnosový pohled.",
    tags: ["Ukázková data"],
    isDemo: true,
  },
];

const renoReserve =
  houseRenovationStudy.renovationCostCzk + houseRenovationStudy.reserveCzk;
const totalModelCost =
  houseRenovationStudy.purchasePriceCzk +
  houseRenovationStudy.closingCostsCzk +
  renoReserve;
const barMax = totalModelCost;

const ANALYSIS_BARS = [
  {
    label: "Kupní cena",
    value: formatCzk(houseRenovationStudy.purchasePriceCzk),
    pct: Math.round((houseRenovationStudy.purchasePriceCzk / barMax) * 100),
  },
  {
    label: "Rekonstrukce a rezerva",
    value: formatCzk(renoReserve),
    pct: Math.round((renoReserve / barMax) * 100),
  },
  {
    label: "Celkové náklady (model)",
    value: formatCzk(totalModelCost),
    pct: 100,
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

  const liveListings = featuredListings.filter((l) => !l.isDemo).slice(0, 3);
  const displayListings =
    liveListings.length > 0 ? liveListings : HOMEPAGE_SHOWCASE_LISTINGS;
  const showingShowcase = liveListings.length === 0;

  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden bg-[var(--background-primary)]">
        <div
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 lg:block"
          aria-hidden
        >
          <Image
            src="/case-studies/homepage-hero.png"
            alt=""
            fill
            priority
            className="object-cover object-[center_30%]"
            sizes="50vw"
          />
        </div>

        <Container className="relative grid lg:grid-cols-2 lg:items-center">
          <div className="py-8 sm:py-10 lg:py-12 lg:pr-10">
            <h1 className="font-display text-[clamp(2.375rem,5vw,4rem)] font-medium leading-[1.02] tracking-tight text-[var(--text-primary)]">
              Najděte nemovitost.
              <br />
              Poznejte její potenciál.
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
              Pro bydlení i investici. S přehledem o ceně, nákladech a možnostech.
            </p>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2.5">
              {BENEFITS.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"
                >
                  <item.icon
                    className="size-4 shrink-0 stroke-[1.5] text-[var(--action-accent)]"
                    aria-hidden
                  />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mt-6 aspect-[16/10] overflow-hidden sm:aspect-[5/3] lg:mt-0 lg:aspect-auto lg:min-h-[380px] lg:opacity-0">
            <Image
              src="/case-studies/homepage-hero.png"
              alt="Moderní bytový dům s balkony a zelení"
              fill
              priority
              className="object-cover object-[center_30%] lg:hidden"
              sizes="(max-width: 1023px) 100vw, 1px"
            />
          </div>
        </Container>

        <Container className="relative z-10 -mt-8 pb-8 sm:-mt-10 sm:pb-10 lg:-mt-12">
          <HomeSearchPanel />
        </Container>
      </section>

      {/* DOPORUČENÉ NEMOVITOSTI */}
      <section className="border-t border-[var(--border-default)] bg-[var(--brand-warm-white,#fcfbf8)] py-10 sm:py-12">
        <Container>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--action-accent)]">
            Doporučené nabídky
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.1] text-[var(--text-primary)]">
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
          {showingShowcase ? (
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Zatím bez publikovaných inzerátů — níže jsou modelové ukázky
              metodiky, ne aktuální nabídky z trhu.
            </p>
          ) : null}
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {displayListings.map((card) => (
              <HomePropertyCard
                key={card.id ?? card.href}
                property={card}
                showcase={Boolean(card.isDemo)}
              />
            ))}
          </div>
        </Container>
      </section>

      {/* TMAVÁ ANALÝZA */}
      <section className="bg-[var(--surface-inverse)] py-12 text-[var(--text-inverse)] sm:py-14">
        <Container className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--action-accent)]">
              Datové podložení rozhodnutí
            </p>
            <h2 className="mt-3 font-display text-[clamp(1.875rem,3.2vw,2.75rem)] leading-[1.08]">
              Než si koupíte, podívejte se na čísla.
            </h2>
            <p className="mt-3 max-w-md text-base text-white/75">
              Náklady, výnosy a rizika konkrétní nemovitosti v jedné analýze.
            </p>
            <ul className="mt-7 space-y-4">
              {ANALYSIS_POINTS.map((item) => (
                <li key={item.title} className="flex gap-3">
                  <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--action-accent)]/20 text-[var(--action-accent)]">
                    <item.icon className="size-4 stroke-[1.5]" aria-hidden />
                  </span>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-0.5 text-sm text-white/65">{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <p className="text-sm text-white/65">Podrobná analýza</p>
              <p className="font-metric text-3xl tracking-tight">
                {formatCzk(publicCustomerOffer.priceGrossCzk)}
              </p>
              <p className="mt-1 text-xs text-white/50">
                {publicCustomerOffer.billingCs}. Termín dodání potvrdíme po
                přijetí podkladů.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link
                href="/ukazky/byt-dlouhodoby-pronajem"
                className="inline-flex h-11 items-center rounded-[var(--radius-lg)] border border-white/35 px-5 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                Prohlédnout ukázku
              </Link>
              <Link
                href={analysisCtaHref}
                className="inline-flex h-11 items-center rounded-[var(--radius-lg)] bg-[var(--action-accent)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--action-accent-hover)]"
              >
                {analysisCtaLabel}
              </Link>
            </div>
          </div>

          <div className="relative rounded-[var(--radius-card)] border border-white/10 bg-white p-5 text-[var(--text-primary)] shadow-[var(--shadow-overlay)] sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--action-accent)]">
                  Modelová analýza
                </p>
                <p className="mt-1 font-display text-xl text-[var(--text-primary)]">
                  {houseRenovationStudy.shortTitle}
                </p>
              </div>
              <span className="rounded-sm bg-[var(--action-accent)]/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-[var(--action-accent)]">
                Přehled pro vaše rozhodnutí
              </span>
            </div>

            <dl className="mt-5 space-y-3.5">
              {ANALYSIS_BARS.map((row) => (
                <div key={row.label}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                    <dt className="text-[var(--text-secondary)]">{row.label}</dt>
                    <dd className="font-metric font-medium">{row.value}</dd>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-sm bg-[var(--border-default)]">
                    <div
                      className="h-full rounded-sm bg-[var(--action-accent)]"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-[11px] text-[var(--text-muted)]">
              Modelová data ze studie — pruhy ukazují podíl položek na celkových
              nákladech modelu, ne tržní ocenění.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <figure>
                <div className="overflow-hidden rounded-[var(--radius-md)]">
                  <Image
                    src="/case-studies/house-before.png"
                    alt="Stav před rekonstrukcí"
                    width={400}
                    height={260}
                    className="aspect-[4/3] w-full object-cover"
                  />
                </div>
                <figcaption className="mt-1.5 text-center text-xs text-[var(--text-muted)]">
                  Před
                </figcaption>
              </figure>
              <figure>
                <div className="overflow-hidden rounded-[var(--radius-md)] ring-1 ring-[var(--action-accent)]/25">
                  <Image
                    src="/case-studies/house-after-visualization.png"
                    alt="Vizualizace po rekonstrukci"
                    width={400}
                    height={260}
                    className="aspect-[4/3] w-full object-cover"
                  />
                </div>
                <figcaption className="mt-1.5 text-center text-xs text-[var(--text-muted)]">
                  Po (model)
                </figcaption>
              </figure>
            </div>
          </div>
        </Container>
      </section>

      {/* NÁSTROJE */}
      <section className="py-10 sm:py-12">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.1] text-[var(--text-primary)]">
              Analýzy a kalkulačky
            </h2>
            <Link
              href="/analyzy-a-kalkulacky"
              className="inline-flex items-center gap-1 text-sm font-medium text-[var(--action-accent)] underline-offset-2 hover:underline"
            >
              Všechny nástroje
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TOOLS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group flex items-start gap-3 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-white px-4 py-4 transition-all duration-[var(--duration-fast)] hover:-translate-y-0.5 hover:border-[var(--action-accent)] hover:shadow-[var(--shadow-raised)]"
              >
                <tool.icon
                  className="mt-0.5 size-5 shrink-0 stroke-[1.5] text-[var(--action-accent)]"
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

      {/* MOŽNOSTI */}
      <section className="border-y border-[var(--border-default)] bg-white py-10 sm:py-12">
        <Container>
          <h2 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.1] text-[var(--text-primary)]">
            Více možností bydlení a investování
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MODES.map((mode) => (
              <Link
                key={mode.href}
                href={mode.href}
                className="group flex items-start gap-3 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--background-primary)] px-4 py-3.5 transition-all duration-[var(--duration-fast)] hover:-translate-y-0.5 hover:border-[var(--action-accent)] hover:shadow-[var(--shadow-raised)]"
              >
                <mode.icon
                  className="mt-0.5 size-5 shrink-0 stroke-[1.5] text-[var(--action-accent)]"
                  aria-hidden
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-[var(--text-primary)]">
                    {mode.title}
                  </span>
                  <span className="mt-0.5 block text-sm leading-snug text-[var(--text-muted)]">
                    {mode.text}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* KATEGORIE */}
      <section className="py-10 sm:py-12">
        <Container>
          <div className="grid gap-5 md:grid-cols-3">
            {PROJECTS.map((project) => (
              <Link
                key={project.href}
                href={project.href}
                className="group overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-default)] bg-white transition-all duration-[var(--duration-fast)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={project.image}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="flex items-start justify-between gap-3 px-4 py-3.5">
                  <div>
                    <h3 className="font-display text-lg text-[var(--text-primary)]">
                      {project.title}
                    </h3>
                    <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                      {project.text}
                    </p>
                  </div>
                  <ArrowRight
                    className="mt-1 size-4 shrink-0 text-[var(--action-accent)] transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* MODELOVÉ STUDIE */}
      <section className="border-t border-[var(--border-default)] bg-[var(--brand-warm-white,#fcfbf8)] py-10 sm:py-12">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.1] text-[var(--text-primary)]">
              Podívejte se, co odhalí analýza
            </h2>
            <Link
              href="/ukazky"
              className="inline-flex items-center gap-1 text-sm font-medium text-[var(--action-accent)] underline-offset-2 hover:underline"
            >
              Další modelové studie
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {STUDY_TEASERS.map((study) => {
              const exists = studies.some((s) => s.definition.slug === study.slug);
              if (!exists) return null;
              return (
                <Link
                  key={study.slug}
                  href={`/ukazky/${study.slug}`}
                  className="group flex overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-default)] bg-white transition-all duration-[var(--duration-fast)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)]"
                >
                  <div className="relative w-[42%] shrink-0 self-stretch min-h-[132px]">
                    <Image
                      src={study.image}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      sizes="15vw"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-center gap-1.5 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--action-accent)]">
                      Modelová studie
                    </p>
                    <h3 className="font-display text-lg leading-snug text-[var(--text-primary)] group-hover:text-[var(--action-accent)]">
                      {study.title}
                    </h3>
                    <p className="text-sm leading-snug text-[var(--text-secondary)]">
                      {study.text}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </Container>
      </section>

      {/* INZERENTI */}
      <section className="border-y border-[var(--border-default)] bg-[var(--background-primary)] py-8 sm:py-9">
        <Container className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[var(--action-accent)]/25 text-[var(--action-accent)]">
              <KeyRound className="size-4 stroke-[1.5]" aria-hidden />
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
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/pridat-nemovitost"
              className="inline-flex h-11 items-center rounded-[var(--radius-lg)] bg-[var(--action-primary)] px-5 text-sm font-medium text-white transition-colors hover:bg-[var(--action-primary-hover)]"
            >
              Přidat nemovitost
            </Link>
            <Link
              href="/pro-inzerenty"
              className="inline-flex h-11 items-center rounded-[var(--radius-lg)] border border-[var(--border-strong)] px-5 text-sm font-medium transition-colors hover:bg-white"
            >
              Služby a ceník inzerce
            </Link>
          </div>
          <Link
            href="/ucet/nabidky"
            className="text-sm font-medium text-[var(--action-accent)] underline-offset-2 hover:underline lg:text-right"
          >
            Správa nabídek v mém účtu
          </Link>
        </Container>
      </section>

      {/* POSOUZENÍ */}
      <section id="posoudit" className="py-10 sm:py-12">
        <Container>
          <div id="posoudit-form">
            <HomeAssessmentEntry />
          </div>
        </Container>
      </section>
    </main>
  );
}

function HomePropertyCard({
  property,
  showcase,
}: {
  property: PropertyCardData;
  showcase?: boolean;
}) {
  const tag =
    property.featureHighlights?.[0] ??
    property.conditionLabel ??
    (property.tags?.find((t) => !/ukázkov/i.test(t)) ?? null) ??
    property.propertyTypeLabel ??
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
    <article
      className={cn(
        "group overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-default)] bg-white shadow-[var(--shadow-raised)] transition-all duration-[var(--duration-fast)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]",
      )}
    >
      <Link href={property.href} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-[var(--surface-sunken)]">
          <PropertyListingImage
            src={property.imageUrl}
            alt=""
            className="transition-transform duration-500 group-hover:scale-[1.02]"
          />
          {tag ? (
            <span className="absolute inset-x-0 bottom-0 z-10 bg-[var(--surface-inverse)]/80 px-3 py-1.5 text-xs font-medium text-white">
              {tag}
            </span>
          ) : null}
          {showcase || property.isDemo ? (
            <span className="absolute left-2.5 top-2.5 z-10 rounded-sm bg-white/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-primary)]">
              Ukázková data
            </span>
          ) : null}
          <span
            className="absolute right-2.5 top-2.5 z-10 inline-flex size-8 items-center justify-center rounded-full bg-white/90 text-[var(--text-muted)]"
            aria-hidden
          >
            <Heart className="size-3.5" />
          </span>
        </div>
        <div className="space-y-1 p-4">
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
