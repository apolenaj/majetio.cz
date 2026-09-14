import Link from "next/link";
import { MapPin } from "lucide-react";

import { DataSource } from "@/components/overlays/tooltip";
import { WatchLocationButton } from "@/components/locations/watch-location-button";
import type { LocationBenchmarkDemo } from "@/content/demo-property-context";
import type { PropertySegmentBenchmark } from "@/domains/locations/integration/types";
import type { PublicPropertyLocation } from "@/domains/properties/service/dto";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCzkPerSqm, formatPercentPoints } from "@/lib/format";
import { cn } from "@/lib/utils";

const NEU = "Neuvedeno";

function LocationMapVisual({
  location,
}: {
  location: PublicPropertyLocation;
}) {
  const precision = location.precision;
  const hasCoords =
    location.latitude != null &&
    location.longitude != null &&
    Number.isFinite(location.latitude) &&
    Number.isFinite(location.longitude);

  if (precision === "HIDDEN") {
    return (
      <div
        className="flex min-h-[14rem] flex-col items-center justify-center gap-2 rounded-[var(--radius-card)] border border-dashed border-[var(--border-strong)] bg-[var(--background-secondary)] p-6 text-center"
        role="img"
        aria-label="Mapa není dostupná"
      >
        <MapPin className="size-7 text-[var(--text-muted)]" aria-hidden />
        <p className="font-medium text-[var(--text-primary)]">Mapa skrytá</p>
        <p className="max-w-xs text-sm text-[var(--text-secondary)]">
          Přesná lokalita je skrytá (addressPrecision: HIDDEN) — mapu
          nezobrazujeme.
        </p>
      </div>
    );
  }

  if (
    precision !== "EXACT" &&
    precision !== "APPROXIMATE" &&
    precision !== "CITY" &&
    !hasCoords
  ) {
    return (
      <div
        className="flex min-h-[14rem] flex-col items-center justify-center gap-2 rounded-[var(--radius-card)] border border-dashed border-[var(--border-strong)] bg-[var(--background-secondary)] p-6 text-center"
        role="img"
        aria-label="Mapa není dostupná"
      >
        <MapPin className="size-7 text-[var(--text-muted)]" aria-hidden />
        <p className="font-medium text-[var(--text-primary)]">Mapa nedostupná</p>
        <p className="max-w-xs text-sm text-[var(--text-secondary)]">
          Souřadnice ani úroveň lokality nejsou k dispozici.
        </p>
      </div>
    );
  }

  const approximate =
    precision === "APPROXIMATE" || precision === "CITY" || !hasCoords;
  const label =
    location.district ||
    location.city ||
    location.label ||
    "Lokalita";

  return (
    <div
      className="relative min-h-[14rem] overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[linear-gradient(145deg,var(--background-secondary),color-mix(in_srgb,var(--action-accent)_8%,var(--surface-primary)))]"
      role="img"
      aria-label={
        approximate
          ? `Orientační mapa čtvrti: ${label}`
          : `Mapa lokality: ${label}`
      }
    >
      {/* Soft grid atmosphere — placeholder map, not a real tile layer */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(var(--border-default) 1px, transparent 1px), linear-gradient(90deg, var(--border-default) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
        aria-hidden
      />

      {approximate ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="flex size-36 flex-col items-center justify-center rounded-full border-2 border-dashed border-[var(--action-accent)] bg-[color-mix(in_srgb,var(--action-accent)_12%,transparent)] px-4 text-center sm:size-44"
            aria-hidden
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--action-accent)]">
              Bublina čtvrti
            </p>
            <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{label}</p>
            <p className="mt-1 text-[10px] text-[var(--text-muted)]">
              Bez přesného markeru na dům
            </p>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <span
              className="absolute -inset-6 rounded-full bg-[color-mix(in_srgb,var(--action-primary)_15%,transparent)]"
              aria-hidden
            />
            <MapPin
              className="relative size-10 text-[var(--action-primary)]"
              aria-hidden
            />
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 bg-[color-mix(in_srgb,var(--surface-primary)_88%,transparent)] px-4 py-3 text-xs text-[var(--text-secondary)]">
        {approximate
          ? `Přesnost: přibližná (${precision}). Marker na konkrétní dům nezobrazujeme.`
          : `Přesnost: EXACT · ${location.latitude?.toFixed(4)}, ${location.longitude?.toFixed(4)} (demo podklad)`}
      </div>
    </div>
  );
}

export function PropertyLocationSection({
  location,
  benchmark,
  segmentBenchmark,
  locationPageHref,
  opportunityInsight,
  marketContext,
  strRegulatory,
  watchSlug,
}: {
  location: PublicPropertyLocation;
  /** @deprecated Prefer segmentBenchmark from Location Engine */
  benchmark?: LocationBenchmarkDemo | null;
  segmentBenchmark?: PropertySegmentBenchmark | null;
  locationPageHref?: string | null;
  opportunityInsight?: import("@/domains/locations/integration/market-opportunity-insight").MarketOpportunityInsight | null;
  marketContext?: import("@/domains/locations/integration/market-context").LocationMarketContextBlock | null;
  strRegulatory?: import("@/domains/locations/integration/str-regulatory-context").LocationStrRegulatoryBundle | null;
  watchSlug?: string | null;
}) {
  const seg = segmentBenchmark;
  const useSegment = seg?.available ?? false;

  const propPps = useSegment
    ? seg!.propertyPricePerSqm
    : (benchmark?.propertyPricePerSqmCzk ?? null);
  const avgPps = useSegment
    ? seg!.localMedianPricePerSqm
    : (benchmark?.localAvgPricePerSqmCzk ?? null);
  const diffPct = useSegment ? seg!.diffPct : (benchmark?.diffPct ?? null);
  const medianLabel = useSegment ? "Lokální medián" : "Lokální průměr";

  const showPurchasePct =
    useSegment &&
    seg!.percentilesStatisticallyValid &&
    seg!.purchasePricePercentile != null;
  const showRentPct =
    useSegment &&
    seg!.percentilesStatisticallyValid &&
    seg!.rentPercentile != null;

  return (
    <section aria-labelledby="location-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="location-heading"
            className="font-display text-xl text-[var(--text-primary)] sm:text-2xl"
          >
            Lokalita
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
            Srovnání ceny za m² se segmentovým mediánem lokality (stejný typ nemovitosti
            a dispozice). Percentily jen při statisticky validním vzorku.
          </p>
        </div>
        {watchSlug ? <WatchLocationButton locationSlug={watchSlug} /> : null}
      </div>
      {useSegment && seg!.segmentLabel ? (
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Segment: {seg!.segmentLabel} · {seg!.period}
          {seg!.sampleCount != null ? ` · vzorek ${seg!.sampleCount}` : null}
        </p>
      ) : null}

      {opportunityInsight?.available && opportunityInsight.text ? (
        <p
          className="mt-4 rounded-lg border border-[var(--border-default)] bg-[var(--surface-secondary)] px-4 py-3 text-sm text-[var(--text-secondary)]"
          role="status"
        >
          <strong className="font-medium text-[var(--text-primary)]">
            Market insight:{" "}
          </strong>
          {opportunityInsight.text}
        </p>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card padding="lg">
          <CardHeader>
            <CardTitle as="h3">Cena vs. {medianLabel.toLowerCase()} lokality</CardTitle>
            <CardDescription>
              {useSegment
                ? `${seg!.locationLabel} · ${seg!.priceKind === "ASKING" ? "nabídkové" : "transakční"} ceny`
                : benchmark?.districtLabel
                  ? `Lokalita: ${benchmark.districtLabel}`
                  : location.label || location.city || NEU}
            </CardDescription>
          </CardHeader>

          <dl className="grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-[var(--text-muted)]">Tato nabídka</dt>
              <dd className="font-metric text-base font-semibold text-[var(--text-primary)]">
                {propPps != null ? formatCzkPerSqm(propPps) : NEU}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--text-muted)]">{medianLabel}</dt>
              <dd className="font-metric text-base font-semibold text-[var(--text-primary)]">
                {avgPps != null ? formatCzkPerSqm(avgPps) : NEU}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--text-muted)]">Rozdíl</dt>
              <dd
                className={cn(
                  "font-metric text-base font-semibold",
                  diffPct == null && "text-[var(--text-muted)]",
                  diffPct != null &&
                    diffPct > 0 &&
                    "text-[var(--investment-negative)]",
                  diffPct != null &&
                    diffPct < 0 &&
                    "text-[var(--investment-positive)]",
                  diffPct === 0 && "text-[var(--text-primary)]",
                )}
              >
                {diffPct != null
                  ? formatPercentPoints(diffPct, { signed: true })
                  : NEU}
              </dd>
            </div>
          </dl>

          {(showPurchasePct || showRentPct) && (
            <dl className="mt-4 grid gap-3 border-t border-[var(--border-default)] pt-4 sm:grid-cols-2">
              {showPurchasePct ? (
                <div>
                  <dt className="text-xs text-[var(--text-muted)]">
                    Purchase price percentile
                  </dt>
                  <dd className="font-metric text-lg font-semibold text-[var(--text-primary)]">
                    {Math.round(seg!.purchasePricePercentile!)}. percentil
                  </dd>
                </div>
              ) : null}
              {showRentPct ? (
                <div>
                  <dt className="text-xs text-[var(--text-muted)]">Rent percentile</dt>
                  <dd className="font-metric text-lg font-semibold text-[var(--text-primary)]">
                    {Math.round(seg!.rentPercentile!)}. percentil
                  </dd>
                </div>
              ) : null}
            </dl>
          )}

          <div className="mt-4 grid gap-2 border-t border-[var(--border-default)] pt-4 text-sm text-[var(--text-secondary)] sm:grid-cols-2">
            <p>
              Nájemní benchmark:{" "}
              <strong className="font-metric text-[var(--text-primary)]">
                {useSegment && seg!.rentBenchmarkPerSqm != null
                  ? `${Math.round(seg!.rentBenchmarkPerSqm)} Kč/m²/měs.`
                  : benchmark?.rentIndexPct != null
                    ? formatPercentPoints(benchmark.rentIndexPct)
                    : NEU}
              </strong>
            </p>
            <p>
              Trend cen (YoY):{" "}
              <strong className="font-metric text-[var(--text-primary)]">
                {useSegment && seg!.priceTrendYoYPct != null
                  ? formatPercentPoints(seg!.priceTrendYoYPct, { signed: true })
                  : benchmark?.priceTrendPct != null
                    ? formatPercentPoints(benchmark.priceTrendPct)
                    : NEU}
              </strong>
            </p>
            {!useSegment ? (
              <>
                <p>
                  Dojezd:{" "}
                  <strong className="text-[var(--text-primary)]">
                    {benchmark?.commuteMinutes != null
                      ? `${benchmark.commuteMinutes} min`
                      : NEU}
                  </strong>
                </p>
                <p>{benchmark?.vacancyNote ?? `Neobsazenost: ${NEU}`}</p>
              </>
            ) : null}
          </div>

          {marketContext?.development.available ? (
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              Development:{" "}
              <strong className="text-[var(--text-primary)]">
                {marketContext.development.unitsUnderConstruction?.toLocaleString("cs-CZ")}{" "}
                jednotek ve výstavbě
              </strong>
              {marketContext.development.pipelineNote
                ? ` — ${marketContext.development.pipelineNote}`
                : null}
            </p>
          ) : null}

          {marketContext?.priceVolatility.available &&
          marketContext.priceVolatility.cv != null ? (
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Historická volatilita cen (CV):{" "}
              <strong className="font-metric text-[var(--text-primary)]">
                {(marketContext.priceVolatility.cv * 100).toFixed(1)} %
              </strong>
            </p>
          ) : null}

          {marketContext?.seasonality.available ? (
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Sezónnost: {marketContext.seasonality.drivers.join(", ")}
              {marketContext.seasonality.note
                ? ` — ${marketContext.seasonality.note}`
                : null}
            </p>
          ) : null}

          {strRegulatory?.shortTermRental.available ? (
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Short-term rental: poptávka turismu index{" "}
              <strong className="font-metric text-[var(--text-primary)]">
                {strRegulatory.shortTermRental.tourismDemandIndex ?? NEU}
              </strong>
              {strRegulatory.shortTermRental.estimatedOccupancyPct != null
                ? ` · obsazenost ~${strRegulatory.shortTermRental.estimatedOccupancyPct} %`
                : null}
              {strRegulatory.shortTermRental.source
                ? ` (${strRegulatory.shortTermRental.source})`
                : null}
            </p>
          ) : null}

          {strRegulatory?.regulatory.available ? (
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Regulace STR:{" "}
              <strong className="text-[var(--text-primary)]">
                {strRegulatory.regulatory.shortTermRentalLevel}
              </strong>
              {strRegulatory.regulatory.summary
                ? ` — ${strRegulatory.regulatory.summary}`
                : null}
            </p>
          ) : null}

          {useSegment && seg!.suppressReason == null ? (
            <DataSource
              className="mt-4"
              source={seg!.source}
              updatedAt={seg!.period}
            />
          ) : null}

          {useSegment && seg!.suppressReason ? (
            <p className="mt-4 text-sm text-[var(--text-muted)]">{seg!.suppressReason}</p>
          ) : null}

          {locationPageHref ? (
            <p className="mt-4">
              <Link
                href={locationPageHref}
                className="text-sm text-[var(--text-link)] underline-offset-2 hover:underline"
              >
                Celý tržní profil lokality →
              </Link>
            </p>
          ) : null}
        </Card>

        <LocationMapVisual location={location} />
      </div>
    </section>
  );
}

