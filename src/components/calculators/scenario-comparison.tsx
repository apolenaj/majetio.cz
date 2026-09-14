"use client";

import type { ScenarioComparisonView } from "@/domains/investment/hooks";
import { Card, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ScenarioComparison({
  view,
  className,
}: {
  view: ScenarioComparisonView;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-x-auto", className)} elevation="flat">
      <CardTitle className="mb-4 text-base">Porovnání scénářů</CardTitle>
      <p className="mb-4 text-sm text-[var(--text-secondary)]">
        Konzervativní, realistický (base) a optimistický výhled z pevných rozptylů
        enginu.
      </p>
      <table className="w-full min-w-[32rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--border-default)] text-left text-[var(--text-caption)] uppercase tracking-wide">
            <th className="py-2 pr-3 font-medium">Metrika</th>
            {view.columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "py-2 px-2 font-medium",
                  col.key === "base" && "text-[var(--text-primary)]",
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="font-metric text-[var(--text-primary)]">
          <tr className="border-b border-[var(--border-default)]">
            <td className="py-2.5 pr-3 text-[var(--text-secondary)]">NOI</td>
            {view.columns.map((col) => (
              <td key={`${col.key}-noi`} className="px-2 py-2.5">
                {col.noi}
              </td>
            ))}
          </tr>
          <tr className="border-b border-[var(--border-default)]">
            <td className="py-2.5 pr-3 text-[var(--text-secondary)]">
              Roční CF
            </td>
            {view.columns.map((col) => (
              <td key={`${col.key}-acf`} className="px-2 py-2.5">
                {col.annualCashFlow}
              </td>
            ))}
          </tr>
          <tr className="border-b border-[var(--border-default)]">
            <td className="py-2.5 pr-3 text-[var(--text-secondary)]">
              Měsíční CF
            </td>
            {view.columns.map((col) => (
              <td key={`${col.key}-mcf`} className="px-2 py-2.5">
                {col.monthlyCashFlow}
              </td>
            ))}
          </tr>
          <tr>
            <td className="py-2.5 pr-3 text-[var(--text-secondary)]">DSCR</td>
            {view.columns.map((col) => (
              <td key={`${col.key}-dscr`} className="px-2 py-2.5">
                {col.dscr}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </Card>
  );
}
