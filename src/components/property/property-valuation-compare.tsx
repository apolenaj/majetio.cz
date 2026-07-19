import { formatCzk } from "@/lib/format";
import type { PublicValuationDto, AnalystValuationDto } from "@/domains/valuation";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricValue } from "@/components/data-display/metric-card";
import { cn } from "@/lib/utils";

const NEU = "Neuvedeno";

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

function confidenceTone(
  level: PublicValuationDto["confidenceLevel"],
): "success" | "warning" | "neutral" {
  if (level === "HIGH") return "success";
  if (level === "LOW" || level === "INSUFFICIENT") return "warning";
  return "neutral";
}

function confidenceLabelCz(level: PublicValuationDto["confidenceLevel"]): string {
  switch (level) {
    case "HIGH":
      return "Vysoká";
    case "MEDIUM":
      return "Střední";
    case "LOW":
      return "Nízká";
    case "INSUFFICIENT":
      return "Nedostatečná";
    default:
      return "Neznámá";
  }
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
      <h2
        id="valuation-compare-heading"
        className="font-display text-xl text-[var(--text-primary)] sm:text-2xl"
      >
        Cena vs. odhad hodnoty
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
        Porovnání nabídkové ceny se středním odhadem Majetio. Chybějící hodnoty
        nejsou nahrazovány nulou.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Card padding="lg" elevation="raised">
          <p className="text-caption uppercase tracking-wide text-[var(--text-muted)]">
            Nabídková cena
          </p>
          <MetricValue
            size="xl"
            value={askingPrice != null ? formatCzk(askingPrice) : NEU}
          />
        </Card>
        <Card padding="lg" elevation="raised">
          <p className="text-caption uppercase tracking-wide text-[var(--text-muted)]">
            Střední odhad
          </p>
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
                ? "Na úrovni středu odhadu"
                : deltaCzk > 0
                  ? `Nabídka je o ${formatCzk(deltaCzk)} (+${deltaPct} %) nad středem`
                  : `Nabídka je o ${formatCzk(Math.abs(deltaCzk))} (${deltaPct} %) pod středem`}
            </p>
          ) : null}
        </Card>
      </div>

      {hasRange && valuation ? (
        <Card className="mt-4" padding="lg">
          <CardHeader>
            <CardTitle as="h3">Interval odhadu</CardTitle>
            <CardDescription>
              Dolní — střed — horní pásmo oproti aktuální nabídkové ceně
            </CardDescription>
          </CardHeader>

          <div className="relative mt-2 h-16">
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

          <div className="mt-16 flex flex-wrap items-start gap-3 border-t border-[var(--border-default)] pt-4">
            <Badge tone={confidenceTone(valuation.confidenceLevel)}>
              Spolehlivost: {confidenceLabelCz(valuation.confidenceLevel)}
            </Badge>
            <div className="min-w-0 flex-1 space-y-1 text-sm text-[var(--text-secondary)]">
              {valuation.confidenceExplanations.length > 0 ? (
                valuation.confidenceExplanations.map((line) => (
                  <p key={line}>{line}</p>
                ))
              ) : (
                <p>{NEU}</p>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <Card className="mt-4" padding="lg" variant="muted">
          <p className="text-sm text-[var(--text-secondary)]">
            {valuation?.statusReason ?? (
              <>
                Interval odhadu hodnoty: <strong>{NEU}</strong>. Pro tuto
                nemovitost zatím není k dispozici vypočtený odhad.
              </>
            )}
          </p>
        </Card>
      )}
    </section>
  );
}
