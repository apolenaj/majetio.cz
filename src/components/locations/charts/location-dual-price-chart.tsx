"use client";

import {
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
import { chartPalette } from "@/design-system/tokens";
import { formatCzk } from "@/lib/format";
import type { LocationChartSeries } from "@/components/locations/types";

type DualPoint = {
  label: string;
  [seriesKey: string]: string | number;
};

function mergeSeries(series: LocationChartSeries[]): DualPoint[] {
  const map = new Map<string, DualPoint>();
  for (const s of series) {
    for (const p of s.points) {
      const row = map.get(p.label) ?? { label: p.label };
      row[s.key] = p.value;
      map.set(p.label, row);
    }
  }
  return [...map.values()];
}

export function LocationDualPriceChart({
  title,
  description,
  period,
  source,
  updatedAt,
  unit = "CZK/m²",
  series,
  summary,
}: {
  title: string;
  description?: string;
  period: string;
  source: string;
  updatedAt: string;
  unit?: string;
  series: LocationChartSeries[];
  summary: string;
}) {
  const data = mergeSeries(series);
  const empty = data.length === 0 || series.every((s) => s.points.length === 0);

  return (
    <ChartShell
      title={title}
      description={description}
      unit={unit}
      period={period}
      source={source}
      updatedAt={updatedAt}
      summary={summary}
      empty={empty}
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
          <Tooltip
            formatter={(value, name) => [formatCzk(Number(value)), String(name)]}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--border-default)",
              background: "var(--surface-primary)",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {series.map((s, i) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color ?? chartPalette[i % chartPalette.length]}
              strokeWidth={2}
              dot={false}
              strokeDasharray={s.key.includes("transaction") ? "6 4" : undefined}
            />
          ))}
        </ReLineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function LocationSingleMetricChart({
  title,
  period,
  source,
  updatedAt,
  unit,
  points,
  seriesLabel,
  summary,
}: {
  title: string;
  period: string;
  source: string;
  updatedAt: string;
  unit: string;
  points: { label: string; value: number }[];
  seriesLabel: string;
  summary: string;
}) {
  return (
    <LocationDualPriceChart
      title={title}
      period={period}
      source={source}
      updatedAt={updatedAt}
      unit={unit}
      summary={summary}
      series={[{ key: "value", label: seriesLabel, points }]}
    />
  );
}
