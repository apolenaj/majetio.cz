import { MapPin } from "lucide-react";

import type { PublicPropertyLocation } from "@/domains/properties/service/dto";
import type { LocationBenchmarkDemo } from "@/content/demo-property-context";
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
}: {
  location: PublicPropertyLocation;
  benchmark: LocationBenchmarkDemo | null;
}) {
  const propPps = benchmark?.propertyPricePerSqmCzk ?? null;
  const avgPps = benchmark?.localAvgPricePerSqmCzk ?? null;
  const diffPct = benchmark?.diffPct ?? null;

  return (
    <section aria-labelledby="location-heading">
      <h2
        id="location-heading"
        className="font-display text-xl text-[var(--text-primary)] sm:text-2xl"
      >
        Lokalita a mapa
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
        Porovnání ceny za m² s lokálním průměrem. Mapa respektuje
        addressPrecision — při HIDDEN se nezobrazí.
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card padding="lg">
          <CardHeader>
            <CardTitle as="h3">Cena vs. lokální průměr</CardTitle>
            <CardDescription>
              {benchmark?.districtLabel
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
              <dt className="text-xs text-[var(--text-muted)]">Lokální průměr</dt>
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

          <div className="mt-4 grid gap-2 border-t border-[var(--border-default)] pt-4 text-sm text-[var(--text-secondary)] sm:grid-cols-2">
            <p>
              Nájemní index:{" "}
              <strong className="font-metric text-[var(--text-primary)]">
                {benchmark?.rentIndexPct != null
                  ? formatPercentPoints(benchmark.rentIndexPct)
                  : NEU}
              </strong>
            </p>
            <p>
              Tempo ceny:{" "}
              <strong className="font-metric text-[var(--text-primary)]">
                {benchmark?.priceTrendPct != null
                  ? formatPercentPoints(benchmark.priceTrendPct)
                  : NEU}
              </strong>
            </p>
            <p>
              Dojezd:{" "}
              <strong className="text-[var(--text-primary)]">
                {benchmark?.commuteMinutes != null
                  ? `${benchmark.commuteMinutes} min`
                  : NEU}
              </strong>
            </p>
            <p>{benchmark?.vacancyNote ?? `Neobsazenost: ${NEU}`}</p>
          </div>
        </Card>

        <LocationMapVisual location={location} />
      </div>
    </section>
  );
}
