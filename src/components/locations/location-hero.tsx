import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { STRATEGIES } from "@/config/navigation";
import type { LocationHeroProps } from "@/components/locations/types";

export function LocationHero({
  name,
  hierarchyLabel,
  summary,
  periodLabel,
  isDemo,
  strategySlugs = [],
}: LocationHeroProps) {
  const strategies = STRATEGIES.filter((s) => strategySlugs.includes(s.slug));

  return (
    <header className="relative overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-6 sm:p-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-sm text-[var(--text-muted)]">{hierarchyLabel}</p>
          <h1 className="mt-1 font-display text-3xl text-[var(--text-primary)] sm:text-4xl">
            {name}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[var(--text-secondary)]">
            {summary}
          </p>
          <p className="mt-3 text-xs text-[var(--text-muted)]">Období dat: {periodLabel}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {isDemo ? <Badge tone="warning">Demo data</Badge> : <Badge tone="premium">Tržní profil</Badge>}
          <ButtonLink href="#dostupne-nemovitosti" size="sm">
            Nemovitosti v lokalitě
          </ButtonLink>
        </div>
      </div>

      {strategies.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-2">
          <span className="text-xs text-[var(--text-muted)]">Vhodné strategie:</span>
          {strategies.map((s) => (
            <Link
              key={s.slug}
              href={`/strategie/${s.slug}`}
              className="rounded-full border border-[var(--border-default)] px-3 py-1 text-xs text-[var(--text-link)] hover:bg-[var(--background-secondary)]"
            >
              {s.title}
            </Link>
          ))}
        </div>
      ) : null}

      <nav className="mt-8 flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {[
          ["#prehled-trhu", "Přehled"],
          ["#ceny-najmy", "Ceny a nájmy"],
          ["#nabidka-poptavka", "Nabídka a poptávka"],
          ["#investice", "Investice"],
          ["#doprava", "Doprava"],
          ["#vystavba", "Výstavba"],
          ["#rizika", "Rizika"],
          ["#dostupne-nemovitosti", "Nemovitosti"],
        ].map(([href, label]) => (
          <a
            key={href}
            href={href}
            className="text-[var(--text-link)] underline-offset-2 hover:underline"
          >
            {label}
          </a>
        ))}
      </nav>
    </header>
  );
}
