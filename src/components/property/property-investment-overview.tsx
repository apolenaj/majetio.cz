import { formatCzk, formatPercentPoints } from "@/lib/format";
import type { InvestmentOverviewDemo } from "@/content/demo-property-financial";
import type { InvestmentLocationBenchmark } from "@/domains/locations/integration/types";
import { LazyCashFlowWaterfall } from "@/components/property/property-detail-lazy";
import { MobileDisclosure } from "@/components/property/mobile-disclosure";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const NEU = "Neuvedeno";

function MetricCell({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative" | "muted";
}) {
  return (
    <Card padding="md" elevation="flat">
      <p className="text-caption uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-metric text-lg font-semibold",
          tone === "muted" && "text-sm font-medium text-[var(--text-muted)]",
          tone === "positive" && "text-[var(--investment-positive)]",
          tone === "negative" && "text-[var(--investment-negative)]",
          tone === "neutral" && "text-[var(--text-primary)]",
        )}
      >
        {value}
      </p>
    </Card>
  );
}

export function PropertyInvestmentOverview({
  investment,
  fallbackGrossYieldPct,
  fallbackCashFlowMonthlyCzk,
  locationBenchmark,
}: {
  investment: InvestmentOverviewDemo | null;
  fallbackGrossYieldPct?: number | null;
  fallbackCashFlowMonthlyCzk?: number | null;
  locationBenchmark?: InvestmentLocationBenchmark | null;
}) {
  const rent = investment?.estimatedRentMonthlyCzk ?? null;
  const gross =
    investment?.grossYieldPct ?? fallbackGrossYieldPct ?? null;
  const net = investment?.netYieldPct ?? null;
  const cf =
    investment?.cashFlowMonthlyCzk ?? fallbackCashFlowMonthlyCzk ?? null;

  return (
    <section aria-labelledby="investment-overview-heading">
      <h2
        id="investment-overview-heading"
        className="font-display text-xl text-[var(--text-primary)] sm:text-2xl"
      >
        Investiční přehled a cash flow
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
        Základní ekonomika nabídky. Chybějící výpočty ukazujeme jako „Neuvedeno“,
        nikoli jako nulu.
      </p>

      {locationBenchmark ? (
        <Card padding="md" elevation="flat" className="mt-4 border-dashed">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Benchmark lokality (návrh — nepřepisuje vaše vstupy)
          </p>
          <ul className="mt-2 space-y-1 text-sm text-[var(--text-secondary)]">
            {locationBenchmark.suggestedMonthlyRentCzk != null ? (
              <li>
                Nájem z lokality:{" "}
                <strong>{formatCzk(locationBenchmark.suggestedMonthlyRentCzk)}/měs.</strong>
              </li>
            ) : null}
            {locationBenchmark.locationGrossYieldPct != null ? (
              <li>
                Hrubý výnos v lokalitě:{" "}
                <strong>
                  {formatPercentPoints(locationBenchmark.locationGrossYieldPct)}
                </strong>
              </li>
            ) : null}
            {locationBenchmark.suggestedVacancyRatePp != null ? (
              <li>
                Proxy neobsazenosti:{" "}
                <strong>{formatPercentPoints(locationBenchmark.suggestedVacancyRatePp)}</strong>
              </li>
            ) : null}
          </ul>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            {locationBenchmark.period} · {locationBenchmark.disclaimer}
          </p>
        </Card>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCell
          label="Očekávaný nájem / měs."
          value={rent != null ? formatCzk(rent) : NEU}
          tone={rent == null ? "muted" : "neutral"}
        />
        <MetricCell
          label="Hrubý výnos"
          value={
            gross != null
              ? formatPercentPoints(gross, { signed: true })
              : NEU
          }
          tone={
            gross == null ? "muted" : gross >= 0 ? "positive" : "negative"
          }
        />
        <MetricCell
          label="Čistý výnos"
          value={
            net != null ? formatPercentPoints(net, { signed: true }) : NEU
          }
          tone={net == null ? "muted" : net >= 0 ? "positive" : "negative"}
        />
        <MetricCell
          label="Cash flow / měs."
          value={cf != null ? formatCzk(cf, { signed: true }) : NEU}
          tone={
            cf == null ? "muted" : cf >= 0 ? "positive" : "negative"
          }
        />
      </div>

      <div className="mt-6">
        <MobileDisclosure title="Cash flow waterfall (rozbalit)">
          <LazyCashFlowWaterfall waterfall={investment?.waterfall ?? null} />
        </MobileDisclosure>
      </div>
    </section>
  );
}
