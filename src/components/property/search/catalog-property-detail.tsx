import Link from "next/link";
import { ArrowLeft, Bus, HeartPulse, School, ShoppingCart } from "lucide-react";

import { CatalogInvestmentPanel } from "@/components/property/search/catalog-investment-panel";
import { CatalogPhotoGallery } from "@/components/property/search/catalog-photo-gallery";
import { PropertyCard } from "@/components/property/search/catalog-property-card";
import { Container } from "@/components/ui/container";
import { formatCzk } from "@/lib/format";
import {
  catalogPropertyHref,
  catalogShots,
  mockProperties,
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
  const pricePerM2 =
    property.plocha_m2 > 0 ? `${formatCzk(property.cena / property.plocha_m2)} / m²` : null;
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(`${property.lokalita_gps.lat},${property.lokalita_gps.lng}`)}&hl=cs&z=15&output=embed`;
  const similar = mockProperties
    .filter((item) => item.id !== property.id && item.typ_nemovitosti === property.typ_nemovitosti)
    .slice(0, 3);

  return (
    <Container className="py-6 sm:py-10">
      <Link
        href="/nemovitosti"
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Zpět na výpis
      </Link>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Ukázkový inzerát · není živá nabídka z trhu
      </p>

      <div className="mt-4 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          <CatalogPhotoGallery shots={catalogShots(property)} />
          <header className="mt-6">
            <h1 className="font-display text-3xl text-[var(--text-primary)] sm:text-4xl">{property.nazev}</h1>
            <p className="mt-1 text-base text-[var(--text-secondary)]">{property.lokalita}</p>
            <p className="mt-3 font-metric text-3xl text-[var(--text-primary)]">{price}</p>
            {pricePerM2 && property.typ_transakce === "prodej" ? (
              <p className="mt-1 text-sm text-[var(--text-muted)]">{pricePerM2} z nabídkové ceny a uvedené plochy</p>
            ) : null}
          </header>

          <section id="parametry" className="mt-8">
            <h2 className="font-display text-2xl text-[var(--text-primary)]">Parametry</h2>
            <dl className="mt-3 divide-y divide-[var(--border-default)] border-y border-[var(--border-default)]">
              <Row label="Transakce" value={property.typ_transakce === "pronajem" ? "Pronájem" : "Prodej"} />
              <Row label="Typ" value={KIND_LABEL[property.typ_nemovitosti]} />
              <Row label="Dispozice" value={property.dispozice ?? "Neuvedeno"} />
              <Row label="Plocha" value={`${new Intl.NumberFormat("cs-CZ").format(property.plocha_m2)} m²`} />
              <Row label="Technický stav" value={TECHNICAL_CONDITION_LABEL[property.technicky_stav]} />
              <Row
                label="Prezentace"
                value={property.stav_inzeratu === "premium" ? "Premium prezentace" : "Základní prezentace"}
              />
              <Row label="PENB" value="Neuvedeno" />
              <Row label="Stav nabídky" value="Ukázka, není publikovaná na trhu" />
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
              className="mt-4 h-72 w-full rounded-2xl border border-[var(--border-default)]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <h3 className="mt-6 font-display text-xl text-[var(--text-primary)]">Občanská vybavenost</h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Orientační texty ukázkového katalogu. Není to trasa z routingu ani ověřená vzdálenost.
            </p>
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

          {similar.length > 0 ? (
            <section className="mt-12">
              <h2 className="font-display text-2xl text-[var(--text-primary)]">Podobné ukázky</h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Stejný typ v ukázkovém katalogu, ne srovnání trhu.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {similar.map((item) => (
                  <Link key={item.id} href={catalogPropertyHref(item.id)} className="block h-full">
                    <PropertyCard property={item} />
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-5 lg:sticky lg:top-24">
          <p className="font-metric text-2xl text-[var(--text-primary)]">{price}</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{property.lokalita}</p>
          <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
            Ukázka nemá prodejce. Tlačítko nic neodesílá a neexistuje slíbená doba reakce.
          </p>
          <button
            type="button"
            disabled
            className="mt-4 w-full cursor-not-allowed rounded-full bg-slate-900/40 px-4 py-3 text-sm font-semibold text-white"
          >
            Napsat prodejci
          </button>
          <p className="mt-3 text-xs text-[var(--text-muted)]">
            U živé nabídky se poptávka ukládá k inzerátu. Tady by to předstíralo dostupnost nemovitosti.
          </p>
        </aside>
      </div>
    </Container>
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
