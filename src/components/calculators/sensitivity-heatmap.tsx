"use client";

import * as React from "react";

import { runTwoWaySensitivity } from "@/domains/investment/engine";
import type { RiskBaseCase } from "@/domains/investment/engine";
import { track } from "@/lib/analytics/events";
import { formatCzk } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card, CardTitle } from "@/components/ui/card";

/**
 * Accessible 2-way sensitivity heatmap — numbers in every cell (not color-only).
 */
export function SensitivityHeatmap({
  base,
}: {
  base: RiskBaseCase | null;
}) {
  const trackedRef = React.useRef(false);
  React.useEffect(() => {
    if (!base || trackedRef.current) return;
    trackedRef.current = true;
    track({
      name: "sensitivity_opened",
      props: { surface: "heatmap" },
    });
  }, [base]);
  if (!base) {
    return (
      <Card elevation="flat">
        <CardTitle className="mb-2 text-base">Citlivost (úrok × nájem)</CardTitle>
        <p className="text-sm text-[var(--text-secondary)]">
          Doplňte vstupy pro výpočet citlivostní matice.
        </p>
      </Card>
    );
  }

  const shocksRate = [-1, 0, 1, 2];
  const shocksEgi = [-0.1, 0, 0.1];
  const result = runTwoWaySensitivity({
    base,
    factorA: "interest_rate_pp",
    factorB: "egi",
    shocksA: shocksRate,
    shocksB: shocksEgi,
  });

  const values = result.grid.map((c) => c.annualCashFlowMajor);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);

  function cellBg(v: number): string {
    const t = (v - min) / span;
    if (v < 0) {
      return `color-mix(in srgb, var(--investment-negative) ${Math.round((1 - t) * 35)}%, white)`;
    }
    return `color-mix(in srgb, var(--investment-positive) ${Math.round(t * 35)}%, white)`;
  }

  return (
    <Card elevation="flat" className="overflow-x-auto">
      <CardTitle className="mb-2 text-base">Citlivost — roční CF</CardTitle>
      <p className="mb-3 text-sm text-[var(--text-secondary)]">
        Úrok (řádky) × změna nájmu/EGI (sloupce). Každá buňka obsahuje číslo —
        barva je jen doplněk.
      </p>
      <table className="w-full min-w-[28rem] border-collapse text-sm">
        <caption className="sr-only">
          Matice citlivosti ročního cash flow podle úroku a změny nájmu
        </caption>
        <thead>
          <tr>
            <th className="border border-[var(--border-default)] p-2 text-left text-[var(--text-caption)]">
              Úrok Δ / EGI
            </th>
            {shocksEgi.map((s) => (
              <th
                key={s}
                className="border border-[var(--border-default)] p-2 text-center font-metric text-[var(--text-caption)]"
              >
                {s === 0 ? "0 %" : `${s > 0 ? "+" : ""}${(s * 100).toFixed(0)} %`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shocksRate.map((rate) => (
            <tr key={rate}>
              <th className="border border-[var(--border-default)] p-2 text-left font-metric">
                {rate === 0 ? "0 p.b." : `${rate > 0 ? "+" : ""}${rate} p.b.`}
              </th>
              {shocksEgi.map((egi) => {
                const cell = result.grid.find(
                  (c) => c.shockA === rate && c.shockB === egi,
                )!;
                const v = cell.annualCashFlowMajor;
                return (
                  <td
                    key={`${rate}-${egi}`}
                    className={cn(
                      "border border-[var(--border-default)] p-2 text-center font-metric tabular-nums",
                      v < 0
                        ? "text-[var(--investment-negative)]"
                        : "text-[var(--text-primary)]",
                    )}
                    style={{ background: cellBg(v) }}
                  >
                    <span className="sr-only">
                      Úrok {rate} p.b., EGI {egi * 100} %, roční CF{" "}
                    </span>
                    {formatCzk(Math.round(v), { signed: true })}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
