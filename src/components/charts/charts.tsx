"use client";

import {
  Bar,
  BarChart as ReBarChart,
  CartesianGrid,
  Line,
  LineChart as ReLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/states";
import { LoadingSkeleton } from "@/components/feedback/states";
import { DataSource } from "@/components/overlays/tooltip";
import { chartPalette } from "@/design-system/tokens";
import { formatCzk } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ChartShell({
  title,
  description,
  unit,
  period,
  source,
  updatedAt,
  loading,
  empty,
  error,
  summary,
  children,
  className,
}: {
  title: string;
  description?: string;
  unit?: string;
  period?: string;
  source?: string;
  updatedAt?: string;
  loading?: boolean;
  empty?: boolean;
  error?: string;
  summary: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn(className)} padding="md">
      <CardHeader>
        <CardTitle as="h3">{title}</CardTitle>
        {(description || unit || period) && (
          <CardDescription>
            {[description, unit ? `Jednotka: ${unit}` : null, period].filter(Boolean).join(" · ")}
          </CardDescription>
        )}
      </CardHeader>
      <p className="sr-only">{summary}</p>
      <p className="mb-3 text-sm text-[var(--text-secondary)]" aria-hidden={false}>
        {summary}
      </p>
      {loading ? <LoadingSkeleton lines={5} /> : null}
      {error ? (
        <p className="text-sm text-[var(--status-error)]" role="alert">
          {error}
        </p>
      ) : null}
      {!loading && !error && empty ? (
        <EmptyState title="Žádná data k zobrazení" description="Pro tento graf zatím nejsou dostupná data." />
      ) : null}
      {!loading && !error && !empty ? <div className="h-64 w-full">{children}</div> : null}
      {source ? <DataSource className="mt-4" source={source} updatedAt={updatedAt} /> : null}
    </Card>
  );
}

type SeriesPoint = { label: string; value: number };

export function LineChart({
  data,
  title,
  summary,
  ...shell
}: {
  data: SeriesPoint[];
  title: string;
  summary: string;
} & Omit<React.ComponentProps<typeof ChartShell>, "children" | "title" | "summary" | "empty">) {
  return (
    <ChartShell title={title} summary={summary} empty={data.length === 0} {...shell}>
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
            formatter={(value) => formatCzk(Number(value))}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--border-default)",
              background: "var(--surface-primary)",
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={chartPalette[0]}
            strokeWidth={2}
            dot={false}
            name="Hodnota"
          />
        </ReLineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function BarChart({
  data,
  title,
  summary,
  ...shell
}: {
  data: SeriesPoint[];
  title: string;
  summary: string;
} & Omit<React.ComponentProps<typeof ChartShell>, "children" | "title" | "summary" | "empty">) {
  return (
    <ChartShell title={title} summary={summary} empty={data.length === 0} {...shell}>
      <ResponsiveContainer width="100%" height="100%">
        <ReBarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border-default)" strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
          <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} width={48} />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--border-default)",
              background: "var(--surface-primary)",
            }}
          />
          <Bar dataKey="value" fill={chartPalette[1]} radius={[4, 4, 0, 0]} name="Hodnota" />
        </ReBarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}
