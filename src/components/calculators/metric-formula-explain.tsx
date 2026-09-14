"use client";

import { HelpCircle } from "lucide-react";

import { MetricCard } from "@/components/data-display/metric-card";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/overlays/dialog";
import { MetricExplanation } from "@/components/overlays/tooltip";
import { Button } from "@/components/ui/button";
import { getFormula, type FormulaKey } from "@/domains/investment/engine";
import {
  formatSubstitutionLines,
  type MetricDisplay,
} from "@/domains/investment/hooks/scenario-view-model";
import type { OrchestratedCalculationResult } from "@/domains/investment/service/types";

const KEY_FORMULAS = [
  "net_yield",
  "noi",
  "gross_yield",
  "monthly_cash_flow",
  "equity_required",
  "total_acquisition_cost",
] as const satisfies readonly FormulaKey[];

export type ExplainableFormulaKey = (typeof KEY_FORMULAS)[number];

export function isExplainableFormulaKey(
  key: string,
): key is ExplainableFormulaKey {
  return (KEY_FORMULAS as readonly string[]).includes(key);
}

export function MetricFormulaBody({
  formulaKey,
  result,
}: {
  formulaKey: FormulaKey | string;
  result: OrchestratedCalculationResult;
}) {
  const formula = getFormula(formulaKey);
  const substitutions = formatSubstitutionLines(result, formulaKey);

  if (!formula) {
    return (
      <p className="text-sm text-[var(--text-secondary)]">
        Vzorec pro tuto metriku není v registry.
      </p>
    );
  }

  return (
    <div className="space-y-3 text-sm text-[var(--text-secondary)]">
      <p>{formula.description}</p>
      <p className="rounded-[var(--radius-md)] bg-[var(--background-secondary)] px-3 py-2 font-metric text-[var(--text-primary)]">
        {formula.formulaText}
      </p>
      {substitutions.length > 0 ? (
        <ul className="list-inside list-disc space-y-1">
          {substitutions.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
      <p className="text-[var(--text-caption)] text-[var(--text-muted)]">
        Verze vzorce {formula.formulaVersion}
      </p>
    </div>
  );
}

/** Dialog explainability backed by formula registry. */
export function MetricFormulaExplain({
  formulaKey,
  result,
  label,
}: {
  formulaKey: FormulaKey | string;
  result: OrchestratedCalculationResult;
  label: string;
}) {
  const formula = getFormula(formulaKey);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Vysvětlení: ${label}`}
        >
          <HelpCircle className="size-4" aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent
        title={formula?.name ?? label}
        description="Jak Majetio počítá tuto metriku"
      >
        <MetricFormulaBody formulaKey={formulaKey} result={result} />
      </DialogContent>
    </Dialog>
  );
}

export function ExplainedMetricCard({
  display,
  result,
  className,
}: {
  display: MetricDisplay;
  result: OrchestratedCalculationResult;
  className?: string;
}) {
  return (
    <div className={className}>
      <MetricCard
        title={display.label}
        value={display.displayValue}
        tone={display.tone}
        explainTrigger={
          <MetricFormulaExplain
            formulaKey={display.formulaKey}
            result={result}
            label={display.label}
          />
        }
      />
      <div className="mt-2 sm:hidden">
        <MetricExplanation title={`Jak počítáme: ${display.label}`}>
          <MetricFormulaBody
            formulaKey={display.formulaKey}
            result={result}
          />
        </MetricExplanation>
      </div>
    </div>
  );
}
