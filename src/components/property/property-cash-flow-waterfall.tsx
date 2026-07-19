import { formatCzk } from "@/lib/format";
import type { CashFlowWaterfallDemo } from "@/content/demo-property-financial";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const NEU = "Neuvedeno";

type Row = {
  key: string;
  label: string;
  amount: number | null;
  kind: "in" | "out" | "total";
};

/**
 * Simple horizontal cash-flow waterfall (Nájem − náklady − splátka = CF).
 * CSS-only — no 3D, no Recharts dependency.
 */
export function PropertyCashFlowWaterfall({
  waterfall,
}: {
  waterfall: CashFlowWaterfallDemo | null;
}) {
  if (!waterfall) {
    return (
      <Card padding="lg" variant="muted">
        <CardHeader>
          <CardTitle as="h3">Cash flow waterfall</CardTitle>
          <CardDescription>
            Rozklad nájem → náklady → cash flow
          </CardDescription>
        </CardHeader>
        <p className="text-sm text-[var(--text-secondary)]">
          Waterfall: <strong>{NEU}</strong>. Pro tuto nabídku nejsou dostupná
          demonstrační data rozkladu.
        </p>
      </Card>
    );
  }

  const rows: Row[] = [
    {
      key: "rent",
      label: "Nájem",
      amount: waterfall.rentMonthlyCzk,
      kind: "in",
    },
    {
      key: "opex",
      label: "Provozní náklady",
      amount: -Math.abs(waterfall.operatingCostsMonthlyCzk),
      kind: "out",
    },
    {
      key: "mortgage",
      label: "Orientační splátka",
      amount:
        waterfall.mortgageMonthlyCzk == null
          ? null
          : -Math.abs(waterfall.mortgageMonthlyCzk),
      kind: "out",
    },
    {
      key: "cf",
      label: "Cash flow",
      amount: waterfall.cashFlowMonthlyCzk,
      kind: "total",
    },
  ];

  const maxAbs = Math.max(
    ...rows
      .map((r) => (r.amount != null ? Math.abs(r.amount) : 0))
      .filter((n) => n > 0),
    1,
  );

  return (
    <Card padding="lg">
      <CardHeader>
        <CardTitle as="h3">Cash flow waterfall</CardTitle>
        <CardDescription>
          Nájem − náklady (− splátka) = měsíční cash flow
        </CardDescription>
      </CardHeader>

      <ul className="space-y-3" aria-label="Rozklad cash flow">
        {rows.map((row) => {
          const missing = row.amount == null;
          const widthPct = missing
            ? 0
            : Math.max((Math.abs(row.amount!) / maxAbs) * 100, 4);
          const positive = (row.amount ?? 0) >= 0;

          return (
            <li key={row.key} className="grid gap-1 sm:grid-cols-[10rem_1fr_7rem] sm:items-center">
              <span className="text-sm font-medium text-[var(--text-secondary)]">
                {row.label}
              </span>
              <div className="h-3 overflow-hidden rounded-full bg-[var(--background-secondary)]">
                {!missing ? (
                  <div
                    className={cn(
                      "h-full rounded-full",
                      row.kind === "total"
                        ? positive
                          ? "bg-[var(--investment-positive)]"
                          : "bg-[var(--investment-negative)]"
                        : row.kind === "in"
                          ? "bg-[var(--action-accent)]"
                          : "bg-[color-mix(in_srgb,var(--status-warning)_70%,var(--border-default))]",
                    )}
                    style={{ width: `${widthPct}%` }}
                  />
                ) : null}
              </div>
              <span
                className={cn(
                  "font-metric text-sm font-semibold tabular-nums sm:text-right",
                  missing && "text-[var(--text-muted)]",
                  !missing &&
                    row.kind === "total" &&
                    (positive
                      ? "text-[var(--investment-positive)]"
                      : "text-[var(--investment-negative)]"),
                  !missing && row.kind !== "total" && "text-[var(--text-primary)]",
                )}
              >
                {missing
                  ? NEU
                  : formatCzk(row.amount!, { signed: true })}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-5 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--background-secondary)] p-3">
        <p className="text-caption font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Vstupy (explainability)
        </p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {waterfall.inputsNote}
        </p>
        <dl className="mt-3 grid gap-1 text-xs text-[var(--text-muted)] sm:grid-cols-3">
          <div>
            <dt>Nájem</dt>
            <dd className="font-metric text-[var(--text-secondary)]">
              {formatCzk(waterfall.rentMonthlyCzk)}
            </dd>
          </div>
          <div>
            <dt>Náklady</dt>
            <dd className="font-metric text-[var(--text-secondary)]">
              {formatCzk(waterfall.operatingCostsMonthlyCzk)}
            </dd>
          </div>
          <div>
            <dt>Splátka</dt>
            <dd className="font-metric text-[var(--text-secondary)]">
              {waterfall.mortgageMonthlyCzk != null
                ? formatCzk(waterfall.mortgageMonthlyCzk)
                : NEU}
            </dd>
          </div>
        </dl>
      </div>
    </Card>
  );
}
