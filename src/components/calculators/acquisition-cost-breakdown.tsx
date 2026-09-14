"use client";

import { acquisitionBreakdownFromResult } from "@/domains/investment/hooks";
import type { OrchestratedCalculationResult } from "@/domains/investment/service";
import { Card, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AcquisitionCostBreakdown({
  result,
  className,
}: {
  result: OrchestratedCalculationResult;
  className?: string;
}) {
  const { lines, total } = acquisitionBreakdownFromResult(result);

  if (lines.length === 0) {
    return (
      <Card className={cn(className)} elevation="flat">
        <CardTitle className="mb-2 text-base">Pořizovací náklady</CardTitle>
        <p className="text-sm text-[var(--text-secondary)]">
          Zadejte kupní cenu — rozpad Total Acquisition Cost se zobrazí zde.
          Chybějící položky se nepočítají jako nula.
        </p>
      </Card>
    );
  }

  return (
    <Card className={cn(className)} elevation="flat">
      <CardTitle className="mb-4 text-base">
        Rozpad pořizovacích nákladů
      </CardTitle>
      <ul className="space-y-2 text-sm">
        {lines.map((line) => (
          <li
            key={line.key}
            className="flex items-baseline justify-between gap-4 border-b border-[var(--border-default)] py-2 last:border-0"
          >
            <span className="text-[var(--text-secondary)]">{line.label}</span>
            <span className="font-metric text-[var(--text-primary)]">
              {line.amount}
            </span>
          </li>
        ))}
      </ul>
      {total ? (
        <div className="mt-3 flex items-baseline justify-between gap-4 border-t border-[var(--border-default)] pt-3">
          <span className="font-medium text-[var(--text-primary)]">Celkem (TAC)</span>
          <span className="font-metric text-base font-semibold text-[var(--text-primary)]">
            {total}
          </span>
        </div>
      ) : null}
    </Card>
  );
}
