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
 * Premium a klasický inzerát se liší rámečkem, podkladem a odznakem.
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
        "flex h-full flex-col rounded-2xl border p-5",
        premium
          ? "border-[var(--action-accent)] bg-[color-mix(in_srgb,var(--action-accent)_8%,var(--surface-primary))] shadow-sm"
          : "border-dashed border-[var(--border-default)] bg-[var(--background-secondary)]",
      )}
    >
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
    </article>
  );
}
