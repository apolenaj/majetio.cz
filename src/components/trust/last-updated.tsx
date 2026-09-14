import { Clock, History } from "lucide-react";

import { cn } from "@/lib/utils";

export type LastUpdatedProps = {
  /** ISO string or Date of last successful update / observation. */
  at: string | Date | null | undefined;
  /**
   * Age in days after which we show an explicit stale label.
   * Default 30 days.
   */
  staleAfterDays?: number;
  /** Override computed staleness. */
  forceStale?: boolean;
  label?: string;
  staleLabel?: string;
  className?: string;
  locale?: string;
};

function toDate(at: string | Date | null | undefined): Date | null {
  if (at == null) return null;
  if (at instanceof Date) {
    return Number.isNaN(at.getTime()) ? null : at;
  }
  const d = new Date(at);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isStaleTimestamp(
  at: string | Date | null | undefined,
  staleAfterDays = 30,
  now: Date = new Date(),
): boolean {
  const d = toDate(at);
  if (!d) return true;
  const ageMs = now.getTime() - d.getTime();
  return ageMs > staleAfterDays * 24 * 60 * 60 * 1000;
}

function formatRelativeCs(at: Date, now: Date): string {
  const diffMs = now.getTime() - at.getTime();
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days < 1) {
    const hours = Math.max(0, Math.floor(diffMs / (60 * 60 * 1000)));
    if (hours < 1) return "před méně než hodinou";
    return hours === 1 ? "před 1 hodinou" : `před ${hours} hodinami`;
  }
  if (days === 1) return "včera";
  if (days < 30) return `před ${days} dny`;
  const months = Math.floor(days / 30);
  if (months < 12) {
    return months === 1 ? "před 1 měsícem" : `před ${months} měsíci`;
  }
  const years = Math.floor(months / 12);
  return years === 1 ? "před 1 rokem" : `před ${years} lety`;
}

function formatAbsolute(at: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(at);
}

/**
 * Formatted last-updated stamp with explicit stale callout past threshold.
 */
export function LastUpdated({
  at,
  staleAfterDays = 30,
  forceStale,
  label = "Aktualizováno",
  staleLabel = "Zastaralá data",
  className,
  locale = "cs-CZ",
}: LastUpdatedProps) {
  const date = toDate(at);
  const now = new Date();
  const stale =
    forceStale === true ||
    (forceStale !== false && isStaleTimestamp(date, staleAfterDays, now));

  if (!date) {
    return (
      <p
        className={cn(
          "inline-flex items-center gap-1.5 text-[var(--text-caption)] text-[var(--data-stale)]",
          className,
        )}
        data-trust-freshness="unknown"
      >
        <History className="size-3.5 shrink-0" aria-hidden />
        <span>
          {label}: <strong className="font-medium">neznámé</strong>
        </span>
        <span className="rounded-[var(--radius-sm)] border border-[var(--border-default)] px-1.5 py-0.5 font-medium">
          {staleLabel}
        </span>
      </p>
    );
  }

  const absolute = formatAbsolute(date, locale);
  const relative = formatRelativeCs(date, now);

  return (
    <p
      className={cn(
        "inline-flex flex-wrap items-center gap-1.5 text-[var(--text-caption)]",
        stale ? "text-[var(--data-stale)]" : "text-[var(--text-muted)]",
        className,
      )}
      data-trust-freshness={stale ? "stale" : "fresh"}
      title={`${label}: ${absolute} (${relative})`}
    >
      <Clock className="size-3.5 shrink-0" aria-hidden />
      <span>
        {label}:{" "}
        <time dateTime={date.toISOString()} className="font-medium text-[var(--text-secondary)]">
          {absolute}
        </time>
        <span className="text-[var(--text-muted)]"> · {relative}</span>
      </span>
      {stale ? (
        <span
          className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-[color-mix(in_srgb,var(--data-stale)_45%,white)] bg-[color-mix(in_srgb,var(--data-stale)_10%,white)] px-1.5 py-0.5 font-medium text-[var(--data-stale)]"
          role="status"
        >
          <History className="size-3" aria-hidden />
          {staleLabel}
        </span>
      ) : null}
    </p>
  );
}
