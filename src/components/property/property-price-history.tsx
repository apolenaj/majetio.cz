import { formatCzk } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PublicPriceHistoryPoint } from "@/domains/properties/service/dto";

const CHANGE_LABELS: Record<string, string> = {
  INITIAL: "První zaznamenaná cena",
  INCREASED: "Zvýšení ceny",
  DECREASED: "Snížení ceny",
  CORRECTED: "Korekce",
  REMOVED: "Cena odstraněna",
};

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("cs-CZ", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function PropertyPriceHistory({
  points,
  className,
}: {
  points: PublicPriceHistoryPoint[];
  className?: string;
}) {
  if (points.length === 0) {
    return (
      <p className={cn("text-sm text-[var(--text-muted)]", className)}>
        Historie ceny zatím není k dispozici.
      </p>
    );
  }

  const sorted = [...points].sort(
    (a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime(),
  );

  return (
    <ol className={cn("relative space-y-4 border-l border-[var(--border-default)] pl-5", className)}>
      {sorted.map((point, index) => (
        <li key={`${point.observedAt}-${point.amount}-${index}`} className="relative">
          <span
            className="absolute top-1.5 -left-[1.4rem] size-2.5 rounded-full bg-[var(--action-primary)]"
            aria-hidden
          />
          <p className="font-metric text-base font-semibold text-[var(--text-primary)]">
            {formatCzk(point.amount)}
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            {CHANGE_LABELS[point.changeType] ?? point.changeType}
            {" · "}
            {formatDate(point.observedAt)}
          </p>
          {point.sourceLabel ? (
            <p className="text-xs text-[var(--text-muted)]">Zdroj: {point.sourceLabel}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
