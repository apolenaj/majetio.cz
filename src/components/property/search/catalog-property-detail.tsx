import Link from "next/link";
import { ArrowLeft, Bus, HeartPulse, School, ShoppingCart } from "lucide-react";

import { CatalogInvestmentPanel } from "@/components/property/search/catalog-investment-panel";
import { CatalogPhotoGallery } from "@/components/property/search/catalog-photo-gallery";
import { CatalogViewingChecklist } from "@/components/property/search/catalog-viewing-checklist";
import { PropertyCard } from "@/components/property/search/catalog-property-card";
import { Container } from "@/components/ui/container";
import { formatCzk } from "@/lib/format";
import {
  catalogPropertyHref,
  catalogShots,
  findSimilarCatalogProperties,
  TECHNICAL_CONDITION_LABEL,
  type AmenityCategory,
  type Property,
} from "@/lib/mock-properties";

const KIND_LABEL: Record<Property["typ_nemovitosti"], string> = {
  byt: "Byt",
  dum: "Dům",
  pozemek: "Pozemek",
  komerce: "Komerční",
};

const SECTION_TITLES = new Set(["O nemovitosti", "Technický stav", "Potenciál a investice"]);

const AMENITY_ICON: Record<AmenityCategory, typeof School> = {
  education: School,
  shopping: ShoppingCart,
  transport: Bus,
  health: HeartPulse,
};

