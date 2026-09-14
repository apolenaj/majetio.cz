import type { OperationsKpis } from "@/domains/administration";
import { Card } from "@/components/ui/card";

function pct(rate: number | null): string {
  if (rate == null) return "—";
  return `${Math.round(rate * 100)}%`;
}

function KpiCard(props: { label: string; value: string; hint?: string }) {
  return (
    <Card elevation="flat" className="p-4">
      <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
        {props.label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
        {props.value}
      </p>
      {props.hint ? (
        <p className="mt-1 text-xs text-[var(--text-secondary)]">{props.hint}</p>
      ) : null}
    </Card>
  );
}

export function OperationsKpiStrip(props: { kpis: OperationsKpis }) {
  const { kpis } = props;
  if (kpis.error) {
    return (
      <p className="text-sm text-[var(--status-warning)]">
        KPI nedostupná: {kpis.error}
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Active properties"
        value={String(kpis.activeProperties)}
        hint="PUBLIC · ACTIVE · non-demo"
      />
      <KpiCard
        label="DQ issue rate"
        value={
          kpis.dqIssueRate == null
            ? "—"
            : `${Math.round(kpis.dqIssueRate * 1000) / 10}‰`
        }
        hint={`${kpis.criticalDqOpen} critical open · ${kpis.openDqIssues} open`}
      />
      <KpiCard
        label="Import success"
        value={pct(kpis.importSuccessRate24h)}
        hint={`24h · 7d ${pct(kpis.importSuccessRate7d)}`}
      />
      <KpiCard
        label="Payments"
        value={`${kpis.paymentsFailed} failed`}
        hint={`${kpis.paymentsPending} pending`}
      />
    </div>
  );
}
