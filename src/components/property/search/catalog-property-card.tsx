import Link from "next/link";

import { formatCzk } from "@/lib/format";
import { resolveShortDescription } from "@/domains/listings/negotiations/validate";
import {
  catalogPropertyHref,
  catalogShots,
  publicListingTags,
  TECHNICAL_CONDITION_LABEL,
  type Property,
} from "@/lib/mock-properties";

const KIND_LABEL: Record<Property["typ_nemovitosti"], string> = {
  byt: "Byt",
  dum: "Dům",
  pozemek: "Pozemek",
  komerce: "Komerční",
};

const detailLinkClass =
  "cursor-pointer rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]";

/**
 * Karta ukázkového katalogu. Fotky jsou ilustrační.
 */
export function PropertyCard({ property }: { property: Property }) {
  const price =
    property.typ_transakce === "pronajem"
      ? `${formatCzk(property.cena)}/měs.`
      : formatCzk(property.cena);
  const shots = catalogShots(property);
  const cover = shots[0];
  const tags = publicListingTags(property.stitky);
  const href = catalogPropertyHref(property.id);
  const detailLabel = `Zobrazit detail: ${property.nazev}`;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--surface-primary)]">
      <Link
        href={href}
        aria-label={detailLabel}
        className={`relative block aspect-[4/3] bg-[var(--surface-sunken)] ${detailLinkClass}`}
      >
        {cover ? (
          <img src={cover.src} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-[var(--text-muted)]">
            Fotografie není k dispozici
          </div>
        )}
        <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[0.65rem] font-semibold text-white">
          Ilustrační
        </span>
        {shots.length > 1 ? (
          <span className="pointer-events-none absolute right-2 bottom-2 rounded-full bg-black/60 px-2 py-0.5 text-[0.65rem] font-semibold text-white">
            {shots.length} fotek
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
          {property.typ_transakce === "pronajem" ? "Pronájem" : "Prodej"}
          {" · "}
          {KIND_LABEL[property.typ_nemovitosti]}
        </p>

        <div>
          <h3 className="min-h-[2.75rem] font-display text-lg leading-snug text-[var(--text-primary)]">
            <Link href={href} className={`line-clamp-2 hover:underline ${detailLinkClass}`}>
              {property.nazev}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{property.lokalita}</p>
        </div>

        <p className="whitespace-nowrap font-metric text-xl font-medium text-[var(--text-primary)]">{price}</p>
        <p className="text-sm text-[var(--text-secondary)]">
          {property.dispozice ? `${property.dispozice} · ` : null}
          {new Intl.NumberFormat("cs-CZ").format(property.plocha_m2)} m²
          {" · "}
          {TECHNICAL_CONDITION_LABEL[property.technicky_stav]}
        </p>

        {tags.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full bg-[var(--surface-sunken)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)]"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}

        <p className="line-clamp-3 min-h-[3.75rem] text-sm leading-relaxed text-[var(--text-secondary)]">
          {resolveShortDescription({
            title: property.nazev,
            description: property.detail_popis,
          }) ?? "Krátký popis není uveden."}
        </p>

        {property.konstrukce || property.vytah != null ? (
          <p className="text-xs text-[var(--text-secondary)]">
            {[
              property.konstrukce,
              property.vytah === true ? "Výtah" : property.vytah === false ? "Bez výtahu" : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        ) : null}

        {property.prijima_cenove_navrhy || property.spolecna_koupe_a || property.spolecna_koupe_b ? (
          <ul className="flex flex-wrap gap-1.5">
            {property.prijima_cenove_navrhy ? (
              <li className="rounded-full bg-[var(--surface-sunken)] px-2.5 py-1 text-xs text-[var(--text-secondary)]">
                Přijímá cenové návrhy
              </li>
            ) : null}
            {property.spolecna_koupe_a || property.spolecna_koupe_b ? (
              <li className="rounded-full bg-[var(--surface-sunken)] px-2.5 py-1 text-xs text-[var(--text-secondary)]">
                Možnost jednat o společné koupi
              </li>
            ) : null}
          </ul>
        ) : null}

        <Link
          href={href}
          className={`mt-auto inline-flex text-sm font-medium text-[var(--text-primary)] underline underline-offset-2 ${detailLinkClass}`}
        >
          Zobrazit detail
        </Link>
      </div>
    </article>
  );
}
