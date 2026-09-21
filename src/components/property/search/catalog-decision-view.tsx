"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Bus, HeartPulse, Home, School, ShoppingCart, TrendingUp } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { FinancingSummary } from "@/components/financing/financing-summary";
import { DemoNegotiationForms } from "@/components/listings/demo-negotiation-forms";
import { AnalysisOfferCard } from "@/components/property/analysis-offer-card";
import { PrePurchaseChecklist } from "@/components/property/pre-purchase-checklist";
import { PropertyFact } from "@/components/property/property-fact";
import { CatalogPhotoGallery } from "@/components/property/search/catalog-photo-gallery";
import { buildCatalogParamGroups } from "@/components/property/search/catalog-param-groups";
import { PropertyCard } from "@/components/property/search/catalog-property-card";
import { CatalogViewingChecklist } from "@/components/property/search/catalog-viewing-checklist";
import { Container } from "@/components/ui/container";
import { VERIFY_LABEL } from "@/domains/properties/presentation";
import { getSiteOrigin } from "@/domains/seo/site-origin";
import {
  buildModelDecision,
  matchCatalogComparables,
  pricePerSquareMetre,
  projectValue,
  renovationBands,
} from "@/lib/catalog-decision";
import { formatCzk } from "@/lib/format";
import {
  catalogPropertyHref,
  catalogShots,
  mockProperties,
  TECHNICAL_CONDITION_LABEL,
  type AmenityCategory,
  type Property,
} from "@/lib/mock-properties";

const KIND: Record<Property["typ_nemovitosti"], string> = {
  byt: "Byt",
  dum: "Dům",
  pozemek: "Pozemek",
  komerce: "Komerční",
};
const AMENITY_ICON: Record<AmenityCategory, typeof School> = {
  education: School,
  shopping: ShoppingCart,
  transport: Bus,
  health: HeartPulse,
};
const NAV = [
  ["prehled", "Přehled"],
  ["parametry", "Parametry"],
  ["trh", "Trh"],
  ["investice", "Investice"],
  ["financovani", "Financování"],
  ["lokalita", "Lokalita"],
  ["rizika", "Rizika"],
  ["dokumenty", "Dokumenty"],
] as const;
const COMPARE_KEY = "majetio-catalog-compare";
const CTA = "pd-cta";
const CTA_OUTLINE = "pd-cta-outline";

const ScenarioChart = dynamic(
  () => import("@/components/charts/charts").then((mod) => mod.LineChart),
  {
    ssr: false,
    loading: () => <div className="h-64 animate-pulse rounded-2xl bg-[var(--surface-sunken)]" aria-busy="true" />,
  },
);

function readCompare(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(COMPARE_KEY) ?? "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "number").slice(0, 4) : [];
  } catch {
    return [];
  }
}

