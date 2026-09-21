"use client";

import { Building2, Columns2, Heart, MapPin } from "lucide-react";
import Link from "next/link";

import {
  DataQualityBadge,
  type DataQuality,
  RiskBadge,
  type RiskLevel,
  Badge,
} from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import { AspectRatio } from "@/components/ui/layout-primitives";
import { PropertyListingImage } from "@/components/property/property-listing-image";
import { formatCzk, formatCzkPerSqm } from "@/lib/format";
import { cn } from "@/lib/utils";
import { saveSearchScrollPosition } from "@/domains/properties/search/scroll-restore";
import { SponsoredListingBadge } from "@/components/property/sponsored-listing-badge";

export type PropertyListingStatus = "active" | "stale" | "unavailable";

export type PropertyCardData = {
  id?: string;
  slug?: string;
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
  netYieldPct?: number;
  cashFlowMonthlyCzk?: number;
  estimatedRentMonthlyCzk?: number;
  renovationCostMinCzk?: number;
  renovationCostMaxCzk?: number;
  tenantDemandScore?: number;
  estimatedOccupancyMinPct?: number;
  estimatedOccupancyMaxPct?: number;
  majetioScore?: number | null;
  imageUrl?: string;
  dataQuality?: DataQuality;
  risk?: RiskLevel;
  /** Orientační tagy (strategie, stav, …). */
  tags?: string[];
  shortDescription?: string;
  transactionLabel?: string;
  propertyTypeLabel?: string;
  conditionLabel?: string;
  acceptsPriceOffers?: boolean;
  acceptsCoPurchase?: boolean;
  isDemo?: boolean;
  /** Confirmed amenity highlights, e.g. "Balkon 6,2 m² · Sklep". */
  featureHighlights?: string[];
  /** Paid placement disclosure — never affects score rendering. */
  sponsored?: boolean;
  listingStatus?: PropertyListingStatus;
  /** Rule-based match vs Finanční pas (Prompt 8 Part 4). */
  matchScore?: number | null;
  matchReasons?: Array<{ tone: "positive" | "warning" | "neutral"; label: string }>;
};

