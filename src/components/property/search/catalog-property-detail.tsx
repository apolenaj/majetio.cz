import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/ui/container";
import { formatCzk } from "@/lib/format";
import type { Property } from "@/lib/mock-properties";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<Property["typ_nemovitosti"], string> = {
  byt: "Byt",
  dum: "Dům",
  pozemek: "Pozemek",
  komerce: "Komerční",
};

export function CatalogPropertyDetail({ property }: { property: Property }) {
  const premium = property.stav_inzeratu === "premium";
  const price =
    property.typ_transakce === "pronajem"
      ? `${formatCzk(property.cena)} / měsíc`
      : formatCzk(property.cena);

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

      <Gallery property={property} />

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
          {property.detail_popis.split("\n\n").map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
        <p className="mt-6 text-sm text-[var(--text-muted)]">{property.popis_upravy}</p>
      </section>
    </Container>
  );
}

function Gallery({ property }: { property: Property }) {
  const premium = property.stav_inzeratu === "premium";
  return (
    <div className="mt-6 space-y-1">
      {premium ? (
        <div className="grid gap-1 sm:grid-cols-2">
          <HeroShot
            src={property.obrazky.pred_rekonstrukci}
            alt={`${property.nazev}, stav před úpravou`}
            label="Před rekonstrukcí"
          />
          <HeroShot
            src={property.obrazky.po_rekonstrukci}
            alt={`${property.nazev}, stav po úpravě`}
            label="Po rekonstrukci"
          />
        </div>
      ) : (
        <HeroShot src={property.obrazky.hlavni} alt={property.nazev} label="Hlavní fotka" wide />
      )}
      {property.galerie.length > 0 ? (
        <ul className="grid grid-cols-2 gap-1 sm:grid-cols-4">
          {property.galerie.map((src) => (
            <li key={src} className="aspect-[4/3] overflow-hidden bg-[var(--surface-sunken)]">
              <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function HeroShot({
  src,
  alt,
  label,
  wide = false,
}: {
  src?: string;
  alt: string;
  label: string;
  wide?: boolean;
}) {
  return (
    <figure
      className={cn(
        "relative overflow-hidden bg-[var(--surface-sunken)]",
        wide ? "aspect-video" : "aspect-[4/3]",
      )}
    >
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">
          Fotografie není k dispozici
        </div>
      )}
      <figcaption className="absolute bottom-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-white">
        {label}
      </figcaption>
    </figure>
  );
}

function Param({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] px-4 py-3">
      <dt className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{label}</dt>
      <dd className="mt-1 font-medium text-[var(--text-primary)]">{value}</dd>
    </div>
  );
}
