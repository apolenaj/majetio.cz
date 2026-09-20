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
  compact = false,
}: {
  study: CaseStudyComputed;
  priority?: boolean;
  /** Homepage teaser — smaller image, one benefit line, link to detail. */
  compact?: boolean;
}) {
  const { definition, base } = study;

  if (compact) {
    return (
      <article className="flex h-full overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface-primary)]">
        <Link
          href={`/ukazky/${definition.slug}`}
          className="group flex w-full flex-col sm:flex-row"
        >
          <div className="relative aspect-[16/10] shrink-0 bg-[var(--surface-sunken)] sm:aspect-auto sm:w-[42%] sm:min-h-[148px]">
            <Image
              src={definition.heroImage.src}
              alt={definition.heroImage.alt}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              sizes="(max-width: 640px) 100vw, 20vw"
              priority={priority}
            />
          </div>
          <div className="flex flex-1 flex-col justify-center gap-1.5 p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--action-accent)]">
              Modelová studie
            </p>
            <h3 className="font-display text-lg leading-snug text-[var(--text-primary)] group-hover:text-[var(--action-accent)]">
              {definition.shortTitle}
            </h3>
            <p className="line-clamp-2 text-sm text-[var(--text-secondary)]">
              {definition.purposeLabel}
            </p>
            <span className="mt-1 text-sm font-medium text-[var(--action-accent)] underline-offset-2 group-hover:underline">
              Zobrazit analýzu
            </span>
          </div>
        </Link>
      </article>
    );
  }

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
          Modelová studie
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
            <dt className="text-[var(--text-muted)]">Hrubý nájemní výnos</dt>
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
