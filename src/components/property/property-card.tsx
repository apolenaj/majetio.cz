import { Building2, Heart, Columns2 } from "lucide-react";
import Link from "next/link";

import { DataQualityBadge, type DataQuality, RiskBadge, type RiskLevel, Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import { AspectRatio } from "@/components/ui/layout-primitives";
import { MetricValue } from "@/components/data-display/metric-card";
import { formatCzk, formatCzkPerSqm, formatPercentPoints } from "@/lib/format";
import { cn } from "@/lib/utils";

export type PropertyCardData = {
  href: string;
  title: string;
  location: string;
  disposition?: string;
  areaSqm?: number;
  /** Prefer over areaSqm when sources conflict (e.g. "72–74 m² podle zdrojů"). */
  areaDisplay?: string;
  priceCzk?: number;
  pricePerSqmCzk?: number;
  grossYieldPct?: number;
  cashFlowMonthlyCzk?: number;
  majetioScore?: number | null;
  imageUrl?: string;
  dataQuality?: DataQuality;
  risk?: RiskLevel;
  /** Orientační tagy (strategie, stav, …). */
  tags?: string[];
  isDemo?: boolean;
};

export function PropertyCard({
  property,
  onFavourite,
  onCompare,
  className,
}: {
  property: PropertyCardData;
  onFavourite?: () => void;
  onCompare?: () => void;
  className?: string;
}) {
  return (
    <Card
      as="article"
      variant="interactive"
      padding="none"
      className={cn("overflow-hidden", className)}
    >
      <Link href={property.href} className="block focus:outline-none">
        <AspectRatio ratio="4/3" className="bg-[var(--surface-sunken)]">
          {property.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={property.imageUrl}
              alt=""
              className="property-photo h-full w-full rounded-none"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-[var(--text-muted)]">
              <Building2 className="size-8" aria-hidden />
              <span className="text-xs">Fotografie není k dispozici</span>
            </div>
          )}
          {property.isDemo ? (
            <span className="absolute top-3 left-3 rounded border border-[var(--action-premium)] bg-[color-mix(in_srgb,var(--action-premium)_20%,white)] px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide">
              Demo
            </span>
          ) : null}
        </AspectRatio>
      </Link>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={property.href}
              className="font-display text-lg text-[var(--text-primary)] hover:underline"
            >
              <span className="line-clamp-2">{property.title}</span>
            </Link>
            <p className="mt-1 truncate text-sm text-[var(--text-secondary)]">
              {property.location}
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            {onFavourite ? (
              <IconButton label="Přidat do oblíbených" variant="ghost" size="icon-sm" onClick={onFavourite}>
                <Heart className="size-4" />
              </IconButton>
            ) : null}
            {onCompare ? (
              <IconButton label="Přidat do porovnání" variant="ghost" size="icon-sm" onClick={onCompare}>
                <Columns2 className="size-4" />
              </IconButton>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {property.dataQuality ? <DataQualityBadge quality={property.dataQuality} /> : null}
          {property.risk ? <RiskBadge level={property.risk} /> : null}
          {property.tags?.map((tag) => (
            <Badge key={tag} tone="neutral">
              {tag}
            </Badge>
          ))}
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-[var(--text-caption)] text-[var(--text-muted)]">Cena</dt>
            <dd>
              <MetricValue
                size="s"
                value={property.priceCzk != null ? formatCzk(property.priceCzk) : "—"}
              />
            </dd>
          </div>
          <div>
            <dt className="text-[var(--text-caption)] text-[var(--text-muted)]">Kč/m²</dt>
            <dd className="font-metric font-medium">
              {property.pricePerSqmCzk != null ? formatCzkPerSqm(property.pricePerSqmCzk) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--text-caption)] text-[var(--text-muted)]">Dispozice / plocha</dt>
            <dd>
              {[
                property.disposition,
                property.areaDisplay ??
                  (property.areaSqm != null ? `${property.areaSqm} m²` : null),
              ]
                .filter(Boolean)
                .join(" · ") || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--text-caption)] text-[var(--text-muted)]">Výnos (hrubý)</dt>
            <dd>
              <MetricValue
                size="s"
                tone={
                  property.grossYieldPct == null
                    ? "neutral"
                    : property.grossYieldPct >= 0
                      ? "positive"
                      : "negative"
                }
                value={
                  property.grossYieldPct != null
                    ? formatPercentPoints(property.grossYieldPct, { signed: true })
                    : "—"
                }
              />
            </dd>
          </div>
        </dl>

        {(property.cashFlowMonthlyCzk != null || property.majetioScore != null) && (
          <div className="flex items-center justify-between border-t border-[var(--border-default)] pt-3 text-sm">
            <span className="text-[var(--text-muted)]">
              Cash flow:{" "}
              <span className="font-metric font-medium text-[var(--text-primary)]">
                {property.cashFlowMonthlyCzk != null
                  ? formatCzk(property.cashFlowMonthlyCzk, { signed: true })
                  : "—"}
              </span>
            </span>
            <span className="font-metric font-semibold">
              {property.majetioScore != null ? `${property.majetioScore}/100` : "—"}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
