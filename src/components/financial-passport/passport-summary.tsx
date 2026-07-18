import { StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCzk, formatDateTime, formatPercentPoints } from "@/lib/format";
import {
  PROPERTY_TYPE_OPTIONS,
  financingLabel,
  goalLabel,
  latestPassportTimestamp,
  riskLabel,
  type PassportState,
} from "@/lib/financial-passport/types";
import { INVESTMENT_STRATEGY_OPTIONS } from "@/lib/onboarding/types";
import { cn } from "@/lib/utils";

export function PassportSummaryCard({
  state,
  compact = false,
  className,
}: {
  state: PassportState;
  compact?: boolean;
  className?: string;
}) {
  const savedAt = latestPassportTimestamp(state.timestamps);
  const strategyLabels = state.strategies
    .map((id) => INVESTMENT_STRATEGY_OPTIONS.find((o) => o.id === id)?.label ?? id)
    .join(", ");

  const rows: { label: string; value: string }[] = [
    { label: "Cíl", value: goalLabel(state.goal) },
    {
      label: "Rozpočet",
      value: state.maxPriceCzk != null ? formatCzk(state.maxPriceCzk) : "—",
    },
    {
      label: "Vlastní zdroje",
      value:
        state.availableEquityCzk != null
          ? formatCzk(state.availableEquityCzk)
          : state.equityPercent != null
            ? formatPercentPoints(state.equityPercent)
            : "—",
    },
    { label: "Financování", value: financingLabel(state.financingMode) },
    {
      label: "Lokalita",
      value:
        [state.preferredCity, ...state.regions].filter(Boolean).join(" · ") || "—",
    },
    {
      label: "Typ nemovitosti",
      value: state.propertyTypes.length
        ? state.propertyTypes
            .map((t) => PROPERTY_TYPE_OPTIONS.find((o) => o.id === t)?.label ?? t)
            .join(", ")
        : "—",
    },
  ];

  if (!compact) {
    rows.push(
      { label: "Tolerance rizika", value: riskLabel(state.riskTolerance) },
      { label: "Strategie", value: strategyLabels || "—" },
      {
        label: "Příjem (volitelné)",
        value: state.monthlyIncomeCzk != null ? formatCzk(state.monthlyIncomeCzk) : "—",
      },
    );
  }

  return (
    <Card className={cn(className)} padding="lg" variant="muted">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>Shrnutí pasu</CardTitle>
          <CardDescription>
            Naposledy uloženo: {formatDateTime(savedAt)}
          </CardDescription>
        </div>
        <StatusBadge tone="info">Upravitelný přehled</StatusBadge>
      </CardHeader>

      <dl className="mt-4 space-y-2 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-4">
            <dt className="text-[var(--text-muted)]">{row.label}</dt>
            <dd className="text-right font-medium text-[var(--text-primary)]">{row.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5">
        <ButtonLink href="/ucet/financni-profil" variant="secondary" fullWidth={compact}>
          Upravit Finanční pas
        </ButtonLink>
      </div>
    </Card>
  );
}