function tagTone(tag: string): "mint" | "blue" | "neutral" {
  const lower = tag.toLowerCase();
  if (
    lower.includes("výnos") ||
    lower.includes("příjem") ||
    lower.includes("cash") ||
    lower.includes("invest")
  ) {
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

function enrichTags(property: PropertyCardData): string[] {
  const tags = [...(property.tags ?? [])];
  if (property.grossYieldPct != null && property.grossYieldPct >= 6) {
    if (!tags.some((t) => t.toLowerCase().includes("výnos"))) {
      tags.unshift("Vysoký výnos");
    }
  }
  if (property.acceptsPriceOffers) tags.push("Přijímá cenové návrhy");
  if (property.acceptsCoPurchase) tags.push("Možnost společné koupě");
  return [...new Set(tags)].slice(0, 4);
}

export function PropertyCard({
  property,
  onFavourite,
  onCompare,
  isFavourite,
  isCompared,
  priority = false,
  className,
  variant = "default",
}: {
  property: PropertyCardData;
  onFavourite?: () => void;
  onCompare?: () => void;
  isFavourite?: boolean;
  isCompared?: boolean;
  /** LCP hint for above-the-fold cards. */
  priority?: boolean;
  className?: string;
  variant?: "default" | "premium";
}) {
  const status = property.listingStatus ?? "active";
  const unavailable = status === "unavailable";
  const stale = status === "stale";
  const detailLabel = `Zobrazit detail: ${property.title}`;
  const detailLinkClass =
    "cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]";
  const premium = variant === "premium";
  const displayTags = premium ? enrichTags(property) : property.tags?.slice(0, 2) ?? [];

  return (
    <Card
      as="article"
      variant="interactive"
      padding="none"
      className={cn(
        "overflow-hidden",
        premium && "property-card-premium border border-[#DCE5E7] bg-white shadow-[0_1px_2px_rgb(12_53_81/0.04)]",
        unavailable && "opacity-75 grayscale-[0.35]",
        className,
      )}
    >
      <div className={cn("relative", premium && "property-card-premium-media")}>
        <Link
          href={property.href}
          aria-label={detailLabel}
          className={cn("block", detailLinkClass)}
          onClick={() => saveSearchScrollPosition()}
        >
          <AspectRatio
            ratio="4/3"
            className={cn(
              "bg-[var(--surface-sunken)]",
              unavailable && "bg-[color-mix(in_srgb,var(--surface-sunken)_70%,var(--text-muted))]",
            )}
          >
            {property.imageUrl ? (
              <PropertyListingImage
                src={property.imageUrl}
                alt=""
                priority={priority}
                unavailable={unavailable}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-[var(--text-muted)]">
                <Building2 className="size-8" aria-hidden />
                <span className="text-xs">Fotografie není k dispozici</span>
              </div>
            )}
            <div className="pointer-events-none absolute top-3 left-3 flex flex-wrap gap-1.5">
              {property.sponsored ? <SponsoredListingBadge /> : null}
              {property.isDemo ? (
                <span className="rounded border border-[var(--action-premium)] bg-[color-mix(in_srgb,var(--action-premium)_20%,white)] px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide">
                  {premium ? "Ilustrační foto" : "Demo"}
                </span>
              ) : null}
              {stale ? (
                <span className="rounded border border-[var(--border-default)] bg-[var(--surface-primary)] px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                  Zastaralé
                </span>
              ) : null}
              {unavailable ? (
                <span className="rounded border border-[var(--status-error)] bg-[color-mix(in_srgb,var(--status-error)_12%,white)] px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--status-error)]">
                  Nedostupné
                </span>
              ) : null}
            </div>
          </AspectRatio>
        </Link>
        {premium && (onFavourite || onCompare) ? (
          <div className="absolute top-3 right-3 z-10 flex gap-1.5">
            {onFavourite ? (
              <button
                type="button"
                aria-label={isFavourite ? "Odebrat z oblíbených" : "Přidat do oblíbených"}
                className="inline-flex size-9 items-center justify-center rounded-full bg-white/92 text-[#0C3551] shadow-sm backdrop-blur-sm transition hover:text-[#0D9A92]"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onFavourite();
                }}
              >
                <Heart
                  className={cn("size-4", isFavourite && "fill-[#C45C5C] text-[#C45C5C]")}
                />
              </button>
            ) : null}
            {onCompare ? (
              <button
                type="button"
                aria-label={isCompared ? "Odebrat z porovnání" : "Přidat do porovnání"}
                className={cn(
                  "inline-flex size-9 items-center justify-center rounded-full bg-white/92 text-[#0C3551] shadow-sm backdrop-blur-sm transition hover:text-[#0D9A92]",
                  isCompared && "text-[#0D9A92]",
                )}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onCompare();
                }}
              >
                <Columns2 className="size-4" />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className={cn("space-y-3 p-4", premium && "space-y-2.5 p-4 sm:p-5")}>
        {property.transactionLabel || property.propertyTypeLabel ? (
          <p
            className={cn(
              "text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]",
              premium && "tracking-[0.08em] text-[#667A86]",
            )}
          >
            {[property.transactionLabel, property.propertyTypeLabel].filter(Boolean).join(" · ")}
          </p>
        ) : null}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={property.href}
              className={cn(
                "font-display text-lg hover:underline",
                detailLinkClass,
                unavailable ? "text-[var(--text-muted)]" : "text-[var(--text-primary)]",
                premium && "text-[1.0625rem] leading-snug text-[#0C3551] sm:text-lg",
              )}
              onClick={() => saveSearchScrollPosition()}
            >
              <span className="line-clamp-2">{property.title}</span>
            </Link>
            <p
              className={cn(
                "mt-1 truncate text-sm text-[var(--text-secondary)]",
                premium && "inline-flex max-w-full items-center gap-1 text-[#667A86]",
              )}
            >
              {premium ? <MapPin className="size-3.5 shrink-0" aria-hidden /> : null}
              <span className="truncate">{property.location}</span>
            </p>
          </div>
          {!premium ? (
            <div className="flex shrink-0 gap-1">
              {onFavourite ? (
                <IconButton
                  label={isFavourite ? "Odebrat z oblíbených" : "Přidat do oblíbených"}
                  variant={isFavourite ? "secondary" : "ghost"}
                  size="icon-sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onFavourite();
                  }}
                >
                  <Heart
                    className={cn("size-4", isFavourite && "fill-current text-[var(--status-error)]")}
                  />
                </IconButton>
              ) : null}
              {onCompare ? (
                <IconButton
                  label={isCompared ? "Odebrat z porovnání" : "Přidat do porovnání"}
                  variant={isCompared ? "secondary" : "ghost"}
                  size="icon-sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onCompare();
                  }}
                >
                  <Columns2 className={cn("size-4", isCompared && "text-[var(--action-primary)]")} />
                </IconButton>
              ) : null}
            </div>
          ) : null}
        </div>

        {!premium ? (
          <div className="flex flex-wrap gap-2">
            {property.matchScore != null && property.matchScore > 0 ? (
              <Badge tone="premium">Shoda {property.matchScore} %</Badge>
            ) : null}
            {property.dataQuality ? (
              <DataQualityBadge quality={property.dataQuality} />
            ) : null}
            {property.risk ? <RiskBadge level={property.risk} /> : null}
            {displayTags.map((tag) => (
              <Badge key={tag} tone="neutral">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}

        {property.matchReasons && property.matchReasons.length > 0 ? (
          <ul className="space-y-1 text-xs text-[var(--text-secondary)]">
            {property.matchReasons.slice(0, 3).map((reason) => (
              <li
                key={reason.label}
                className={
                  reason.tone === "positive"
                    ? "text-[var(--status-success)]"
                    : reason.tone === "warning"
                      ? "text-[var(--status-warning)]"
                      : undefined
                }
              >
                {reason.label}
              </li>
            ))}
          </ul>
        ) : null}

        <p
          className={cn(
            "whitespace-nowrap font-metric text-xl font-medium text-[var(--text-primary)]",
            premium && "text-[1.25rem] font-semibold text-[#0C3551]",
          )}
        >
          {unavailable
            ? "Nedostupné"
            : property.priceCzk != null
              ? formatCzk(property.priceCzk)
              : "Cena na vyžádání"}
        </p>
        {property.pricePerSqmCzk != null && !unavailable && !premium ? (
          <p className="text-sm text-[var(--text-secondary)]">{formatCzkPerSqm(property.pricePerSqmCzk)}</p>
        ) : null}
        <p className={cn("text-sm text-[var(--text-secondary)]", premium && "text-[#667A86]")}>
          {[
            property.disposition,
            property.areaDisplay ?? (property.areaSqm != null ? `${property.areaSqm} m²` : null),
            property.conditionLabel && property.conditionLabel !== "—" ? property.conditionLabel : null,
          ]
            .filter(Boolean)
            .join(" · ") || "Parametry neuvedeny"}
        </p>

        {premium && displayTags.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {displayTags.map((tag) => (
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

        {property.featureHighlights && property.featureHighlights.length > 0 && !premium ? (
          <p className="text-xs text-[var(--text-muted)]">
            {property.featureHighlights.join(" · ")}
          </p>
        ) : null}
        <p
          className={cn(
            "line-clamp-3 text-sm leading-relaxed text-[var(--text-secondary)]",
            premium && "line-clamp-2 text-[#667A86]",
          )}
        >
          {property.shortDescription || "Krátký popis není uveden."}
        </p>
        {!premium && (property.acceptsPriceOffers || property.acceptsCoPurchase) ? (
          <ul className="flex flex-wrap gap-1.5">
            {property.acceptsPriceOffers ? (
              <li className="rounded-full bg-[var(--surface-sunken)] px-2.5 py-1 text-xs text-[var(--text-secondary)]">
                Přijímá cenové návrhy
              </li>
            ) : null}
            {property.acceptsCoPurchase ? (
              <li className="rounded-full bg-[var(--surface-sunken)] px-2.5 py-1 text-xs text-[var(--text-secondary)]">
                Možnost jednat o společné koupi
              </li>
            ) : null}
          </ul>
        ) : null}

        {!premium ? (
          <Link
            href={property.href}
            className={cn(
              "inline-flex text-sm font-medium text-[var(--text-primary)] underline underline-offset-2",
              detailLinkClass,
            )}
            onClick={() => saveSearchScrollPosition()}
          >
            Zobrazit detail
          </Link>
        ) : null}

        {!premium ? <InvestmentSnapshot property={property} hidden={unavailable} /> : null}
        {premium && !unavailable ? (
          <PremiumInvestmentStrip property={property} />
        ) : null}
      </div>
    </Card>
  );
}

function pct(value: number): string {
  return `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 }).format(value)} %`;
}

function renovationLabel(min?: number, max?: number): string | null {
  const lo = min ?? max;
  const hi = max ?? min;
  if (lo == null) return null;
  const thousands = (value: number) =>
    new Intl.NumberFormat("cs-CZ").format(Math.round(value / 1000));
  if (hi != null && hi !== lo) return `~${thousands(lo)}–${thousands(hi)} tis. Kč`;
  return `~${thousands(lo)} tis. Kč`;
}

function PremiumInvestmentStrip({ property }: { property: PropertyCardData }) {
  const parts: string[] = [];
  if (property.grossYieldPct != null) parts.push(`Výnos ${pct(property.grossYieldPct)}`);
  if (property.cashFlowMonthlyCzk != null) {
    parts.push(`CF ${formatCzk(property.cashFlowMonthlyCzk, { signed: true })}/měs.`);
  }
  if (property.majetioScore != null) parts.push(`Score ${property.majetioScore}`);
  if (parts.length === 0) return null;
  return (
    <p className="border-t border-[#DCE5E7] pt-2.5 text-xs font-medium text-[#0A7F79]">
      {parts.join(" · ")}
    </p>
  );
}

function InvestmentSnapshot({
  property,
  hidden,
}: {
  property: PropertyCardData;
  hidden: boolean;
}) {
  if (hidden) return null;
  const renovation = renovationLabel(
    property.renovationCostMinCzk,
    property.renovationCostMaxCzk,
  );
  const occupancy =
    property.estimatedOccupancyMinPct != null &&
    property.estimatedOccupancyMaxPct != null &&
    property.estimatedOccupancyMaxPct !== property.estimatedOccupancyMinPct
      ? `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 }).format(property.estimatedOccupancyMinPct)}–${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 }).format(property.estimatedOccupancyMaxPct)} %`
      : property.estimatedOccupancyMinPct != null
        ? `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 }).format(property.estimatedOccupancyMinPct)} %`
        : null;

  const rows: Array<{ label: string; value: string; estimate?: boolean }> = [];
  if (property.estimatedRentMonthlyCzk != null) {
    rows.push({
      label: "Odhad nájmu",
      value: `${formatCzk(property.estimatedRentMonthlyCzk)}/měs.`,
      estimate: true,
    });
  }
  if (property.grossYieldPct != null) {
    rows.push({ label: "Hrubý výnos", value: pct(property.grossYieldPct), estimate: true });
  }
  if (property.netYieldPct != null) {
    rows.push({ label: "Čistý výnos", value: pct(property.netYieldPct), estimate: true });
  }
  if (property.cashFlowMonthlyCzk != null) {
    rows.push({
      label: "Cashflow",
      value: `${formatCzk(property.cashFlowMonthlyCzk, { signed: true })}/měs.`,
    });
  }
  if (renovation) {
    rows.push({ label: "Rekonstrukce", value: renovation, estimate: true });
  }
  if (property.tenantDemandScore != null) {
    rows.push({ label: "Poptávka", value: `${property.tenantDemandScore}/100` });
  }
  if (occupancy) {
    rows.push({ label: "Odhad obsazenosti", value: occupancy, estimate: true });
  }
  if (property.majetioScore != null) {
    rows.push({ label: "Majetio Score", value: `${property.majetioScore}/100` });
  }

  if (rows.length === 0) return null;

  return (
    <dl className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-[var(--border-default)] pt-3 text-sm">
      {rows.map((row) => (
        <div key={row.label}>
          <dt className="text-[var(--text-caption)] text-[var(--text-muted)]">
            {row.label}
            {row.estimate ? (
              <span className="ml-1 rounded bg-amber-100 px-1 py-px text-[0.6rem] font-semibold uppercase text-amber-900">
                Odhad
              </span>
            ) : null}
          </dt>
          <dd className="font-metric font-medium text-[var(--text-primary)]">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
