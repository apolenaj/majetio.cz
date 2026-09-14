"use client";

import {
  Bar,
  BarChart as ReBarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart as ReLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartShell } from "@/components/charts/charts";
import { Card, CardTitle } from "@/components/ui/card";
import type {
  CashFlowBreakdownView,
  EquityGrowthView,
  ProjectionChartView,
  ReturnDecompositionView,
} from "@/domains/investment/hooks/chart-view-models";
import { chartPalette } from "@/design-system/tokens";
import { formatCzk } from "@/lib/format";
import { cn } from "@/lib/utils";

export function CashFlowCallout({ view }: { view: CashFlowBreakdownView }) {
  const toneClass = {
    positive: "border-[var(--investment-positive)] text-[var(--investment-positive)]",
    negative: "border-[var(--investment-negative)] text-[var(--investment-negative)]",
    neutral: "border-[var(--border-default)] text-[var(--text-primary)]",
    unavailable: "border-[var(--border-default)] text-[var(--text-secondary)]",
  }[view.callout.tone];

  return (
    <Card
      elevation="flat"
      className={cn("border-l-4 px-4 py-3", toneClass)}
    >
      <p className="font-metric text-lg font-semibold">{view.callout.headline}</p>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        {view.callout.detail}
      </p>
    </Card>
  );
}

export function CashFlowBreakdownChart({
  view,
}: {
  view: CashFlowBreakdownView;
}) {
  return (
    <ChartShell
      title="Měsíční cash flow — rozklad"
      summary="Sloupcový rozklad příjmu, provozu, splátky a výsledného CF."
      description="Příjem, provozní náklady, debt service a výsledné CF"
      unit="Kč / měsíc"
      period="Měsíc 1 (model)"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ReBarChart data={view.barSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border-default)" strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
          <YAxis
            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
            tickFormatter={(v: number) => formatCzk(v).replace(/\s?Kč$/, "")}
            width={72}
          />
          <Tooltip formatter={(value) => formatCzk(Number(value))} />
          <Bar dataKey="value" fill={chartPalette[1]} radius={[4, 4, 0, 0]} name="Kč" />
        </ReBarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function AnnualProjectionChart({
  view,
}: {
  view: ProjectionChartView;
}) {
  const data = view.rows.map((r) => ({
    label: `R${r.year}`,
    propertyValue: r.propertyValue,
    loanBalance: r.loanBalance,
    equity: r.equity,
  }));

  return (
    <ChartShell
      title="Roční projekce"
      summary={view.summary}
      description="Hodnota nemovitosti, zůstatek úvěru a equity — oddělené řady (nesčítané)"
      unit="Kč"
      period={`Roky 1–${view.rows.length}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ReLineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border-default)" strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
          <YAxis
            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
            tickFormatter={(v: number) => formatCzk(v).replace(/\s?Kč$/, "")}
            width={72}
          />
          <Tooltip formatter={(value) => formatCzk(Number(value))} />
          <Legend />
          <Line
            type="monotone"
            dataKey="propertyValue"
            name="Hodnota"
            stroke={chartPalette[0]}
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="loanBalance"
            name="Úvěr"
            stroke={chartPalette[2]}
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="equity"
            name="Equity"
            stroke={chartPalette[1]}
            strokeWidth={2}
            dot={false}
          />
        </ReLineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function EquityGrowthBreakdown({
  view,
}: {
  view: EquityGrowthView;
}) {
  return (
    <Card elevation="flat">
      <CardTitle className="mb-3 text-base">Růst equity — rozpad</CardTitle>
      <ul className="space-y-2 text-sm">
        {view.segments.map((s) => (
          <li
            key={s.key}
            className="flex items-baseline justify-between gap-3 border-b border-[var(--border-default)] py-2 last:border-0"
          >
            <span className="text-[var(--text-secondary)]">
              {s.label}
              {s.modeled ? (
                <span className="ml-1 text-[var(--text-caption)] text-[var(--text-muted)]">
                  (model)
                </span>
              ) : null}
            </span>
            <span className="font-metric">{formatCzk(s.amount)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex justify-between border-t border-[var(--border-default)] pt-3 font-medium">
        <span>Equity na konci</span>
        <span className="font-metric">{formatCzk(view.total)}</span>
      </div>
    </Card>
  );
}

export function ReturnDecomposition({
  view,
}: {
  view: ReturnDecompositionView;
}) {
  return (
    <Card elevation="flat">
      <CardTitle className="mb-3 text-base">Rozklad výnosu</CardTitle>
      <p className="mb-3 text-sm text-[var(--text-secondary)]">
        Operating CF, splácení dluhu, appreciation a prodej — modelované složky.
      </p>
      <ul className="space-y-2 text-sm">
        {view.segments.map((s) => (
          <li
            key={s.key}
            className="flex items-baseline justify-between gap-3 border-b border-[var(--border-default)] py-2 last:border-0"
          >
            <span className="text-[var(--text-secondary)]">
              {s.label}
              {s.modeled ? (
                <span className="ml-1 text-[var(--text-caption)] text-[var(--text-muted)]">
                  (model)
                </span>
              ) : null}
            </span>
            <span className="font-metric">
              {formatCzk(s.amount, { signed: true })}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
