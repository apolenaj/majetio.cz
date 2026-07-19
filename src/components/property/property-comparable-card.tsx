"use client";

import { formatCzk, formatDateTime } from "@/lib/format";
import type { PublicComparableDto } from "@/domains/valuation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trackComparableOpened } from "@/components/property/property-valuation-analytics";

const NEU = "Neuvedeno";

function locationLine(c: PublicComparableDto): string {
  const parts = [c.district, c.city].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : NEU;
}

function formatObserved(iso: string | null, anonymized: boolean): string {
  if (!iso) return NEU;
  if (anonymized || /^\d{4}-\d{2}$/.test(iso)) return iso;
  return formatDateTime(iso).split(" ")[0] ?? formatDateTime(iso);
}

/**
 * Expandable comparable card — fires comparable_opened (no CZK in analytics).
 */
export function PropertyComparableCard({
  slug,
  comparable,
  weight,
}: {
  slug: string;
  comparable: PublicComparableDto;
  weight?: number;
}) {
  const c = comparable;

  return (
    <details
      className="group"
      onToggle={(e) => {
        if ((e.target as HTMLDetailsElement).open) {
          trackComparableOpened({
            slug,
            anonymized: c.anonymized,
            similarityPct: c.similarityPct,
          });
        }
      }}
    >
      <summary className="cursor-pointer list-none rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-4 py-3 marker:content-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] [&::-webkit-details-marker]:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-[var(--text-primary)]">{c.label}</span>
          {c.anonymized ? <Badge tone="neutral">Anonymizováno</Badge> : null}
          <Badge tone="neutral">{c.similarityPct} % podobnost</Badge>
        </div>
      </summary>
      <Card className="mt-2 border-t-0" padding="md">
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-[var(--text-muted)]">Lokalita</dt>
            <dd>{locationLine(c)}</dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">Dispozice</dt>
            <dd>{c.layout ?? NEU}</dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">Plocha</dt>
            <dd>{c.usableArea != null ? `${c.usableArea} m²` : NEU}</dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">Cena</dt>
            <dd>{c.priceCzk != null ? formatCzk(c.priceCzk) : NEU}</dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">Kč/m²</dt>
            <dd>
              {c.pricePerSqm != null
                ? formatCzk(Math.round(c.pricePerSqm))
                : NEU}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">Pozorováno</dt>
            <dd>{formatObserved(c.observedAt, c.anonymized)}</dd>
          </div>
          {weight != null ? (
            <div>
              <dt className="text-[var(--text-muted)]">Váha</dt>
              <dd className="font-metric">{weight.toFixed(3)}</dd>
            </div>
          ) : null}
        </dl>
      </Card>
    </details>
  );
}