export function CatalogDecisionView({ property }: { property: Property }) {
  const params = useSearchParams();
  const mode = params.get("rezim") === "investice" ? "investice" : "bydleni";
  const model = useMemo(() => buildModelDecision(property), [property]);
  const comparables = useMemo(() => matchCatalogComparables(property, 6), [property]);
  const [active, setActive] = useState("prehled");
  const [saved, setSaved] = useState(false);
  const [shared, setShared] = useState(false);
  const [compare, setCompare] = useState<number[]>([]);
  const [rates, setRates] = useState({ low: 1, base: 3, high: 5 });
  const [renovation, setRenovation] = useState("zadna");

  useEffect(() => {
    setCompare(readCompare());
    setSaved(window.localStorage.getItem(`majetio-save-${property.id}`) === "1");
  }, [property.id]);

  useEffect(() => {
    const nodes = NAV.map(([id]) => document.getElementById(id)).filter((node): node is HTMLElement => Boolean(node));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0.15, 0.4] },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const sale = property.typ_transakce === "prodej";
  const price = sale ? formatCzk(property.cena) : `${formatCzk(property.cena)} / měsíc`;
  const perM2 = pricePerSquareMetre(property.cena, property.plocha_m2);
  const area = `${new Intl.NumberFormat("cs-CZ").format(property.plocha_m2)} m²`;
  const title = `${sale ? "Prodej" : "Pronájem"} ${KIND[property.typ_nemovitosti].toLowerCase()}${property.dispozice ? ` ${property.dispozice}` : ""}, ${area}`;
  const bands = renovationBands(property.plocha_m2);
  const selectedBand = bands.find((band) => band.id === renovation) ?? bands[0];
  const renovationMid = selectedBand ? Math.round((selectedBand.low + selectedBand.high) / 2) : 0;
  const invested = property.cena + renovationMid + (model ? 100_000 : 0);
  const paragraphs = property.detail_popis.split(/\n\n+/).filter((part) => part.trim().length > 0);
  const preview = paragraphs.filter((part) => !["O nemovitosti", "Technický stav", "Potenciál a investice"].includes(part.trim())).slice(0, 2);

  function toggleSave() {
    const next = !saved;
    setSaved(next);
    window.localStorage.setItem(`majetio-save-${property.id}`, next ? "1" : "0");
  }

  function toggleCompare() {
    const next = compare.includes(property.id)
      ? compare.filter((id) => id !== property.id)
      : [...compare, property.id].slice(0, 4);
    setCompare(next);
    window.sessionStorage.setItem(COMPARE_KEY, JSON.stringify(next));
  }

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: property.nazev, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    setShared(true);
  }

  const financingHref = `/kalkulacky/financovani?cena=${property.cena}`;
  const propertyUrl = `${getSiteOrigin()}${catalogPropertyHref(property.id)}`;

  return (
    <div className="pd-shell">
    <Container width="full" className="max-w-[1440px] py-6 sm:py-8">
      <Link href="/nemovitosti" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--pd-muted,#667a86)]">
        <ArrowLeft className="size-4" aria-hidden />
        Zpět na výpis
      </Link>
      <p className="mt-4 inline-flex rounded-full border border-[var(--pd-border,#dde5e7)] bg-[var(--pd-teal-soft,#f4fafa)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--pd-teal-dark,#087d78)]">
        Ukázková nabídka
      </p>

      <div className="mt-4 grid items-start gap-8 lg:grid-cols-[minmax(0,2.35fr)_minmax(18rem,1fr)]">
        <div className="min-w-0">
          <CatalogPhotoGallery shots={catalogShots(property)} />

          <header id="prehled" className="scroll-mt-28 mt-6">
            <h1 className="text-3xl sm:text-4xl">{title}</h1>
            <p className="mt-2 text-lg text-[var(--pd-muted,#667a86)]">{property.lokalita}</p>
            <p className="mt-4 font-metric text-4xl text-[var(--pd-navy,#0b3550)]">{price}</p>
            {perM2 != null && sale ? (
              <p className="mt-1 text-sm text-[var(--pd-muted,#667a86)]">{formatCzk(perM2)}/m²</p>
            ) : null}
            {sale ? (
              <FinancingSummary
                propertyPriceCzk={property.cena}
                propertyUrl={propertyUrl}
                variant="compact"
                sourceContext="property_detail"
              />
            ) : null}
            <ul className="mt-4 flex flex-wrap gap-2">
              <Chip>{sale ? "Prodej" : "Pronájem"}</Chip>
              {property.dispozice ? <Chip>{property.dispozice}</Chip> : null}
              <Chip>{area}</Chip>
              <Chip>{TECHNICAL_CONDITION_LABEL[property.technicky_stav]}</Chip>
              {property.konstrukce ? <Chip>{property.konstrukce}</Chip> : null}
              {property.vytah === true ? <Chip>Výtah</Chip> : property.vytah === false ? <Chip>Bez výtahu</Chip> : null}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2 lg:hidden">
              <TextButton onClick={toggleSave}>{saved ? "Uloženo v prohlížeči" : "Uložit"}</TextButton>
              <TextButton onClick={() => void share()}>{shared ? "Odkaz zkopírován" : "Sdílet"}</TextButton>
              <TextButton onClick={toggleCompare}>
                {compare.includes(property.id) ? "V porovnání" : "Porovnat"}
              </TextButton>
            </div>
          </header>

          <ModeSwitch mode={mode} />
          <SectionNav active={active} />

          <section className="mt-8 rounded-2xl border border-[var(--border-default)] p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-display text-2xl">Majetio analýza</h2>
              {model ? <Badge>Modelová data</Badge> : null}
            </div>
            {model ? (
              <>
                <p className="mt-4 font-metric text-5xl text-[var(--text-primary)]">{model.score.total} / 100</p>
                <p className="mt-2 max-w-xl text-sm text-[var(--text-secondary)]">{model.score.note}</p>
                <ul className="mt-5 space-y-3">
                  {model.score.parts.map((part) => (
                    <li key={part.label}>
                      <div className="flex justify-between text-sm">
                        <span title={part.how}>{part.label}</span>
                        <span className="font-metric">{part.value}</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-[var(--surface-sunken)]">
                        <div className="h-1.5 rounded-full bg-[var(--action-primary)]" style={{ width: `${part.value}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-4 text-sm text-[var(--text-secondary)]">
                Skóre zatím nelze spolehlivě vypočítat. U této ukázky chybí model nájmu, nákladů a srovnatelných nabídek.
              </p>
            )}
          </section>

          <MetricGrid property={property} model={model} mode={mode} perM2={perM2} />

          <section className="mt-10 max-w-3xl">
            <h2 className="font-display text-2xl">O nemovitosti</h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--text-secondary)]">
              {preview.map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </div>
            {paragraphs.length > preview.length ? (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-medium">Zobrazit celý popis</summary>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {paragraphs.slice(preview.length).map((paragraph) => (
                    <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                  ))}
                </div>
              </details>
            ) : null}
          </section>

          <section id="parametry" className="scroll-mt-28 mt-10">
            <div className="pd-section-head">
              <h2>Parametry nemovitosti</h2>
              <p>
                Přehled údajů z nabídky. U potvrzených amenit ukazujeme Ano / Není.
                Chybějící důležité informace označujeme jako Nutno ověřit — nikdy je
                nevydáváme za „Není“.
              </p>
            </div>
            <div className="pd-param-grid mt-4">
              {buildCatalogParamGroups(property).map((group) => (
                <article key={group.title} className="pd-card">
                  <h3>{group.title}</h3>
                  <dl>
                    {group.rows.map((row) => (
                      <PropertyFact
                        key={row.label}
                        label={row.label}
                        display={row.fact.display}
                        status={row.fact.status}
                        tooltip={row.tooltip}
                      />
                    ))}
                  </dl>
                </article>
              ))}
            </div>
            <p className="pd-note">
              Ukázka nemá od inzerenta potvrzené Ano/Ne u většiny amenit. „Nutno ověřit“
              není totéž co „Není“.
            </p>
          </section>

          <section id="trh" className="scroll-mt-28 mt-10">
            <h2 className="font-display text-2xl">Jak si cena stojí proti trhu?</h2>
            {model && perM2 != null ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Stat label="Cena nemovitosti" value={`${formatCzk(perM2)}/m²`} />
                <Stat label="Modelová hladina" value={`${formatCzk(model.medianPerM2)}/m²`} />
                <Stat label="Rozdíl proti modelu" value={`${model.gapPct.toLocaleString("cs-CZ", { maximumFractionDigits: 1 })} %`} />
              </div>
            ) : (
              <p className="mt-3 text-sm text-[var(--text-secondary)]">Skutečné srovnání s trhem zatím nemáme. Nevytváříme medián z prázdných dat.</p>
            )}
            <p className="mt-3 text-xs text-[var(--text-muted)]">
              Zdroj: ukázkový model, ne transakce. Vzorek: 0 prodejů. Datum: ukázka. Metodika: pevná hladina 129 500 Kč/m² jen pro tuto jednu ukázku.
            </p>
            <h3 className="mt-8 font-display text-xl">Srovnatelné nabídky v katalogu</h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{comparables.note}</p>
            {comparables.items.length > 0 ? (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {comparables.items.map((item) => (
                  <li key={item.property.id} className="rounded-2xl border border-[var(--border-default)] p-3">
                    <Link href={catalogPropertyHref(item.property.id)} className="font-medium hover:underline">
                      {item.property.nazev}
                    </Link>
                    <p className="text-sm text-[var(--text-secondary)]">{item.property.lokalita}</p>
                    <p className="mt-2 font-metric">{formatCzk(item.property.cena)}</p>
                    <p className="text-sm">{formatCzk(item.pricePerM2)}/m² · {item.property.plocha_m2} m²</p>
                    <p className="text-sm text-[var(--text-muted)]">
                      {item.deltaPct > 0 ? "+" : ""}
                      {item.deltaPct.toLocaleString("cs-CZ", { maximumFractionDigits: 1 })} % vůči ceně za m² této nabídky
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}
            <h3 className="mt-8 font-display text-xl">Vývoj cen v lokalitě</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Historii cen za m² pro tuto lokalitu nemáme. Graf se doplní, až budou data. Nevymýšlíme křivku trhu.
            </p>
          </section>

          <div className="flex flex-col">
          <section id="investice" className={`scroll-mt-28 mt-10 ${mode === "bydleni" ? "order-4" : "order-1"}`}>
            <h2 className="font-display text-2xl">Scénáře dalšího vývoje</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Jedná se o scénáře, nikoli garantovanou predikci budoucí ceny.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <RateField label="Konzervativní %" value={rates.low} onChange={(value) => setRates({ ...rates, low: value })} />
              <RateField label="Základní %" value={rates.base} onChange={(value) => setRates({ ...rates, base: value })} />
              <RateField label="Optimistický %" value={rates.high} onChange={(value) => setRates({ ...rates, high: value })} />
            </div>
            <div className="mt-4">
              <ScenarioChart
                title="Hodnota při zvoleném základním scénáři"
                summary="Počítáno z dnešní nabídkové ceny a vámi zadaného procenta. Není to odhad trhu."
                source="Scénář, ne predikce"
                unit="Kč"
                data={projectValue(property.cena, Number.isFinite(rates.base) ? rates.base / 100 : 0, 10)}
              />
            </div>

            <h3 className="mt-8 font-display text-xl">Kolik může nemovitost vydělávat?</h3>
            {model ? (
              <>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Modelový odhad</p>
                <p className="mt-1 font-metric text-3xl">{formatCzk(model.monthlyRent)} / měsíc</p>
                <p className="text-sm text-[var(--text-secondary)]">
                  Rozpětí modelu {formatCzk(model.rentLow)} – {formatCzk(model.rentHigh)}. Není to průzkum nájmů.
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Nedostatek dat pro spolehlivý odhad.</p>
            )}

            {model ? (
              <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                <Stat label="Splátka modelu" value={`${formatCzk(model.monthlyPayment)} / měs.`} />
                <Stat label="Hrubý nájem" value={`${formatCzk(model.monthlyRent)} / měs.`} />
                <Stat label="Čistý provozní příjem" value={`${formatCzk(model.noi)} / rok`} />
                <Stat label="Měsíční cash-flow" value={formatCzk(model.monthlyCashFlow, { signed: true })} />
                <Stat label="Roční cash-flow" value={formatCzk(model.annualCashFlow, { signed: true })} />
                <Stat label="Hrubý výnos" value={`${model.grossYieldPct.toLocaleString("cs-CZ", { maximumFractionDigits: 2 })} %`} />
                <Stat label="Výnos z celkové investice" value={`${model.netYieldPct.toLocaleString("cs-CZ", { maximumFractionDigits: 2 })} %`} />
                <Stat label="Cash-on-cash" value={model.cashOnCashPct == null ? "Nelze" : `${model.cashOnCashPct.toLocaleString("cs-CZ", { maximumFractionDigits: 2 })} %`} />
                <Stat label="Vlastní zdroje v modelu" value={formatCzk(model.equity)} />
              </dl>
            ) : null}
            <p className="mt-3 text-xs text-[var(--text-muted)]">
              Výnos počítá společný modul dlouhodobého pronájmu. Daň z příjmu v něm není. Úrok modelu je 4,9 %, splatnost 30 let, obsazenost 95 %, provoz 3 000 Kč měsíčně, rezerva 1 000 Kč měsíčně, pořízení navíc 100 000 Kč.
            </p>
          </section>

          <section id="financovani" className={`scroll-mt-28 mt-10 ${mode === "bydleni" ? "order-1" : "order-2"}`}>
            <h2 className="font-display text-2xl">Jak můžete tuto nemovitost financovat</h2>
            {sale ? (
              <FinancingSummary
                propertyPriceCzk={property.cena}
                propertyUrl={propertyUrl}
                variant="section"
                sourceContext="property_detail"
                calculatorHref={financingHref}
              />
            ) : (
              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                U pronájmu nezobrazujeme model hypotéky. Pro koupi podobné nemovitosti použijte kalkulačku financování.
              </p>
            )}
          </section>

          <section className={`mt-10 ${mode === "bydleni" ? "order-3" : "order-4"}`}>
            <h2 className="font-display text-2xl">Odhad nákladů na rekonstrukci</h2>
            <p className="mt-2 text-xs text-[var(--text-muted)]">Model podle plochy. Není to položkový rozpočet této nemovitosti.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {bands.map((band) => (
                <button
                  key={band.id}
                  type="button"
                  onClick={() => setRenovation(band.id)}
                  className={`rounded-full border px-3 py-1.5 text-sm ${renovation === band.id ? "border-[var(--action-primary)] bg-[var(--action-primary)] text-[var(--text-inverse)]" : "border-[var(--border-default)]"}`}
                >
                  {band.label}
                </button>
              ))}
            </div>
            {selectedBand && selectedBand.id !== "zadna" ? (
              <p className="mt-3 text-sm">
                {selectedBand.label}: {formatCzk(selectedBand.low)} – {formatCzk(selectedBand.high)}
              </p>
            ) : (
              <p className="mt-3 text-sm">Bez rekonstrukce v modelu.</p>
            )}
            <p className="mt-2 font-medium">Celkové prostředky po zvolené rekonstrukci: {formatCzk(invested)}</p>
            <p className="text-xs text-[var(--text-muted)]">
              {model
                ? "Součet nabídkové ceny, středu zvoleného pásma a modelových 100 000 Kč vedlejších nákladů."
                : "Součet nabídkové ceny a středu zvoleného pásma. Vedlejší náklady tu nejsou, proto je nepřičítáme."}
            </p>
          </section>

          <section className={`mt-10 ${mode === "bydleni" ? "order-2" : "order-3"}`}>
            <h2 className="font-display text-2xl">Kolik vás nemovitost bude stát měsíčně?</h2>
            <dl className="mt-3 divide-y divide-[var(--border-default)] border-y border-[var(--border-default)]">
              <Row label="Hypotéka" value={model ? `${formatCzk(model.monthlyPayment)} / měs.` : VERIFY_LABEL} />
              <Row label="Provoz vlastníka v modelu" value={model ? `${formatCzk(model.ownerOpexMonthly)} / měs.` : VERIFY_LABEL} />
              <Row label="Rezerva" value={model ? `${formatCzk(model.reserveMonthly)} / měs.` : VERIFY_LABEL} />
              <Row label="Energie" value={VERIFY_LABEL} />
              <Row label="Voda" value={VERIFY_LABEL} />
              <Row label="Parkování" value={VERIFY_LABEL} />
            </dl>
            {model ? (
              <p className="mt-3 font-medium">
                Náklady vlastníka v modelu: {formatCzk(model.monthlyPayment + model.ownerOpexMonthly + model.reserveMonthly)} / měs.
              </p>
            ) : null}
            <p className="mt-1 text-xs text-[var(--text-muted)]">Náklady nájemníka (energie, služby v nájmu) ukázka neuvádí. Nula by znamenala, že jsou nulové, a to nevíme.</p>
          </section>
          </div>

          <LocationSection property={property} />

          <section className="mt-10">
            <h2 className="font-display text-2xl">Kvalita lokality, poptávka a likvidita</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Data připravujeme. Skóre dostupnosti, hluku, nájemní poptávky ani doby prodeje nevymýšlíme.</p>
          </section>

          <section id="rizika" className="scroll-mt-28 mt-10">
            <h2 className="font-display text-2xl">Na co si dát pozor</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              <Risk title="Cena" level="Nelze určit z trhu" text={model ? "Rozdíl je jen proti modelové hladině, ne proti prodaným bytům." : "Chybí srovnání s trhem."} />
              <Risk title="Cash-flow" level={model && model.monthlyCashFlow < 0 ? "Střední v modelu" : VERIFY_LABEL} text={model ? "Při modelovém financování a nájmu vyjde cash-flow po rezervě záporné nebo kladné podle čísel výše." : "Bez nájmu a úvěru cash-flow nepočítáme."} />
              <Risk title="SVJ" level="Nutno ověřit" text="Chybí informace o fondu oprav a plánovaných opravách." />
              <Risk title="Energetika" level="Nutno ověřit" text="Chybí PENB. Chybějící údaj není energetická třída G." />
            </ul>
          </section>

          <CatalogAnalysisOffer property={property} sale={sale} />

          <div className="mt-10">
            <PrePurchaseChecklist />
          </div>

          <section className="pd-analysis-cta">
            <h2>Než koupíte, podívejte se na čísla.</h2>
            <p>
              Spočítejte výnos, cash flow nebo financování — nebo poptajte podrobnější
              analýzu konkrétní nemovitosti.
            </p>
            <div className="pd-actions">
              <Link href="/kalkulacky/investicni-vynos" className="pd-cta">
                Spočítat investiční scénář
              </Link>
              <Link href="/sluzby/analyza-pred-koupi#poptavka" className="pd-cta-outline">
                Objednat podrobnou analýzu
              </Link>
            </div>
          </section>

          <section id="dokumenty" className="scroll-mt-28 mt-10">
            <h2 className="font-display text-2xl">Dokumenty k nemovitosti</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {["Půdorys", "PENB", "List vlastnictví", "Evidenční list", "Dokumenty SVJ", "Prohlášení vlastníka"].map((name) => (
                <li key={name} className="rounded-xl border border-[var(--border-default)] px-3 py-3 text-sm">
                  <span className="font-medium">{name}</span>
                  <p className="text-[var(--text-muted)]">Dokument zatím nebyl nahrán</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="font-display text-2xl">Historie nabídky</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">U ukázky nemáme datum vložení ani předchozí cenu. Graf ceny inzerátu proto neukazujeme.</p>
          </section>

          <section className="mt-10">
            <h2 className="font-display text-2xl">Prodejce</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Ukázka prezentace. Není tu ověřený makléř, telefon ani počet dalších nabídek. Živý inzerát tyto údaje bere z účtu inzerenta.
            </p>
            <Link href="/pridat-nemovitost" className="mt-3 inline-flex text-sm font-medium underline">
              Přidat vlastní nemovitost
            </Link>
          </section>

          <section className="mt-10">
            <h2 className="font-display text-2xl">Podobné nemovitosti</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{comparables.note}</p>
            {comparables.items.length > 0 ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {comparables.items.slice(0, 4).map((item) => (
                  <PropertyCard key={item.property.id} property={item.property} />
                ))}
              </div>
            ) : null}
          </section>

          <CompareTable ids={compare} />

          <CatalogViewingChecklist />

          {sale ? (
            <details className="mt-8 rounded-2xl border border-[var(--border-default)] p-4">
              <summary className="cursor-pointer font-medium">Další možnosti koupě</summary>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Cenový návrh a společná koupě nejsou hlavní cesta. U ukázky se nic neukládá a nikomu se neposílá.
              </p>
              <DemoNegotiationForms
                askingPrice={property.cena}
                allowPriceOffers={property.prijima_cenove_navrhy === true}
                allowSeekPartner={property.spolecna_koupe_a === true}
                allowSellerRetains={property.spolecna_koupe_b === true}
              />
            </details>
          ) : null}

          <section className="mt-12 rounded-2xl border border-[var(--border-default)] p-5">
            <h2 className="font-display text-2xl">Zajímá vás tato nemovitost?</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/kontakt" className={CTA}>
                Napsat na kontakt
              </Link>
              <Link href={financingHref} className="rounded-full border border-[var(--border-default)] px-4 py-3 text-sm font-semibold">
                Spočítat financování
              </Link>
              <button type="button" onClick={toggleCompare} className="rounded-full border border-[var(--border-default)] px-4 py-3 text-sm">
                Přidat do porovnání
              </button>
            </div>
          </section>
        </div>

        <aside className="hidden lg:sticky lg:top-24 lg:block">
          <div className="pd-sticky-panel">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--pd-muted,#667a86)]">Ukázka prezentace</p>
            <p className="pd-price mt-2">{price}</p>
            {perM2 != null && sale ? <p className="text-sm text-[var(--pd-muted,#667a86)]">{formatCzk(perM2)}/m²</p> : null}
            {sale ? (
              <FinancingSummary
                propertyPriceCzk={property.cena}
                propertyUrl={propertyUrl}
                variant="compact"
                sourceContext="property_detail"
              />
            ) : null}
            <p className="mt-3 text-sm text-[var(--pd-muted,#667a86)]">
              {property.dispozice ? `${property.dispozice} · ` : ""}
              {area}
            </p>
            <Link href="/kontakt" className={`mt-4 w-full ${CTA}`}>
              Mám zájem
            </Link>
            <button type="button" onClick={toggleSave} className={`mt-2 w-full ${CTA_OUTLINE}`}>
              {saved ? "Uloženo" : "Uložit"}
            </button>
            <Link href="/kalkulacky/investicni-vynos" className={`mt-2 w-full ${CTA_OUTLINE}`}>
              Analyzovat tuto nemovitost
            </Link>
            <p className="mt-3 text-xs text-[var(--pd-muted,#667a86)]">
              Ukázka nemá živého makléře ani telefon. Prohlídku u této nabídky nelze domluvit.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <TextButton onClick={() => void share()}>{shared ? "Zkopírováno" : "Sdílet"}</TextButton>
              <TextButton onClick={toggleCompare}>Porovnat</TextButton>
            </div>
            <p className="mt-3 text-xs text-[var(--pd-muted,#667a86)]">Uložení je jen v tomto prohlížeči, ne v účtu.</p>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--pd-border,#dde5e7)] bg-[var(--pd-card,#fff)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="mx-auto flex max-w-[1440px] gap-2">
          <Link href="/kontakt" className={`flex-1 ${CTA_OUTLINE}`}>
            Kontakt
          </Link>
          <Link href="/cenik" className={`flex-1 ${CTA}`}>
            Ceník
          </Link>
        </div>
      </div>
      <div className="h-20 lg:hidden" aria-hidden />

      {compare.length > 0 ? (
        <div className="fixed bottom-20 left-1/2 z-40 -translate-x-1/2 rounded-full border border-[var(--pd-border,#dde5e7)] bg-[var(--pd-card,#fff)] px-4 py-2 text-sm shadow-sm lg:bottom-6">
          Porovnáváte {compare.length} {compare.length === 1 ? "nemovitost" : compare.length < 5 ? "nemovitosti" : "nemovitostí"}
          <a href="#porovnani" className="ml-3 font-semibold underline">Porovnat</a>
        </div>
      ) : null}
    </Container>
    </div>
  );
}

function CompareTable({ ids }: { ids: number[] }) {
  const selected = mockProperties.filter((item) => ids.includes(item.id));
  if (selected.length < 2) return null;
  const models = selected.map((item) => buildModelDecision(item));
  const money = (value: number | null | undefined) => (value == null ? VERIFY_LABEL : formatCzk(value));
  const pct = (value: number | null | undefined) =>
    value == null ? VERIFY_LABEL : `${value.toLocaleString("cs-CZ", { maximumFractionDigits: 2 })} %`;
  return (
    <section id="porovnani" className="scroll-mt-28 mt-10">
      <h2 className="font-display text-2xl">Porovnání</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-[36rem] w-full text-left text-sm">
          <thead>
            <tr>
              <th className="p-2" />
              {selected.map((item) => (
                <th key={item.id} className="p-2 font-medium">{item.nazev}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <CompareRow label="Cena" values={selected.map((item) => formatCzk(item.cena))} />
            <CompareRow label="Kč/m²" values={selected.map((item) => {
              const value = pricePerSquareMetre(item.cena, item.plocha_m2);
              return value == null ? VERIFY_LABEL : formatCzk(value);
            })} />
            <CompareRow label="Plocha" values={selected.map((item) => `${item.plocha_m2} m²`)} />
            <CompareRow label="Dispozice" values={selected.map((item) => item.dispozice ?? VERIFY_LABEL)} />
            <CompareRow label="Lokalita" values={selected.map((item) => item.lokalita)} />
            <CompareRow label="Stav" values={selected.map((item) => TECHNICAL_CONDITION_LABEL[item.technicky_stav])} />
            <CompareRow label="Hypotéka v modelu" values={models.map((item) => money(item?.monthlyPayment))} />
            <CompareRow label="Nájem v modelu" values={models.map((item) => money(item?.monthlyRent))} />
            <CompareRow label="Hrubý výnos" values={models.map((item) => pct(item?.grossYieldPct))} />
            <CompareRow label="Čistý výnos" values={models.map((item) => pct(item?.netYieldPct))} />
            <CompareRow label="Cash-flow / měs." values={models.map((item) => item ? formatCzk(item.monthlyCashFlow, { signed: true }) : VERIFY_LABEL)} />
            <CompareRow label="Skóre modelu" values={models.map((item) => item ? `${item.score.total} / 100` : VERIFY_LABEL)} />
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-[var(--text-muted)]">Výnos a skóre jsou jen u ukázky s modelem. U ostatních je „Nutno ověřit“, ne nula.</p>
    </section>
  );
}

function ModeSwitch({ mode }: { mode: "bydleni" | "investice" }) {
  const item = (active: boolean) =>
    `flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-center font-medium ${active ? "bg-[var(--action-primary)] text-[var(--text-inverse)]" : "text-[var(--text-secondary)]"}`;
  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[var(--border-default)] p-1 text-sm" role="tablist" aria-label="Co u nabídky chcete vidět">
        <Link href="?rezim=bydleni" scroll={false} role="tab" aria-selected={mode === "bydleni"} className={item(mode === "bydleni")}>
          <Home className="size-4" aria-hidden />
          Vlastní bydlení
        </Link>
        <Link href="?rezim=investice" scroll={false} role="tab" aria-selected={mode === "investice"} className={item(mode === "investice")}>
          <TrendingUp className="size-4" aria-hidden />
          Investice
        </Link>
      </div>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        {mode === "bydleni"
          ? "Nejdřív splátka, vlastní peníze a měsíční náklady. Výnos je níž."
          : "Nejdřív nájem, výnos a scénáře. Splátka a měsíční náklady jsou níž."}
      </p>
    </div>
  );
}

function MetricGrid({
  property,
  model,
  mode,
  perM2,
}: {
  property: Property;
  model: ReturnType<typeof buildModelDecision>;
  mode: "bydleni" | "investice";
  perM2: number | null;
}) {
  if (!model || perM2 == null) {
    return <p className="mt-6 text-sm text-[var(--text-secondary)]">Hlavní metriky u této ukázky nejsou. Chybí model nájmu a nákladů.</p>;
  }
  const pct = (value: number) => `${value.toLocaleString("cs-CZ", { maximumFractionDigits: 2 })} %`;
  const housing = [
    ["Cena / m²", `${formatCzk(perM2)}/m²`, "Nabídková cena děleno uvedenou plochou."],
    ["Splátka modelu", `${formatCzk(model.monthlyPayment)} / měs.`, "Anuita z modelového úvěru 80 % ceny, 4,9 %, 30 let."],
    ["Vlastní zdroje", formatCzk(model.equity), "20 % ceny plus modelových 100 000 Kč vedlejších nákladů."],
    ["Měsíční provoz", `${formatCzk(model.ownerOpexMonthly)} / měs.`, "Modelový provoz vlastníka, ne vyúčtování SVJ."],
    ["Stav", TECHNICAL_CONDITION_LABEL[property.technicky_stav], "Stav uvedený v ukázce, ne posudek."],
    ["PENB", VERIFY_LABEL, "Energetický průkaz v ukázce není. Chybějící údaj není třída G."],
  ];
  const invest = [
    ["Cena / m²", `${formatCzk(perM2)}/m²`, "Nabídková cena děleno uvedenou plochou."],
    ["Odhad nájmu", `${formatCzk(model.monthlyRent)} / měs.`, "Modelový odhad, ne inzerce nájmů."],
    ["Hrubý výnos", pct(model.grossYieldPct), "Roční nájem děleno kupní cenou."],
    ["Čistý výnos", pct(model.netYieldPct), "Čistý provozní příjem děleno celkovou investicí v modelu."],
    ["Cash-flow", formatCzk(model.monthlyCashFlow, { signed: true }), "Po splátce, provozu a rezervě."],
    ["Cash-on-cash", model.cashOnCashPct == null ? "Nelze" : pct(model.cashOnCashPct), "Roční cash-flow děleno vlastními zdroji v modelu."],
  ];
  const rows = mode === "investice" ? invest : housing;
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map(([label, value, how]) => (
        <div key={label} className="rounded-2xl border border-[var(--border-default)] p-4" title={how}>
          <p className="text-xs text-[var(--text-muted)]">{label}</p>
          <p className="mt-1 font-metric text-xl">{value}</p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">Jak se počítá? {how}</p>
        </div>
      ))}
    </div>
  );
}

function LocationSection({ property }: { property: Property }) {
  const mapSrc = `https://maps.google.com/maps?q=${property.lokalita_gps.lat},${property.lokalita_gps.lng}&hl=cs&z=15&output=embed`;
  return (
    <section id="lokalita" className="scroll-mt-28 mt-10">
      <h2 className="font-display text-2xl">Lokalita</h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">{property.lokalita}</p>
      <iframe title={`Mapa: ${property.lokalita}`} src={mapSrc} className="mt-4 h-64 w-full rounded-2xl border border-[var(--border-default)]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      <h3 className="mt-6 font-medium">Co je v textu ukázky</h3>
      <p className="text-xs text-[var(--text-muted)]">Orientační vzdálenost z katalogu, ne výpočet trasy.</p>
      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
        {property.obcanska_vybavenost.map((item) => {
          const Icon = AMENITY_ICON[item.kategorie];
          return (
            <li key={`${item.kategorie}-${item.nazev}`} className="flex gap-2 text-sm">
              <Icon className="mt-0.5 size-4 text-[var(--text-muted)]" aria-hidden />
              <span>{item.nazev} <span className="text-[var(--text-muted)]">({item.vzdalenost})</span></span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function SectionNav({ active }: { active: string }) {
  return (
    <nav className="mt-4 flex gap-3 overflow-x-auto text-sm" aria-label="Sekce detailu">
      {NAV.map(([id, label]) => (
        <a key={id} href={`#${id}`} className={active === id ? "font-semibold text-[var(--text-primary)]" : "text-[var(--text-muted)]"}>
          {label}
        </a>
      ))}
    </nav>
  );
}

function Chip({ children }: { children: string }) {
  return <li className="pd-chip">{children}</li>;
}
function Badge({ children }: { children: string }) {
  return <span className="rounded-full bg-[var(--pd-teal-soft,#f4fafa)] px-2 py-1 text-xs font-semibold text-[var(--pd-teal-dark,#087d78)]">{children}</span>;
}
function TextButton({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-[6px] border border-[var(--pd-border,#dde5e7)] bg-white px-3 py-1.5 text-sm text-[var(--pd-navy,#0b3550)]">
      {children}
    </button>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-[var(--pd-border,#dde5e7)] bg-white px-3 py-3">
      <dt className="text-xs text-[var(--pd-muted,#667a86)]">{label}</dt>
      <dd className="font-metric text-lg text-[var(--pd-navy,#0b3550)]">{value}</dd>
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-3 py-2 text-sm">
      <dt className="text-[var(--pd-muted,#667a86)]">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
function CatalogAnalysisOffer({
  property,
  sale,
}: {
  property: Property;
  sale: boolean;
}) {
  const typeMap = {
    byt: "APARTMENT",
    dum: "HOUSE",
    pozemek: "LAND",
    komerce: "COMMERCIAL",
  } as const;
  return (
    <div className="mt-10">
      <AnalysisOfferCard
        property={{
          id: String(property.id),
          slug: String(property.id),
          title: property.nazev,
          canonicalUrl: `${getSiteOrigin()}${catalogPropertyHref(property.id)}`,
          locality: property.lokalita,
          askingPrice: property.cena,
          currency: "CZK",
          transactionType: sale ? "SALE" : "RENT",
          propertyType: typeMap[property.typ_nemovitosti],
          isDemo: true,
          layout: property.dispozice,
          usableArea: property.plocha_m2,
        }}
      />
    </div>
  );
}
function Risk({ title, level, text }: { title: string; level: string; text: string }) {
  return (
    <li className="pd-card text-sm">
      <p className="font-medium text-[var(--pd-navy,#0b3550)]">{title}</p>
      <p className="text-xs text-[var(--pd-muted,#667a86)]">{level}</p>
      <p className="mt-1 text-[var(--pd-muted,#667a86)]">{text}</p>
    </li>
  );
}
function RateField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="text-sm">
      {label}
      <input
        type="number"
        step="0.1"
        value={value}
        onChange={(event) => {
          const next = Number(event.target.value);
          onChange(Number.isFinite(next) ? Math.min(30, Math.max(-20, next)) : 0);
        }}
        className="mt-1 w-full rounded-[6px] border border-[var(--pd-border,#dde5e7)] px-3 py-2"
      />
    </label>
  );
}
function CompareRow({ label, values }: { label: string; values: string[] }) {
  return (
    <tr className="border-t border-[var(--pd-border,#dde5e7)]">
      <th className="p-2 font-normal text-[var(--pd-muted,#667a86)]">{label}</th>
      {values.map((value, index) => (
        <td key={`${label}-${index}`} className="p-2">{value}</td>
      ))}
    </tr>
  );
}
