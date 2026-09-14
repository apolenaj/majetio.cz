"use client";

import * as React from "react";

import { LocationDualPriceChart, LocationSingleMetricChart } from "@/components/locations/charts/location-dual-price-chart";
import { LocationSegmentSwitcher } from "@/components/locations/charts/location-segment-switcher";
import { Grid } from "@/components/ui/layout-primitives";
import { chartPalette } from "@/design-system/tokens";
import type { LocationPriceTrendsProps } from "@/components/locations/types";

export function LocationPriceTrends({
  segments,
  defaultSegmentKey,
  priceHistoryBySegment,
  rentHistoryBySegment,
  periodLabel,
  source,
  updatedAt,
  methodologyHref,
}: LocationPriceTrendsProps) {
  const [segmentKey, setSegmentKey] = React.useState(defaultSegmentKey);

  const priceHistory = priceHistoryBySegment[segmentKey];
  const rentHistory = rentHistoryBySegment[segmentKey];
  const segmentLabel = segments.find((s) => s.key === segmentKey)?.label ?? segmentKey;

  const priceSeries = [
    priceHistory?.asking
      ? {
          key: "asking",
          label: "Nabídková cena (medián)",
          color: chartPalette[0],
          points: priceHistory.asking.points,
        }
      : null,
    priceHistory?.transaction
      ? {
          key: "transaction",
          label: "Transakční cena (medián)",
          color: chartPalette[2],
          points: priceHistory.transaction.points,
        }
      : null,
  ].filter(Boolean) as {
    key: string;
    label: string;
    color: string;
    points: { label: string; value: number }[];
  }[];

  return (
    <div className="space-y-6">
      <LocationSegmentSwitcher
        segments={segments}
        value={segmentKey}
        onChange={setSegmentKey}
      />

      <Grid cols={1} className="gap-6 lg:grid-cols-2">
        <LocationDualPriceChart
          title="Cena za m² v čase"
          description={`Segment: ${segmentLabel}. Nabídkové a transakční ceny jsou vždy oddělené série.`}
          period={periodLabel}
          source={source}
          updatedAt={updatedAt}
          unit="CZK/m²"
          series={priceSeries}
          summary={`Graf cen za m² pro ${segmentLabel}. ${
            priceSeries.length > 1
              ? "Plná čára = nabídková cena, čárkovaná = transakční."
              : "Zobrazena dostupná cenová série."
          }`}
        />

        {rentHistory ? (
          <LocationSingleMetricChart
            title="Nájem za m² v čase"
            period={periodLabel}
            source={source}
            updatedAt={updatedAt}
            unit="CZK/m²/měs."
            points={rentHistory.points}
            seriesLabel="Nabídkový nájem (medián)"
            summary={`Vývoj nabídkového nájmu za m² pro segment ${segmentLabel}.`}
          />
        ) : null}
      </Grid>

      <p className="text-xs text-[var(--text-muted)]">
        Trendy počítáme segmentově — nemícháme byty s domy ani asking s transakcemi.{" "}
        <a href={methodologyHref} className="text-[var(--text-link)] underline-offset-2 hover:underline">
          Metodika
        </a>
      </p>

      {/* Visible tabular alternative for charts (A11y) */}
      {priceSeries[0] || rentHistory ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <caption className="mb-2 text-left text-xs text-[var(--text-muted)]">
              Tabulkové shrnutí grafů cen a nájmů — segment {segmentLabel}
            </caption>
            <thead>
              <tr className="border-b border-[var(--border-default)] text-left">
                <th className="py-2 pr-3 font-medium text-[var(--text-muted)]">Období</th>
                {priceSeries.map((s) => (
                  <th key={s.key} className="py-2 pr-3 font-medium text-[var(--text-muted)]">
                    {s.label}
                  </th>
                ))}
                {rentHistory ? (
                  <th className="py-2 font-medium text-[var(--text-muted)]">Nájem</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {(priceSeries[0]?.points ?? rentHistory?.points ?? []).map((p, i) => (
                <tr key={p.label} className="border-b border-[var(--border-default)]">
                  <td className="py-2 pr-3 text-[var(--text-secondary)]">{p.label}</td>
                  {priceSeries.map((s) => (
                    <td key={s.key} className="py-2 pr-3 font-metric">
                      {s.points[i]?.value?.toLocaleString("cs-CZ") ?? "—"}
                    </td>
                  ))}
                  {rentHistory ? (
                    <td className="py-2 font-metric">
                      {rentHistory.points[i]?.value?.toLocaleString("cs-CZ") ?? "—"}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
