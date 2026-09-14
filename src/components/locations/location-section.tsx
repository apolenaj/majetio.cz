import Link from "next/link";

import { DataSource } from "@/components/overlays/tooltip";
import { cn } from "@/lib/utils";
import type { LocationSectionProps } from "@/components/locations/types";

export function LocationSection({
  id,
  title,
  description,
  period,
  methodologyHref,
  children,
  className,
}: LocationSectionProps) {
  return (
    <section id={id} className={cn("scroll-mt-24", className)}>
      <div className="mb-6 border-b border-[var(--border-default)] pb-4">
        <h2 className="font-display text-xl text-[var(--text-primary)] sm:text-2xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm text-[var(--text-secondary)]">
            {description}
          </p>
        ) : null}
        {period ? (
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Období: {period}
            {methodologyHref ? (
              <>
                {" · "}
                <Link
                  href={methodologyHref}
                  className="text-[var(--text-link)] underline-offset-2 hover:underline"
                >
                  Metodika
                </Link>
              </>
            ) : null}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function LocationMethodologyBanner({
  periodLabel,
  source,
  updatedAt,
  methodologyHref,
  isDemo,
}: {
  periodLabel: string;
  source: string;
  updatedAt: string;
  methodologyHref: string;
  isDemo?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[var(--border-default)] bg-[var(--background-secondary)] px-4 py-3 text-sm text-[var(--text-secondary)]">
      <p>
        <strong className="text-[var(--text-primary)]">Období:</strong> {periodLabel}
        {isDemo ? " · Demonstrační dataset pro ověření UX" : null}
      </p>
      <DataSource className="mt-2" source={source} updatedAt={updatedAt} />
      <p className="mt-2">
        <Link
          href={methodologyHref}
          className="text-[var(--text-link)] underline-offset-2 hover:underline"
        >
          Jak počítáme metriky lokality
        </Link>
        {" · "}
        <Link
          href="/metodika/odhad-hodnoty"
          className="text-[var(--text-link)] underline-offset-2 hover:underline"
        >
          Odhad hodnoty
        </Link>
      </p>
    </div>
  );
}
