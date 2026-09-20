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
import { houseRenovationStudy } from "@/content/case-studies";
import {
  publicCheckoutMode,
  publicCustomerOffer,
} from "@/config/public-offer";
import { formatCzk } from "@/components/marketing/format";
import type { PropertyCardData } from "@/components/property/property-card";
import { PropertyListingImage } from "@/components/property/property-listing-image";

const BENEFITS = [
  { label: "Krásnější domov", icon: Home },
  { label: "Lepší investice", icon: TrendingUp },
  { label: "Jistější budoucnost", icon: Sparkles },
] as const;

const ANALYSIS_POINTS = [
  { title: "Celkové náklady koupě", icon: PiggyBank },
  { title: "Rekonstrukce a potenciál", icon: Wrench },
  { title: "Scénáře a rizika", icon: BarChart3 },
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
    image: "/case-studies/homepage-hero.png",
  },
  {
    href: "/domy-na-klic",
    title: "Domy na klíč",
    image: "/case-studies/house-after-visualization.png",
  },
  {
    href: "/nemovitosti/investicni-prilezitosti",
    title: "Investiční nemovitosti",
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

/** Design demo cards for empty catalog — labeled as ukázková data. */
export const HOMEPAGE_SHOWCASE_LISTINGS: PropertyCardData[] = [
  {
    href: "/ukazky/byt-dlouhodoby-pronajem",
    title: "Byt 2+kk · 58 m²",
    location: "Praha 9",
    propertyTypeLabel: "Byt",
    disposition: "2+kk",
    areaSqm: 58,
    priceCzk: 5_490_000,
    imageUrl: "/case-studies/rental-apartment.png",
    shortDescription: "Ukázková nabídka — nájem, náklady a cash flow.",
    featureHighlights: ["Balkon"],
    tags: ["Ukázková data"],
    isDemo: true,
  },
  {
    href: "/ukazky/dum-pred-rekonstrukci",
    title: "Rodinný dům · 146 m²",
    location: "Brno-venkov",
    propertyTypeLabel: "Dům",
    areaSqm: 146,
    priceCzk: 7_890_000,
    imageUrl: "/case-studies/house-before.png",
    shortDescription: "Ukázková nabídka — rekonstrukce a rezerva.",
    featureHighlights: ["Zahrada"],
    tags: ["Ukázková data"],
    isDemo: true,
  },
  {
    href: "/ukazky/mensi-bytovy-dum",
    title: "Bytový dům · 320 m²",
    location: "Olomouc",
    propertyTypeLabel: "Bytový dům",
    areaSqm: 320,
    priceCzk: 12_800_000,
    imageUrl: "/case-studies/small-building.png",
    shortDescription: "Ukázková nabídka — obsazenost a výnos.",
    featureHighlights: ["4 jednotky"],
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
    label: "Odhad po rekonstrukci",
    value: formatCzk(totalModelCost),
    pct: 100,
  },
] as const;

export function PlatformHomepage({
  featuredListings,
}: {
  featuredListings: PropertyCardData[];
}) {
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
    <div className="home-shell">
      {/* HERO */}
      <section className="home-hero">
        <div className="home-hero-bleed" aria-hidden>
          <Image
            src="/case-studies/homepage-hero.png"
            alt=""
            fill
            priority
            className="object-cover object-[center_28%]"
            sizes="50vw"
          />
        </div>

        <Container className="relative z-[1] grid lg:grid-cols-2">
          <div className="home-hero-copy">
            <h1 className="home-hero-title">
              Najděte nemovitost.
              <br />
              Poznejte její potenciál.
            </h1>
            <p className="mt-3 max-w-md text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">
              Pro bydlení i investici. S přehledem o ceně, nákladech a možnostech.
            </p>
            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
              {BENEFITS.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-1.5 text-[0.8125rem] text-[var(--text-secondary)]"
                >
                  <item.icon
                    className="size-3.5 stroke-[1.5] text-[var(--action-accent)]"
                    aria-hidden
                  />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
          <div className="home-hero-mobile-photo mt-4">
            <Image
              src="/case-studies/homepage-hero.png"
              alt="Moderní bytový dům s balkony a zelení"
              fill
              priority
              className="object-cover object-[center_28%]"
              sizes="100vw"
            />
          </div>
        </Container>

        <Container className="home-search-wrap">
          <HomeSearchPanel />
        </Container>
      </section>

      {/* PROPERTIES */}
      <section className="home-section border-t border-[var(--border-default)] bg-white">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="home-eyebrow">Doporučené nabídky</p>
              <h2 className="home-heading mt-1.5 text-[clamp(1.625rem,2.6vw,2.25rem)]">
                Objevte své další místo
              </h2>
            </div>
            <Link href="/nemovitosti" className="home-link inline-flex items-center gap-1">
              Všechny nemovitosti
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          {showingShowcase ? (
            <p className="mt-1.5 text-xs text-[var(--text-muted)]">
              Ukázkové karty — nejde o aktuální nabídky z katalogu.
            </p>
          ) : null}
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {displayListings.map((card) => (
              <HomePropertyCard
                key={card.id ?? card.href}
                property={card}
                showcase={Boolean(card.isDemo) || showingShowcase}
              />
            ))}
          </div>
        </Container>
      </section>

      {/* ANALYSIS */}
      <section className="home-analysis home-section">
        <Container className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <p className="home-eyebrow text-[var(--action-accent)]">
              Datově podložená rozhodnutí
            </p>
            <h2 className="mt-2 font-display text-[clamp(1.75rem,3vw,2.5rem)] font-medium leading-[1.08] text-white">
              Než si koupíte, podívejte se
              <br className="hidden sm:block" /> na čísla.
            </h2>
            <p className="mt-3 max-w-md text-sm text-white/75">
              Náklady, výnosy a rizika konkrétní nemovitosti v jedné analýze.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-3">
              {ANALYSIS_POINTS.map((item) => (
                <li key={item.title} className="flex items-start gap-2">
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--action-accent)]/20 text-[var(--action-accent)]">
                    <item.icon className="size-3.5 stroke-[1.5]" aria-hidden />
                  </span>
                  <span className="text-sm font-medium leading-snug text-white">
                    {item.title}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-white/65">Podrobná analýza</p>
            <p className="font-metric text-[1.75rem] tracking-tight text-white">
              {formatCzk(publicCustomerOffer.priceGrossCzk)}
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link
                href="/ukazky/byt-dlouhodoby-pronajem"
                className="home-btn-outline-light"
              >
                Prohlédnout ukázku
              </Link>
              <Link href={analysisCtaHref} className="home-btn-primary">
                {analysisCtaLabel}
              </Link>
            </div>
          </div>

          <div className="home-analysis-card">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="home-eyebrow">Modelová analýza</p>
                <p className="mt-1 font-display text-lg text-[var(--text-primary)]">
                  {houseRenovationStudy.shortTitle}
                </p>
              </div>
              <span className="rounded-[4px] bg-[var(--action-accent)]/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--action-accent)]">
                Přehled
              </span>
            </div>

            <dl className="mt-4 space-y-3">
              {ANALYSIS_BARS.map((row) => (
                <div key={row.label}>
                  <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                    <dt className="text-[var(--text-secondary)]">{row.label}</dt>
                    <dd className="font-metric font-medium">{row.value}</dd>
                  </div>
                  <div className="home-bar-track">
                    <div
                      className="home-bar-fill"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-[10px] leading-snug text-[var(--text-muted)]">
              Modelová struktura nákladů ze studie — ne tržní ocenění.
            </p>

            <div className="relative mt-4 grid grid-cols-2 gap-2.5">
              <figure>
                <div className="overflow-hidden rounded-[4px]">
                  <Image
                    src="/case-studies/house-before.png"
                    alt="Před rekonstrukcí"
                    width={360}
                    height={240}
                    className="aspect-[4/3] w-full object-cover"
                  />
                </div>
                <figcaption className="mt-1 text-center text-[11px] text-[var(--text-muted)]">
                  Před
                </figcaption>
              </figure>
              <figure>
                <div className="overflow-hidden rounded-[4px] ring-1 ring-[var(--action-accent)]/30">
                  <Image
                    src="/case-studies/house-after-visualization.png"
                    alt="Po rekonstrukci — model"
                    width={360}
                    height={240}
                    className="aspect-[4/3] w-full object-cover"
                  />
                </div>
                <figcaption className="mt-1 text-center text-[11px] text-[var(--text-muted)]">
                  Po
                </figcaption>
              </figure>
            </div>
          </div>
        </Container>
      </section>

      {/* TOOLS */}
      <section className="home-section bg-white">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="home-heading text-[clamp(1.625rem,2.6vw,2.25rem)]">
              Analýzy a kalkulačky
            </h2>
            <Link
              href="/analyzy-a-kalkulacky"
              className="home-link inline-flex items-center gap-1"
            >
              Všechny nástroje
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TOOLS.map((tool) => (
              <Link key={tool.href} href={tool.href} className="home-card home-tool-card">
                <tool.icon
                  className="mt-0.5 size-5 shrink-0 stroke-[1.5] text-[var(--action-accent)]"
                  aria-hidden
                />
                <span>
                  <span className="block text-sm font-semibold text-[var(--text-primary)]">
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

      {/* MODES */}
      <section className="home-section border-y border-[var(--border-default)] bg-[var(--brand-warm-white,#fcfbf8)]">
        <Container>
          <h2 className="home-heading text-[clamp(1.625rem,2.6vw,2.25rem)]">
            Více možností bydlení a investování
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MODES.map((mode) => (
              <Link key={mode.href} href={mode.href} className="home-card home-mode-card">
                <mode.icon
                  className="mt-0.5 size-5 shrink-0 stroke-[1.5] text-[var(--action-accent)]"
                  aria-hidden
                />
                <span>
                  <span className="block text-sm font-semibold text-[var(--text-primary)]">
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

      {/* CATEGORIES — image overlay text */}
      <section className="home-section bg-white">
        <Container>
          <div className="grid gap-5 md:grid-cols-3">
            {PROJECTS.map((project) => (
              <Link
                key={project.href}
                href={project.href}
                className="home-category-card group"
              >
                <Image
                  src={project.image}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <span className="home-category-label">
                  <span className="font-display text-lg leading-tight">
                    {project.title}
                  </span>
                  <ArrowRight className="size-4 shrink-0" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* STUDIES */}
      <section className="home-section border-t border-[var(--border-default)] bg-[var(--brand-warm-white,#fcfbf8)]">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="home-heading text-[clamp(1.625rem,2.6vw,2.25rem)]">
              Podívejte se, co odhalí analýza
            </h2>
            <Link href="/ukazky" className="home-link inline-flex items-center gap-1">
              Další modelové studie
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {STUDY_TEASERS.map((study) => (
              <Link
                key={study.slug}
                href={`/ukazky/${study.slug}`}
                className="home-card home-study-card group"
              >
                <div className="home-study-card-media">
                  <Image
                    src={study.image}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    sizes="15vw"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-center gap-1 p-3.5">
                  <p className="home-eyebrow">Modelová studie</p>
                  <h3 className="font-display text-base leading-snug text-[var(--text-primary)] group-hover:text-[var(--action-accent)]">
                    {study.title}
                  </h3>
                  <p className="text-sm leading-snug text-[var(--text-muted)]">
                    {study.text}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* SELLER */}
      <section className="home-seller-strip home-section-tight">
        <Container className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-[var(--action-accent)]/30 text-[var(--action-accent)]">
              <KeyRound className="size-4 stroke-[1.5]" aria-hidden />
            </span>
            <div>
              <h2 className="home-heading text-xl">Prodáváte nebo pronajímáte?</h2>
              <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                Pro majitele, makléře, realitní kanceláře i developery.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/pridat-nemovitost" className="home-btn-primary">
              Přidat nemovitost
            </Link>
            <Link href="/pro-inzerenty" className="home-btn-outline">
              Služby a ceník inzerce
            </Link>
          </div>
          <Link href="/ucet/nabidky" className="home-link lg:text-right">
            Správa nabídek v mém účtu
          </Link>
        </Container>
      </section>

      {/* ASSESSMENT */}
      <section id="posoudit" className="home-assess-strip home-section-tight">
        <Container>
          <div id="posoudit-form">
            <HomeAssessmentEntry />
          </div>
        </Container>
      </section>
    </div>
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
    property.propertyTypeLabel ??
    null;

  return (
    <article className="home-card overflow-hidden">
      <Link href={property.href} className="block">
        <div className="home-prop-media">
          <PropertyListingImage
            src={property.imageUrl}
            alt=""
            className="transition-transform duration-500 group-hover:scale-[1.02]"
          />
          {tag ? (
            <span className="absolute bottom-2.5 left-2.5 z-10 rounded-[4px] bg-white/95 px-2 py-0.5 text-[11px] font-medium text-[var(--text-primary)]">
              {tag}
            </span>
          ) : null}
          {showcase ? (
            <span className="absolute left-2.5 top-2.5 z-10 rounded-[4px] bg-[var(--surface-inverse)]/85 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
              Ukázka
            </span>
          ) : null}
          <span
            className="absolute right-2.5 top-2.5 z-10 inline-flex size-7 items-center justify-center rounded-full bg-white/90 text-[var(--text-muted)]"
            aria-hidden
          >
            <Heart className="size-3.5" />
          </span>
        </div>
        <div className="space-y-1 p-3.5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold leading-snug text-[var(--text-primary)]">
              {property.title}
            </p>
            <p className="shrink-0 font-metric text-base font-semibold text-[var(--text-primary)]">
              {property.priceCzk != null
                ? formatCzk(property.priceCzk)
                : "Na vyžádání"}
            </p>
          </div>
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
