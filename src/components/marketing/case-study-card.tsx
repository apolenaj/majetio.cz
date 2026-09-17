import Image from "next/image";
import Link from "next/link";

import {
  formatCzk,
  formatPct,
  formatSignedCzk,
} from "@/components/marketing/format";
import type { CaseStudyComputed } from "@/content/case-studies";
import { cn } from "@/lib/utils";

export function CaseStudyCard({
  study,
  priority = false,
}: {
  study: CaseStudyComputed;
  priority?: boolean;
}) {
  const { definition, base } = study;
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--surface-sunken)]">
        <Image
          src={definition.heroImage.src}
          alt={definition.heroImage.alt}
          width={definition.heroImage.width}
          height={definition.heroImage.height}
          className="h-full w-full object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
          priority={priority}
        />
        <span className="absolute left-3 top-3 rounded-md bg-[var(--surface-inverse)]/85 px-2.5 py-1 text-xs font-medium text-[var(--text-inverse)]">
          Modelová analýza
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
        <div>
          <h3 className="font-display text-xl text-[var(--text-primary)]">
            {definition.shortTitle}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
            {definition.assignment}
          </p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            {definition.heroImage.caption}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-[var(--text-muted)]">Kupní cena</dt>
            <dd className="font-medium text-[var(--text-primary)]">
              {formatCzk(definition.purchasePriceCzk)}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">
              Hrubý nájemní výnos
            </dt>
            <dd className="font-medium text-[var(--text-primary)]">
              {formatPct(base.grossRentalYieldOnPurchasePct)}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">Po neobsazenosti</dt>
            <dd className="font-medium text-[var(--text-primary)]">
              {formatPct(base.yieldAfterVacancyOnTacPct)}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">Cash flow / měs.</dt>
            <dd
              className={cn(
                "font-medium",
                base.monthlyCashFlowCzk < 0
                  ? "text-[var(--action-destructive)]"
                  : "text-[var(--action-accent)]",
              )}
            >
              {formatSignedCzk(base.monthlyCashFlowCzk)}
            </dd>
          </div>
        </dl>
        <Link
          href={`/ukazky/${definition.slug}`}
          className="mt-auto inline-flex h-10 items-center justify-center rounded-lg border border-[var(--border-strong)] px-4 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--background-secondary)]"
        >
          Zobrazit celou analýzu
        </Link>
      </div>
    </article>
  );
}
