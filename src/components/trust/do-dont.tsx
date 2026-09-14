import Link from "next/link";

import { cn } from "@/lib/utils";

type DoDontProps = {
  doItems: readonly string[];
  dontItems: readonly string[];
  className?: string;
};

/**
 * Clear "what we do / don't" — no fake certainty, no fake team bios.
 */
export function DoDontSplit({ doItems, dontItems, className }: DoDontProps) {
  return (
    <div
      className={cn(
        "grid gap-8 md:grid-cols-2 md:gap-10",
        className,
      )}
    >
      <section aria-labelledby="trust-do-heading" className="space-y-3">
        <h2
          id="trust-do-heading"
          className="font-display text-h3 text-[var(--text-primary)]"
        >
          Co děláme
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--text-secondary)]">
          {doItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="trust-dont-heading" className="space-y-3">
        <h2
          id="trust-dont-heading"
          className="font-display text-h3 text-[var(--text-primary)]"
        >
          Co neděláme
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--text-secondary)]">
          {dontItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function CompanyIdentityPlaceholder({
  className,
}: {
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--background-secondary)] p-4 text-sm text-[var(--text-secondary)]",
        className,
      )}
      aria-label="Identita provozovatele"
    >
      <p className="font-medium text-[var(--text-primary)]">Provozovatel</p>
      <dl className="mt-3 space-y-1.5">
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-[var(--text-muted)]">Firma:</dt>
          <dd>[Obchodní firma — doplní právní tým]</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-[var(--text-muted)]">IČO:</dt>
          <dd>[IČO — doplní právní tým]</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-[var(--text-muted)]">DIČ:</dt>
          <dd>[DIČ — doplní právní tým]</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-[var(--text-muted)]">Sídlo:</dt>
          <dd>[Sídlo — doplní právní tým]</dd>
        </div>
      </dl>
      <p className="mt-3 text-[var(--text-caption)] text-[var(--text-muted)]">
        Záměrně neuvádíme fiktivní údaje ani falešné profily týmu. Doplní
        provozovatel před spuštěním produkce.
      </p>
      <p className="mt-2">
        <Link
          href="/kontakt"
          className="font-medium text-[var(--text-link)] underline-offset-2 hover:underline"
        >
          Kontakt
        </Link>
      </p>
    </aside>
  );
}
