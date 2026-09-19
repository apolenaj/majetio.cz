import Link from "next/link";
import { ArrowLeft, Bus, HeartPulse, School, ShoppingCart } from "lucide-react";

import {
  CatalogPhotoGallery,
  type CatalogShot,
} from "@/components/property/search/catalog-photo-gallery";
import { Container } from "@/components/ui/container";
import { formatCzk } from "@/lib/format";
import type { AmenityCategory, Property } from "@/lib/mock-properties";
import { cn } from "@/lib/utils";

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

const AMENITY_LABEL: Record<AmenityCategory, string> = {
  education: "Škola",
  shopping: "Obchod",
  transport: "Doprava",
  health: "Zdravotnictví",
};

export function CatalogPropertyDetail({ property }: { property: Property }) {
  const premium = property.stav_inzeratu === "premium";
  const price =
    property.typ_transakce === "pronajem"
      ? `${formatCzk(property.cena)} / měsíc`
      : formatCzk(property.cena);
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(`${property.lokalita_gps.lat},${property.lokalita_gps.lng}`)}&hl=cs&z=15&output=embed`;

  return (
    <Container className="py-8 sm:py-12">
      <Link
        href="/nemovitosti"
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Zpět na výpis
      </Link>

      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Ukázkový inzerát · není živá nabídka z trhu
      </p>

      <CatalogPhotoGallery shots={listingShots(property)} />

      <header className="mt-8 border-b border-[var(--border-default)] pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-[var(--text-primary)] sm:text-4xl">
              {property.nazev}
            </h1>
            <p className="mt-2 text-base text-[var(--text-secondary)]">{property.lokalita}</p>
          </div>
          <p className="font-metric text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
            {price}
          </p>
        </div>
        {property.stitky.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {property.stitky.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-1 text-sm text-[var(--text-secondary)]"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Param label="Transakce" value={property.typ_transakce === "pronajem" ? "Pronájem" : "Prodej"} />
        <Param label="Typ" value={KIND_LABEL[property.typ_nemovitosti]} />
        <Param label="Dispozice" value={property.dispozice ?? "Neuvedeno"} />
        <Param
          label="Plocha"
          value={`${new Intl.NumberFormat("cs-CZ").format(property.plocha_m2)} m²`}
        />
        <Param label="Stav" value={premium ? "Premium — před a po" : "Klasický inzerát"} />
      </dl>

      <section className="mt-10 max-w-3xl">
        <h2 className="font-display text-2xl text-[var(--text-primary)]">Popis</h2>
        <div className="mt-4 space-y-4 text-base leading-relaxed text-[var(--text-secondary)]">
          {property.detail_popis.split(/\n\n+/).map((paragraph) =>
            SECTION_TITLES.has(paragraph.trim()) ? (
              <h3
                key={paragraph}
                className="pt-2 font-display text-xl text-[var(--text-primary)]"
              >
                {paragraph.trim()}
              </h3>
            ) : (
              <p key={paragraph.slice(0, 48)}>{paragraph}</p>
            ),
          )}
        </div>
        <p className="mt-6 text-sm text-[var(--text-muted)]">{property.popis_upravy}</p>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-[var(--text-primary)]">Lokalita na mapě</h2>
        <p className="mt-2 text-base text-[var(--text-secondary)]">{property.lokalita}</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <iframe
            title={`Mapa: ${property.lokalita}`}
            src={mapSrc}
            className="h-72 w-full rounded-2xl border border-[var(--border-default)] bg-[var(--surface-sunken)] lg:h-full lg:min-h-80"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div>
            <h3 className="font-display text-xl text-[var(--text-primary)]">Občanská vybavenost</h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {property.obcanska_vybavenost.map((item) => {
                const Icon = AMENITY_ICON[item.kategorie];
                return (
                  <li
                    key={`${item.kategorie}-${item.nazev}`}
                    className="flex items-start gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-3"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-sunken)] text-[var(--text-primary)]",
                      )}
                    >
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span>
                      <span className="block text-xs uppercase tracking-wide text-[var(--text-muted)]">
                        {AMENITY_LABEL[item.kategorie]}
                      </span>
                      <span className="block font-medium text-[var(--text-primary)]">{item.nazev}</span>
                      <span className="block text-sm text-[var(--text-secondary)]">{item.vzdalenost}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>
    </Container>
  );
}

function listingShots(property: Property): CatalogShot[] {
  const shots: CatalogShot[] = [];
  if (property.stav_inzeratu === "premium") {
    if (property.obrazky.pred_rekonstrukci) {
      shots.push({
        src: property.obrazky.pred_rekonstrukci,
        alt: `${property.nazev}, stav před úpravou`,
        label: "Před rekonstrukcí",
      });
    }
    if (property.obrazky.po_rekonstrukci) {
      shots.push({
        src: property.obrazky.po_rekonstrukci,
        alt: `${property.nazev}, stav po úpravě`,
        label: "Po rekonstrukci",
      });
    }
  } else if (property.obrazky.hlavni) {
    shots.push({
      src: property.obrazky.hlavni,
      alt: property.nazev,
      label: "Hlavní fotka",
    });
  }
  for (const src of property.galerie) {
    if (shots.some((shot) => shot.src.split("?")[0] === src.split("?")[0])) continue;
    shots.push({ src, alt: property.nazev });
  }
  return shots;
}

function Param({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] px-4 py-3">
      <dt className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{label}</dt>
      <dd className="mt-1 font-medium text-[var(--text-primary)]">{value}</dd>
    </div>
  );
}
