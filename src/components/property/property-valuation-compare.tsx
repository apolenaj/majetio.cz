import { formatCzk } from "@/lib/format";
import type { PublicValuationDto, AnalystValuationDto } from "@/domains/valuation";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricValue } from "@/components/data-display/metric-card";
import { cn } from "@/lib/utils";
import {
  ConfidenceIndicator,
  ContextualDisclaimer,
  DataSourceBadge,
  LastUpdated,
  MethodologyLink,
  toConfidenceLevel,
} from "@/components/trust";

const NEU = "Nutno ověřit";

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

/**
 * Asking price vs mid-estimate with visual interval (Prompt 10 Part 4).
 */
export function PropertyValuationCompare({
  valuation,
}: {
  valuation: PublicValuationDto | AnalystValuationDto | null;
}) {
  const askingPrice = valuation?.askingPriceCzk ?? null;
  const hasRange =
    valuation != null &&
    valuation.status === "CALCULATED" &&
    valuation.lowerBoundCzk != null &&
    valuation.upperBoundCzk != null &&
    valuation.estimateMidCzk != null;

  const mid = valuation?.estimateMidCzk ?? null;

  let askingPct = 0.5;
  let lowPct = 0;
  let midPct = 0.5;
  let highPct = 1;

  if (hasRange && valuation) {
    const low = valuation.lowerBoundCzk!;
    const high = valuation.upperBoundCzk!;
    const span = Math.max(high - low, 1);
    const pad = span * 0.15;
    const min = low - pad;
    const max = high + pad;
    const width = Math.max(max - min, 1);
    lowPct = clamp01((low - min) / width);
    midPct = clamp01((valuation.estimateMidCzk! - min) / width);
    highPct = clamp01((high - min) / width);
    askingPct =
      askingPrice != null ? clamp01((askingPrice - min) / width) : midPct;
  }

  const deltaCzk = valuation?.askingVsMidCzk ?? null;
  const deltaPct = valuation?.askingVsMidPct ?? null;

  return (
    <section aria-labelledby="valuation-compare-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-2xl">
          <h2
            id="valuation-compare-heading"
            className="font-display text-xl text-[var(--text-primary)] sm:text-2xl"
          >
            Nabídková cena vs. modelovaný odhad
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Porovnání inzerované nabídkové ceny s orientačním rozpětím modelu
            Majetio. Chybějící hodnoty nejsou nahrazovány nulou.
          </p>
        </div>
        <MethodologyLink topic="valuation" />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Card padding="lg" elevation="raised">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-caption uppercase tracking-wide text-[var(--text-muted)]">
              Nabídková cena
            </p>
            <DataSourceBadge kind="source_record" size="sm" />
          </div>
          <MetricValue
            size="xl"
            value={askingPrice != null ? formatCzk(askingPrice) : NEU}
          />
        </Card>
        <Card padding="lg" elevation="raised">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-caption uppercase tracking-wide text-[var(--text-muted)]">
              Střed modelu (orientační)
            </p>
            <DataSourceBadge
              kind="majetio_estimate"
              size="sm"
              detail={valuation?.engineVersion ?? null}
            />
          </div>
          <MetricValue
            size="xl"
            value={mid != null ? formatCzk(mid) : NEU}
          />
          {deltaCzk != null && deltaPct != null ? (
            <p
              className={cn(
                "mt-2 text-sm font-medium",
                deltaCzk > 0
                  ? "text-[var(--investment-negative)]"
                  : deltaCzk < 0
                    ? "text-[var(--investment-positive)]"
                    : "text-[var(--text-secondary)]",
              )}
            >
              {deltaCzk === 0
                ? "Na úrovni středu modelovaného odhadu"
                : deltaCzk > 0
                  ? `Nabídka je o ${formatCzk(deltaCzk)} (+${deltaPct} %) nad středem modelu`
                  : `Nabídka je o ${formatCzk(Math.abs(deltaCzk))} (${deltaPct} %) pod středem modelu`}
            </p>
          ) : null}
        </Card>
      </div>

      {hasRange && valuation ? (
        <Card className="mt-4" padding="lg">
          <CardHeader>
            <CardTitle as="h3">Orientační rozpětí modelu</CardTitle>
            <CardDescription>
              Dolní — střed — horní pásmo oproti aktuální nabídkové ceně
            </CardDescription>
          </CardHeader>

          <p
            id="valuation-range-summary"
            className="mb-3 text-sm text-[var(--text-secondary)]"
          >
            Orientační rozpětí modelovaného odhadu: dolní{" "}
            {formatCzk(valuation.lowerBoundCzk!)}, střed{" "}
            {formatCzk(valuation.estimateMidCzk!)}, horní{" "}
            {formatCzk(valuation.upperBoundCzk!)}
            {askingPrice != null
              ? `; nabídková cena ${formatCzk(askingPrice)}`
              : ""}
            . Nejde o oficiální ocenění ani o „skutečnou hodnotu“.
          </p>

          <div
            className="relative mt-2 h-16"
            role="img"
            aria-labelledby="valuation-range-summary"
            aria-label={`Interval odhadu od ${formatCzk(valuation.lowerBoundCzk!)} do ${formatCzk(valuation.upperBoundCzk!)}, střed ${formatCzk(valuation.estimateMidCzk!)}${askingPrice != null ? `, nabídka ${formatCzk(askingPrice)}` : ""}`}
          >
            <div
              className="absolute top-6 h-2 w-full rounded-full bg-[var(--background-secondary)]"
              aria-hidden
            />
            <div
              className="absolute top-6 h-2 rounded-full bg-[color-mix(in_srgb,var(--action-accent)_35%,var(--background-secondary))]"
              style={{
                left: `${lowPct * 100}%`,
                width: `${Math.max((highPct - lowPct) * 100, 2)}%`,
              }}
              aria-hidden
            />
            {[
              { pct: lowPct, label: "Dolní", value: valuation.lowerBoundCzk! },
              { pct: midPct, label: "Střed", value: valuation.estimateMidCzk! },
              { pct: highPct, label: "Horní", value: valuation.upperBoundCzk! },
            ].map((m) => (
              <div
                key={m.label}
                className="absolute top-3 flex -translate-x-1/2 flex-col items-center"
                style={{ left: `${m.pct * 100}%` }}
              >
                <span className="h-8 w-0.5 bg-[var(--border-strong)]" aria-hidden />
                <span className="mt-1 whitespace-nowrap text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  {m.label}
                </span>
                <span className="font-metric text-xs text-[var(--text-secondary)]">
                  {formatCzk(m.value)}
                </span>
              </div>
            ))}
            {askingPrice != null ? (
              <div
                className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
                style={{ left: `${askingPct * 100}%` }}
              >
                <span className="rounded-[var(--radius-sm)] bg-[var(--action-primary)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--text-inverse)]">
                  Nabídka
                </span>
                <span
                  className="mt-0.5 h-10 w-0.5 bg-[var(--action-primary)]"
                  aria-hidden
                />
              </div>
            ) : null}
          </div>

          <div className="mt-16 space-y-3 border-t border-[var(--border-default)] pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <ConfidenceIndicator
                level={toConfidenceLevel(valuation.confidenceLevel)}
                reason={valuation.confidenceExplanations[0] ?? null}
                details={valuation.confidenceExplanations.slice(1)}
              />
              <LastUpdated
                at={valuation.calculatedAt}
                staleAfterDays={45}
                label="Výpočet modelu"
              />
            </div>
            {valuation.confidenceExplanations.length > 1 ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
                {valuation.confidenceExplanations.slice(1).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </Card>
      ) : (
        <Card className="mt-4" padding="lg" variant="muted">
          <p className="text-sm text-[var(--text-secondary)]">
            {valuation?.statusReason ?? (
              <>
                Orientační rozpětí modelu: <strong>{NEU}</strong>. Pro tuto
                nemovitost zatím není k dispozici vypočtený modelovaný odhad.
              </>
            )}
          </p>
        </Card>
      )}

      {valuation?.locationMarketContext ? (
        <Card className="mt-4" padding="md" elevation="flat">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Lokální cenová hladina (kontext — ne náhrada comparables)
            </p>
            <DataSourceBadge kind="majetio_estimate" size="sm" detail="agregace" />
          </div>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-[var(--text-muted)]">Medián nabídky</dt>
              <dd className="font-metric font-medium">
                {valuation.locationMarketContext.medianAskingPriceSqm != null
                  ? `${Math.round(valuation.locationMarketContext.medianAskingPriceSqm).toLocaleString("cs-CZ")} Kč/m²`
                  : NEU}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Medián transakcí</dt>
              <dd className="font-metric font-medium">
                {valuation.locationMarketContext.medianTransactionPriceSqm != null
                  ? `${Math.round(valuation.locationMarketContext.medianTransactionPriceSqm).toLocaleString("cs-CZ")} Kč/m²`
                  : NEU}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Trend YoY</dt>
              <dd className="font-metric font-medium">
                {valuation.locationMarketContext.priceTrendYoYPct != null
                  ? `${valuation.locationMarketContext.priceTrendYoYPct.toFixed(1)} %`
                  : NEU}
              </dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            {valuation.locationMarketContext.period} ·{" "}
            {valuation.locationMarketContext.disclaimer}
          </p>
        </Card>
      ) : null}

      <ContextualDisclaimer context="valuation" className="mt-4" compact>
        <p>
          {valuation?.disclaimer ??
            "Zobrazené hodnoty jsou modelovaný odhad a orientační rozpětí, nikoli oficiální ocenění."}
        </p>
        <p className="mt-1">
          <MethodologyLink topic="valuation" className="text-[var(--text-caption)]" />
        </p>
      </ContextualDisclaimer>
    </section>
  );
}