export function CatalogPropertyDetail({ property }: { property: Property }) {
  const price =
    property.typ_transakce === "pronajem"
      ? `${formatCzk(property.cena)} / měsíc`
      : formatCzk(property.cena);
  const area = `${new Intl.NumberFormat("cs-CZ").format(property.plocha_m2)} m²`;
  const pricePerM2 =
    property.plocha_m2 > 0 && property.typ_transakce === "prodej"
      ? `${formatCzk(property.cena / property.plocha_m2)} / m²`
      : null;
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(`${property.lokalita_gps.lat},${property.lokalita_gps.lng}`)}&hl=cs&z=15&output=embed`;
  const similar = findSimilarCatalogProperties(property, 3);
  const summary = [
    property.typ_transakce === "pronajem" ? "Pronájem" : "Prodej",
    KIND_LABEL[property.typ_nemovitosti],
    property.dispozice,
    area,
    TECHNICAL_CONDITION_LABEL[property.technicky_stav],
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Container className="max-w-[1320px] py-6 sm:py-8">
      <Link
        href="/nemovitosti"
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Zpět na výpis
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[var(--surface-sunken)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          Ukázková nabídka
        </span>
      </div>

      <header className="mt-3">
        <h1 className="font-display text-3xl text-[var(--text-primary)] sm:text-4xl">{property.nazev}</h1>
        <p className="mt-1 text-base text-[var(--text-secondary)]">{property.lokalita}</p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">{summary}</p>
        <p className="mt-3 font-metric text-3xl text-[var(--text-primary)]">{price}</p>
        {pricePerM2 ? (
          <p className="mt-1 text-sm text-[var(--text-muted)]">{pricePerM2}</p>
        ) : null}
      </header>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-8">
        <div>
          <CatalogPhotoGallery shots={catalogShots(property)} />

          <nav className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[var(--text-secondary)]">
            <a href="#parametry" className="hover:text-[var(--text-primary)]">
              Parametry
            </a>
            <a href="#popis" className="hover:text-[var(--text-primary)]">
              Popis
            </a>
            <a href="#investice" className="hover:text-[var(--text-primary)]">
              Náklady
            </a>
            <a href="#lokalita" className="hover:text-[var(--text-primary)]">
              Lokalita
            </a>
          </nav>

          <section id="parametry" className="mt-8">
            <h2 className="font-display text-2xl text-[var(--text-primary)]">Parametry</h2>
            <dl className="mt-3 divide-y divide-[var(--border-default)] border-y border-[var(--border-default)]">
              <Row label="Transakce" value={property.typ_transakce === "pronajem" ? "Pronájem" : "Prodej"} />
              <Row label="Typ" value={KIND_LABEL[property.typ_nemovitosti]} />
              {property.dispozice ? <Row label="Dispozice" value={property.dispozice} /> : null}
              <Row label="Plocha" value={area} />
              <Row label="Technický stav" value={TECHNICAL_CONDITION_LABEL[property.technicky_stav]} />
              {property.konstrukce ? <Row label="Konstrukce" value={property.konstrukce} /> : null}
              {property.vytah != null ? (
                <Row label="Výtah" value={property.vytah ? "Ano" : "Ne"} />
              ) : null}
              <Row label="PENB" value="Neuvedeno" />
            </dl>
          </section>

          <section id="popis" className="mt-10 max-w-3xl">
            <h2 className="font-display text-2xl text-[var(--text-primary)]">Popis</h2>
            <div className="mt-4 space-y-4 text-base leading-relaxed text-[var(--text-secondary)]">
              {property.detail_popis.split(/\n\n+/).map((paragraph) =>
                SECTION_TITLES.has(paragraph.trim()) ? (
                  <h3 key={paragraph} className="pt-2 font-display text-xl text-[var(--text-primary)]">
                    {paragraph.trim()}
                  </h3>
                ) : (
                  <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                ),
              )}
            </div>
          </section>

          <CatalogInvestmentPanel property={property} />

          <section id="lokalita" className="mt-12">
            <h2 className="font-display text-2xl text-[var(--text-primary)]">Lokalita</h2>
            <p className="mt-2 text-base text-[var(--text-secondary)]">{property.lokalita}</p>
            <iframe
              title={`Mapa: ${property.lokalita}`}
              src={mapSrc}
              className="mt-4 h-64 w-full rounded-2xl border border-[var(--border-default)] sm:h-72"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <h3 className="mt-6 font-display text-xl text-[var(--text-primary)]">Občanská vybavenost</h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Orientační vzdálenost</p>
            <ul className="mt-3 grid gap-x-8 sm:grid-cols-2">
              {property.obcanska_vybavenost.map((item) => {
                const Icon = AMENITY_ICON[item.kategorie];
                return (
                  <li
                    key={`${item.kategorie}-${item.nazev}`}
                    className="flex items-baseline gap-2 border-b border-[var(--border-default)] py-2 text-sm"
                  >
                    <Icon className="size-4 shrink-0 text-[var(--text-muted)]" aria-hidden />
                    <span className="text-[var(--text-primary)]">{item.nazev}</span>
                    <span className="text-[var(--text-muted)]">({item.vzdalenost})</span>
                  </li>
                );
              })}
            </ul>
          </section>

          <CatalogViewingChecklist />

          <section className="mt-12">
            <h2 className="font-display text-2xl text-[var(--text-primary)]">Podobné nabídky</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{similar.note}</p>
            {similar.items.length > 0 ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {similar.items.map((item) => (
                  <Link key={item.id} href={catalogPropertyHref(item.id)} className="block h-full">
                    <PropertyCard property={item} />
                  </Link>
                ))}
              </div>
            ) : null}
          </section>
        </div>

        <aside className="hidden rounded-2xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-5 lg:sticky lg:top-24 lg:block">
          <DemoContactCard price={price} />
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border-default)] bg-[var(--surface-primary)]/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <DemoContactCard price={price} compact />
      </div>
      <div className="h-24 lg:hidden" aria-hidden />
    </Container>
  );
}

function DemoContactCard({ price, compact = false }: { price: string; compact?: boolean }) {
  return (
    <div className={compact ? "flex items-center gap-3" : undefined}>
      {!compact ? (
        <>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Ukázka prezentace
          </p>
          <p className="mt-2 font-metric text-2xl text-[var(--text-primary)]">{price}</p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
            Takto může vypadat váš inzerát na Majetiu — přehledně, s parametry a propočtem nákladů.
          </p>
        </>
      ) : (
        <p className="min-w-0 flex-1 font-metric text-lg text-[var(--text-primary)]">{price}</p>
      )}
      <Link
        href="/pridat-nemovitost"
        className={
          compact
            ? "shrink-0 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
            : "mt-4 block w-full rounded-full bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white"
        }
      >
        Přidat vlastní nemovitost
      </Link>
      {!compact ? (
        <Link
          href="/nemovitosti"
          className="mt-3 block w-full rounded-full border border-[var(--border-default)] px-4 py-3 text-center text-sm font-medium text-[var(--text-primary)]"
        >
          Prohlédnout nabídky
        </Link>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[9rem_minmax(0,1fr)] gap-3 py-3 text-sm sm:grid-cols-[12rem_minmax(0,1fr)]">
      <dt className="text-[var(--text-muted)]">{label}</dt>
      <dd className="font-medium text-[var(--text-primary)]">{value}</dd>
    </div>
  );
}
