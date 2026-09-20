import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeftRight,
  ArrowRight,
  BarChart3,
  Calculator,
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
  Settings,
  Shield,
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

const HERO_IMAGE = "/home/hero.png";

const BENEFITS = [
  { label: "Krásnější domov", icon: Home },
  { label: "Lepší investice", icon: TrendingUp },
  { label: "Jistější budoucnost", icon: Shield },
] as const;

const ANALYSIS_POINTS = [
  { line1: "Celkové náklady", line2: "koupě", icon: Calculator },
  { line1: "Rekonstrukce", line2: "a potenciál", icon: BarChart3 },
  { line1: "Scénáře", line2: "a rizika", icon: Shield },
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
    image: "/home/hero.png",
  },
  {
    href: "/domy-na-klic",
    title: "Domy na klíč",
    text: "Hotové bydlení bez starostí.",
    image: "/home/prop-villa.png",
  },
  {
    href: "/nemovitosti/investicni-prilezitosti",
    title: "Investiční nemovitosti",
    text: "Příležitosti s výnosovým potenciálem.",
    image: "/home/cat-invest.png",
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

/** Design demo cards for empty catalog — aspirational visuals. */
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
    shortDescription: "Světlý byt s velkým oknem a balkonem.",
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
    imageUrl: "/home/prop-villa.png",
    shortDescription: "Moderní rodinný dům se zahradou.",
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
    imageUrl: "/home/prop-townhouse.png",
    shortDescription: "Elegantní městský dům s výnosovým potenciálem.",
    featureHighlights: ["4 byty"],
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
            src={HERO_IMAGE}
            alt=""
            fill
            priority
            className="object-cover object-center"
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
            <p className="home-hero-lead">
              Pro bydlení i investici. S přehledem o ceně, nákladech a možnostech.
            </p>
            <ul className="home-hero-benefits">
              {BENEFITS.map((item) => (
                <li key={item.label}>
                  <item.icon aria-hidden />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
          <div className="home-hero-mobile-photo">
            <Image
              src={HERO_IMAGE}
              alt="Moderní rezidenční komplex se zelení"
              fill
              priority
              className="object-cover object-center"
              sizes="100vw"
            />
          </div>
        </Container>

        <Container className="home-search-wrap">
          <HomeSearchPanel />
        </Container>
      </section>

      {/* PROPERTIES */}
      <section className="home-section home-props">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="home-eyebrow">Doporučené nabídky</p>
              <h2 className="home-heading mt-1">Objevte své další místo</h2>
            </div>
            <Link href="/nemovitosti" className="home-link inline-flex items-center gap-1">
              Všechny nemovitosti
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          {showingShowcase ? (
            <p className="sr-only">
              Ukázkové karty — nejde o aktuální nabídky z katalogu.
            </p>
          ) : null}
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayListings.map((card) => (
              <HomePropertyCard
                key={card.id ?? card.href}
                property={card}
              />
            ))}
          </div>
        </Container>
      </section>

      {/* ANALYSIS */}
      <section className="home-analysis">
        <Container className="relative z-[1] grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <p className="home-eyebrow text-[var(--home-teal,#008f8c)]">
              Datově podložená rozhodnutí
            </p>
            <h2 className="home-analysis-title mt-1.5">
              Než si koupíte, podívejte se
              <br className="hidden sm:block" /> na čísla.
            </h2>
            <p className="mt-2 max-w-md text-sm text-white/75">
              Náklady, výnosy a rizika konkrétní nemovitosti v jedné analýze.
            </p>
            <ul className="home-analysis-points">
              {ANALYSIS_POINTS.map((item) => (
                <li key={item.line1} className="home-analysis-point">
                  <item.icon aria-hidden />
                  <span>
                    {item.line1}
                    <br />
                    {item.line2}
                  </span>
                </li>
              ))}
            </ul>
            <hr className="mt-5 border-white/15" />
            <p className="mt-4 text-[0.6875rem] text-white/65">Podrobná analýza</p>
            <p className="font-metric text-2xl tracking-tight text-white">
              {formatCzk(publicCustomerOffer.priceGrossCzk)}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
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

          <div className="home-analysis-card-wrap">
            <span className="home-analysis-float-badge">
              <BarChart3 className="size-3.5" aria-hidden />
              Přehled pro vaše rozhodnutí
            </span>
            <div className="home-analysis-card">
              <div>
                <p className="home-eyebrow">Modelová analýza</p>
                <p className="mt-0.5 font-display text-base text-[var(--home-navy,#07344a)]">
                  {houseRenovationStudy.shortTitle}
                </p>
              </div>

              <dl className="mt-3 space-y-2.5">
                {ANALYSIS_BARS.map((row) => (
                  <div key={row.label}>
                    <div className="mb-1 flex items-baseline justify-between gap-2 text-[0.8125rem]">
                      <dt className="text-[var(--home-muted,#657782)]">{row.label}</dt>
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
              <p className="mt-1.5 text-[10px] leading-snug text-[var(--home-muted,#657782)]">
                Modelová struktura nákladů ze studie — ne tržní ocenění.
              </p>

              <div className="home-analysis-compare">
                <span className="home-analysis-arrow" aria-hidden>
                  <ArrowLeftRight className="size-3.5" />
                </span>
                <figure>
                  <Image
                    src="/case-studies/house-before.png"
                    alt="Před rekonstrukcí"
                    width={280}
                    height={160}
                  />
                  <figcaption className="mt-1 text-center text-[10px] text-[var(--home-muted,#657782)]">
                    Před rekonstrukcí
                  </figcaption>
                </figure>
                <figure>
                  <Image
                    src="/case-studies/house-after-visualization.png"
                    alt="Po rekonstrukci — model"
                    width={280}
                    height={160}
                  />
                  <figcaption className="mt-1 text-center text-[10px] text-[var(--home-muted,#657782)]">
                    Po rekonstrukci
                  </figcaption>
                </figure>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* TOOLS */}
      <section className="home-section home-tools">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="home-heading">Analýzy a kalkulačky</h2>
            <Link
              href="/analyzy-a-kalkulacky"
              className="home-link inline-flex items-center gap-1"
            >
              Všechny nástroje
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {TOOLS.map((tool) => (
              <Link key={tool.href} href={tool.href} className="home-card home-tool-card">
                <tool.icon aria-hidden />
                <span>
                  <span className="home-card-title">{tool.title}</span>
                  <span className="home-card-desc block">{tool.text}</span>
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* OPTIONS */}
      <section className="home-section home-options">
        <Container>
          <h2 className="home-heading">Více možností bydlení a investování</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {MODES.map((mode) => (
              <Link key={mode.href} href={mode.href} className="home-card home-mode-card">
                <mode.icon aria-hidden />
                <span>
                  <span className="home-card-title">{mode.title}</span>
                  <span className="home-card-desc block">{mode.text}</span>
                </span>
              </Link>
            ))}
          </div>
          <p className="home-options-note">
            Dostupnost jednotlivých možností podle konkrétní nabídky.
          </p>
        </Container>
      </section>

      {/* CATEGORIES — image top + white footer */}
      <section className="home-section-tight home-categories">
        <Container>
          <div className="grid gap-4 md:grid-cols-3">
            {PROJECTS.map((project) => (
              <Link
                key={project.href}
                href={project.href}
                className="home-category-card group"
              >
                <div className="home-category-media">
                  <Image
                    src={project.image}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <span className="home-category-footer">
                  <span>
                    <h3>{project.title}</h3>
                    <p>{project.text}</p>
                  </span>
                  <ArrowRight
                    className="mt-0.5 size-4 shrink-0 text-[var(--home-teal,#008f8c)]"
                    aria-hidden
                  />
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* STUDIES */}
      <section className="home-section home-studies">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="home-heading">Podívejte se, co odhalí analýza</h2>
            <Link href="/ukazky" className="home-link inline-flex items-center gap-1">
              Další modelové studie
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
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
                    sizes="12vw"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-center gap-0.5 p-3">
                  <p className="home-eyebrow">Modelová studie</p>
                  <h3 className="font-display text-[0.9375rem] leading-snug text-[var(--home-navy,#07344a)] group-hover:text-[var(--home-teal,#008f8c)]">
                    {study.title}
                  </h3>
                  <p className="line-clamp-2 text-[0.75rem] leading-snug text-[var(--home-muted,#657782)]">
                    {study.text}
                  </p>
                </div>
                <span className="home-study-arrow">
                  <ArrowRight className="size-4" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* SELLER */}
      <section className="home-seller-strip home-section-tight">
        <Home className="home-seller-deco" aria-hidden />
        <Container className="relative z-[1] flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="flex items-start gap-3">
            <span className="home-seller-icon">
              <KeyRound aria-hidden />
            </span>
            <div>
              <h2 className="home-seller-title">Prodáváte nebo pronajímáte?</h2>
              <p className="mt-1 text-[0.8125rem] text-[var(--home-muted,#657782)]">
                Pro majitele, makléře, realitní kanceláře i developery.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/pridat-nemovitost" className="home-btn-primary">
              Přidat nemovitost
            </Link>
            <Link href="/pro-inzerenty" className="home-btn-outline">
              Služby a ceník inzerce
            </Link>
          </div>
          <Link
            href="/ucet/nabidky"
            className="home-link inline-flex items-center gap-1.5 lg:justify-end"
          >
            <Settings className="size-3.5" aria-hidden />
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
}: {
  property: PropertyCardData;
}) {
  const tag =
    property.featureHighlights?.[0] ??
    property.conditionLabel ??
    property.propertyTypeLabel ??
    null;

  return (
    <article className="home-card overflow-hidden">
      <Link href={property.href} className="group block">
        <div className="home-prop-media">
          <PropertyListingImage
            src={property.imageUrl}
            alt=""
            className="transition-transform duration-500 group-hover:scale-[1.02]"
          />
          {tag ? (
            <span className="absolute bottom-2.5 left-2.5 z-10 rounded-[4px] bg-white/95 px-2 py-0.5 text-[11px] font-medium text-[var(--home-navy,#07344a)]">
              {tag}
            </span>
          ) : null}
          <span
            className="absolute right-2.5 top-2.5 z-10 inline-flex size-7 items-center justify-center rounded-full bg-white/90 text-[var(--home-muted,#657782)]"
            aria-hidden
          >
            <Heart className="size-3.5" />
          </span>
        </div>
        <div className="home-prop-body">
          <div className="home-prop-row">
            <p className="home-prop-title">{property.title}</p>
            <p className="home-prop-price">
              {property.priceCzk != null
                ? formatCzk(property.priceCzk)
                : "Na vyžádání"}
            </p>
          </div>
          <p className="mt-0.5 text-[0.8125rem] text-[var(--home-muted,#657782)]">
            {property.location}
          </p>
          {property.shortDescription ? (
            <p className="mt-0.5 line-clamp-2 text-[0.75rem] text-[var(--home-muted,#657782)]">
              {property.shortDescription}
            </p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
