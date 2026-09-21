import Link from "next/link";
import { Heart, MapPin } from "lucide-react";

import { FINANCING_ASSUMPTIONS, resolveFinancingInputs } from "@/config/financing-assumptions";
import { formatCzk } from "@/lib/format";
import { calculateMortgage } from "@/lib/calculators/mortgage";
import { resolveShortDescription } from "@/domains/listings/negotiations/validate";
import {
  catalogPropertyHref,
  catalogShots,
  TECHNICAL_CONDITION_LABEL,
  type Property,
} from "@/lib/mock-properties";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<Property["typ_nemovitosti"], string> = {
  byt: "Byt",
  dum: "Dům",
  pozemek: "Pozemek",
  komerce: "Komerční",
};

const detailLinkClass =
  "cursor-pointer rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]";

function tagTone(tag: string): "mint" | "blue" | "neutral" {
  const lower = tag.toLowerCase();
  if (lower.includes("výnos") || lower.includes("příjem") || lower.includes("invest")) {
    return "mint";
  }
  if (
    lower.includes("lokalit") ||
    lower.includes("centrum") ||
    lower.includes("cena") ||
    lower.includes("prémi")
  ) {
    return "blue";
  }
  return "neutral";
}

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
  const tags = property.stitky.slice(0, 4);
  const href = catalogPropertyHref(property.id);
  const detailLabel = `Zobrazit detail: ${property.nazev}`;
  const modelPayment =
    property.typ_transakce === "prodej" && property.cena > 0
      ? (() => {
          const resolved = resolveFinancingInputs({ propertyPriceCzk: property.cena });
          if (resolved.loanAmountCzk <= 0) return null;
          return calculateMortgage({
            principal: resolved.loanAmountCzk,
            annualInterestRate: FINANCING_ASSUMPTIONS.referenceMortgageRatePp,
            years: FINANCING_ASSUMPTIONS.defaultTermYears,
          }).monthlyPayment;
        })()
      : null;

  return (
    <article className="property-card-premium flex h-full flex-col overflow-hidden rounded-lg border border-[#DCE5E7] bg-white shadow-[0_1px_2px_rgb(12_53_81/0.04)]">
      <Link
        href={href}
        aria-label={detailLabel}
        className={`property-card-premium-media relative block aspect-[4/3] bg-[var(--surface-sunken)] ${detailLinkClass}`}
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.src} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-[var(--text-muted)]">
            Fotografie není k dispozici
          </div>
        )}
        <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[0.65rem] font-semibold text-white">
          Ilustrační foto
        </span>
        {shots.length > 1 ? (
          <span className="pointer-events-none absolute right-2 bottom-2 rounded-full bg-black/60 px-2 py-0.5 text-[0.65rem] font-semibold text-white">
            {shots.length} fotek
          </span>
        ) : null}
        <span className="absolute top-3 right-3 inline-flex size-9 items-center justify-center rounded-full bg-white/92 text-[#0C3551] shadow-sm backdrop-blur-sm">
          <Heart className="size-4" aria-hidden />
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-2.5 p-4 sm:p-5">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#667A86]">
          {property.typ_transakce === "pronajem" ? "Pronájem" : "Prodej"}
          {" · "}
          {KIND_LABEL[property.typ_nemovitosti]}
        </p>

        <div>
          <h3 className="font-display text-[1.0625rem] leading-snug text-[#0C3551] sm:text-lg">
            <Link href={href} className={`line-clamp-2 hover:underline ${detailLinkClass}`}>
              {property.nazev}
            </Link>
          </h3>
          <p className="mt-1 inline-flex max-w-full items-center gap-1 text-sm text-[#667A86]">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{property.lokalita}</span>
          </p>
        </div>

        <p className="whitespace-nowrap font-metric text-[1.25rem] font-semibold text-[#0C3551]">
          {price}
        </p>
        {modelPayment != null ? (
          <p className="hidden text-xs text-[#667A86] sm:block">
            Modelová splátka ≈ {formatCzk(modelPayment)}/měs.
          </p>
        ) : null}
        <p className="text-sm text-[#667A86]">
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
                className={cn(
                  "properties-card-tag",
                  tagTone(tag) === "mint" && "properties-card-tag--mint",
                  tagTone(tag) === "blue" && "properties-card-tag--blue",
                  tagTone(tag) === "neutral" && "properties-card-tag--neutral",
                )}
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}

        <p className="line-clamp-2 text-sm leading-relaxed text-[#667A86]">
          {resolveShortDescription({
            title: property.nazev,
            description: property.detail_popis,
          }) ?? "Krátký popis není uveden."}
        </p>

        <Link
          href={href}
          className={`mt-auto inline-flex text-sm font-medium text-[#0C3551] underline underline-offset-2 ${detailLinkClass}`}
        >
          Zobrazit detail
        </Link>
      </div>
    </article>
  );
}
