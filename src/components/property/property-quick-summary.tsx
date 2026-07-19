import type { PublicPropertyDto } from "@/domains/properties/service/dto";
import { formatCzk, formatCzkPerSqm, formatPercentPoints } from "@/lib/format";
import { Card } from "@/components/ui/card";

const UNAVAILABLE = "Analýza není dostupná";

const RISK_LABELS: Record<string, string> = {
  low: "Nízké",
  medium: "Střední",
  high: "Vysoké",
  critical: "Kritické",
  unknown: UNAVAILABLE,
};

type SummaryItem = {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative" | "muted";
};

function buildItems(
  property: PublicPropertyDto,
  estimatedValueMidCzk: number | null,
): SummaryItem[] {
  return [
    {
      label: "Nabídková cena",
      value:
        property.askingPrice != null
          ? formatCzk(property.askingPrice)
          : UNAVAILABLE,
      tone: property.askingPrice != null ? "neutral" : "muted",
    },
    {
      label: "Odhad hodnoty",
      value:
        estimatedValueMidCzk != null
          ? formatCzk(estimatedValueMidCzk)
          : UNAVAILABLE,
      tone: estimatedValueMidCzk != null ? "neutral" : "muted",
    },
    {
      label: "Cena za m²",
      value:
        property.pricePerSqm != null
          ? formatCzkPerSqm(property.pricePerSqm)
          : UNAVAILABLE,
      tone: property.pricePerSqm != null ? "neutral" : "muted",
    },
    {
      label: "Hrubý výnos",
      value:
        property.grossYieldPct != null
          ? formatPercentPoints(property.grossYieldPct, { signed: true })
          : UNAVAILABLE,
      tone:
        property.grossYieldPct == null
          ? "muted"
          : property.grossYieldPct >= 0
            ? "positive"
            : "negative",
    },
    {
      label: "Cash flow / měsíc",
      value:
        property.cashFlowMonthlyCzk != null
          ? formatCzk(property.cashFlowMonthlyCzk, { signed: true })
          : UNAVAILABLE,
      tone:
        property.cashFlowMonthlyCzk == null
          ? "muted"
          : property.cashFlowMonthlyCzk >= 0
            ? "positive"
            : "negative",
    },
    {
      label: "Riziko",
      value:
        property.risk != null
          ? (RISK_LABELS[property.risk] ?? UNAVAILABLE)
          : UNAVAILABLE,
      tone: property.risk == null || property.risk === "unknown" ? "muted" : "neutral",
    },
    {
      label: "Kvalita dat",
      value: property.dataQuality
        ? property.dataQuality === "verified"
          ? "Ověřená"
          : property.dataQuality === "estimated"
            ? "Odhad"
            : property.dataQuality === "incomplete"
              ? "Neúplná"
              : property.dataQuality === "stale"
                ? "Zastaralá"
                : property.dataQuality
        : UNAVAILABLE,
      tone: property.dataQuality ? "neutral" : "muted",
    },
    {
      label: "Aktuálnost",
      value:
        property.freshness === "FRESH"
          ? "Čerstvá"
          : property.freshness === "STALE"
            ? "Zastaralá"
            : property.freshness === "UNAVAILABLE"
              ? "Nedostupná"
              : UNAVAILABLE,
      tone: property.freshness ? "neutral" : "muted",
    },
  ];
}

export function PropertyQuickSummary({
  property,
  estimatedValueMidCzk = null,
}: {
  property: PublicPropertyDto;
  /** Mid estimate from demo overlay / engine — never invent */
  estimatedValueMidCzk?: number | null;
}) {
  const items = buildItems(property, estimatedValueMidCzk ?? null);

  return (
    <section aria-labelledby="quick-decision-heading">
      <h2
        id="quick-decision-heading"
        className="font-display text-xl text-[var(--text-primary)]"
      >
        Rychlé shrnutí pro rozhodnutí
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
        Klíčové metriky na jednom místě. Chybějící výpočty nejsou nahrazovány
        nulou — uvidíte jasnou informaci o nedostupnosti.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <Card key={item.label} padding="md" elevation="flat">
            <p className="text-[var(--text-caption)] uppercase tracking-wide text-[var(--text-muted)]">
              {item.label}
            </p>
            <p
              className={
                item.tone === "muted"
                  ? "mt-2 text-sm font-medium text-[var(--text-muted)]"
                  : item.tone === "positive"
                    ? "mt-2 font-metric text-lg font-semibold text-[var(--investment-positive)]"
                    : item.tone === "negative"
                      ? "mt-2 font-metric text-lg font-semibold text-[var(--investment-negative)]"
                      : "mt-2 font-metric text-lg font-semibold text-[var(--text-primary)]"
              }
            >
              {item.value}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}
