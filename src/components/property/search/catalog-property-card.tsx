import { Images } from "lucide-react";

import { formatCzk } from "@/lib/format";
import type { Property } from "@/lib/mock-properties";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<Property["typ_nemovitosti"], string> = {
  byt: "Byt",
  dum: "Dům",
  pozemek: "Pozemek",
  komerce: "Komerční",
};

/**
 * Karta ukázkového katalogu.
 * Klasický inzerát má jednu fotku, premium srovnání před a po.
 */
export function PropertyCard({ property }: { property: Property }) {
  const premium = property.stav_inzeratu === "premium";
  const price =
    property.typ_transakce === "pronajem"
      ? `${formatCzk(property.cena)}/měs.`
      : formatCzk(property.cena);

  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl border",
        premium
          ? "border-[var(--action-accent)] bg-[color-mix(in_srgb,var(--action-accent)_8%,var(--surface-primary))] shadow-sm"
          : "border-dashed border-[var(--border-default)] bg-[var(--background-secondary)]",
      )}
    >
      {premium ? <PremiumPhotos property={property} /> : <ClassicPhoto property={property} />}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            {property.typ_transakce === "pronajem" ? "Pronájem" : "Prodej"}
            {" · "}
            {KIND_LABEL[property.typ_nemovitosti]}
          </p>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide",
              premium
                ? "bg-slate-900 text-white"
                : "bg-[var(--surface-primary)] text-[var(--text-muted)]",
            )}
          >
            {premium ? "Premium" : "Klasický"}
          </span>
        </div>

        <h3 className="mt-3 font-display text-lg leading-snug text-[var(--text-primary)]">
          {property.nazev}
        </h3>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{property.lokalita}</p>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-[var(--text-caption)] text-[var(--text-muted)]">Cena</dt>
            <dd className="font-metric font-medium text-[var(--text-primary)]">{price}</dd>
          </div>
          <div>
            <dt className="text-[var(--text-caption)] text-[var(--text-muted)]">Plocha</dt>
            <dd className="font-metric font-medium">
              {new Intl.NumberFormat("cs-CZ").format(property.plocha_m2)} m²
            </dd>
          </div>
          {property.dispozice ? (
            <div>
              <dt className="text-[var(--text-caption)] text-[var(--text-muted)]">Dispozice</dt>
              <dd>{property.dispozice}</dd>
            </div>
          ) : null}
        </dl>

        {property.stitky.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {property.stitky.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-[var(--border-default)] bg-[var(--surface-primary)] px-2 py-0.5 text-xs text-[var(--text-secondary)]"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}

        <p
          className={cn(
            "mt-4 text-sm leading-relaxed",
            premium ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]",
          )}
        >
          {property.popis_upravy}
        </p>
      </div>
    </article>
  );
}

function ClassicPhoto({ property }: { property: Property }) {
  return (
    <div className="relative aspect-video bg-[var(--surface-sunken)]">
      {property.obrazky.hlavni ? (
        <img
          src={property.obrazky.hlavni}
          alt={property.nazev}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <PhotoFallback label="Fotografie není k dispozici" />
      )}
    </div>
  );
}

function PremiumPhotos({ property }: { property: Property }) {
  const wow = property.obrazky.pocet_wow_fotek;
  return (
    <div className="relative grid aspect-video grid-cols-2 gap-px bg-[var(--border-default)]">
      <CompareShot src={property.obrazky.pred_rekonstrukci} label="Před rekonstrukcí" alt={`${property.nazev} před úpravou`} />
      <CompareShot
        src={property.obrazky.po_rekonstrukci}
        label="Po rekonstrukci"
        alt={`${property.nazev} po úpravě`}
        crowded={wow != null}
      />
      {wow != null ? (
        <span className="absolute bottom-2 right-2 z-10 inline-flex max-w-[calc(50%-0.75rem)] items-center gap-1 rounded-lg bg-white px-2 py-1 text-[0.65rem] font-semibold text-slate-900 shadow-md">
          <Images className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">+{wow} wow fotek</span>
        </span>
      ) : null}
    </div>
  );
}

function CompareShot({
  src,
  label,
  alt,
  crowded = false,
}: {
  src?: string;
  label: string;
  alt: string;
  /** Leave room for the gallery badge in the bottom-right corner. */
  crowded?: boolean;
}) {
  return (
    <div className="relative min-w-0 overflow-hidden bg-[var(--surface-sunken)]">
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <PhotoFallback label="Bez fotky" />
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/75 to-transparent" />
      <span
        className={cn(
          "pointer-events-none absolute bottom-2 max-w-[calc(100%-0.75rem)] truncate rounded-full bg-black/55 px-2 py-0.5 text-center text-[0.58rem] font-bold uppercase tracking-wide text-white sm:text-[0.65rem]",
          crowded
            ? "left-2 max-w-[calc(100%-5.75rem)]"
            : "left-1/2 -translate-x-1/2",
        )}
      >
        {label}
      </span>
    </div>
  );
}

function PhotoFallback({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center px-3 text-center text-xs text-[var(--text-muted)]">
      {label}
    </div>
  );
}
