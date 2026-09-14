"use client";

/**
 * FinancingScenarioCompare — side-by-side comparison of
 * Cash / 60% LTV / 80% LTV scenarios.
 *
 * Shows how leverage reduces required equity but increases
 * rate sensitivity. Integrates with Investment Engine via InvestmentCalculatorInputs
 * so the parent can update CoC / DSCR / IRR dynamically.
 */

import { Info, TrendingUp } from "lucide-react";

import type { FinancingScenario } from "@/domains/financing";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCzk(czk: number): string {
  if (czk >= 1_000_000) {
    const mil = czk / 1_000_000;
    return mil % 1 === 0
      ? `${mil.toFixed(0)}\u00a0mil.\u00a0Kč`
      : `${mil.toFixed(1).replace(".", ",")}\u00a0mil.\u00a0Kč`;
  }
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(czk);
}

// ---------------------------------------------------------------------------
// Scenario card
// ---------------------------------------------------------------------------

function ScenarioCard({
  scenario,
  isSelected,
  onSelect,
}: {
  scenario: FinancingScenario;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full text-left rounded-[var(--radius-card)] border p-4 transition-all duration-[var(--duration-fast)]",
        isSelected
          ? "border-[var(--action-primary)] ring-1 ring-[var(--action-primary)] bg-[color-mix(in_srgb,var(--action-primary)_4%,white)]"
          : "border-[var(--border-default)] bg-[var(--surface-primary)] hover:shadow-[var(--shadow-raised)]",
      )}
      aria-pressed={isSelected}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-sm font-semibold text-[var(--text-primary)]">
          {scenario.label}
        </span>
        {scenario.ltvPct > 0 && (
          <span className="text-xs text-[var(--text-secondary)] shrink-0">
            {scenario.ltvPct}\u00a0%\u00a0LTV
          </span>
        )}
      </div>

      <dl className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <dt className="text-[var(--text-secondary)]">Vlastní kapitál</dt>
          <dd className="font-medium tabular-nums">{formatCzk(scenario.equityCzk)}</dd>
        </div>
        <div className="flex justify-between text-sm">
          <dt className="text-[var(--text-secondary)]">Úvěr</dt>
          <dd className="font-medium tabular-nums">
            {scenario.loanCzk === 0 ? "—" : formatCzk(scenario.loanCzk)}
          </dd>
        </div>
        {scenario.monthlyPaymentCzk !== null && scenario.monthlyPaymentCzk > 0 && (
          <div className="flex justify-between text-sm">
            <dt className="text-[var(--text-secondary)]">Splátka / měs</dt>
            <dd className="font-medium tabular-nums">
              {formatCzk(scenario.monthlyPaymentCzk)}
            </dd>
          </div>
        )}
      </dl>

      {/* Leverage insight */}
      <p className="mt-3 text-xs text-[var(--text-muted)] leading-relaxed">
        {scenario.leverageInsight}
      </p>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Leverage insight block
// ---------------------------------------------------------------------------

function LeverageInsightBlock({
  selectedScenario,
}: {
  selectedScenario: FinancingScenario;
}) {
  if (selectedScenario.kind === "cash") {
    return (
      <div className="flex items-start gap-2 rounded-[var(--radius-sm)] px-3 py-2.5 bg-[var(--background-secondary)]">
        <Info className="size-4 text-[var(--text-muted)] shrink-0 mt-0.5" aria-hidden />
        <p className="text-xs text-[var(--text-muted)]">
          Nákup za hotovost eliminuje úrokové riziko a zjednodušuje analýzu.
          Výnos na vlastní kapitál (CoC) je totožný s výnosem nemovitosti — vliv
          páky neexistuje.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 rounded-[var(--radius-sm)] px-3 py-2.5 bg-[color-mix(in_srgb,var(--status-info)_7%,white)] border border-[color-mix(in_srgb,var(--status-info)_20%,white)]">
      <TrendingUp
        className="size-4 text-[var(--status-info)] shrink-0 mt-0.5"
        aria-hidden
      />
      <div className="text-xs text-[var(--text-primary)] space-y-1">
        <p>
          <strong>Vliv páky:</strong> Nižší vlastní kapitál zvyšuje výnos na
          vložené prostředky (CoC), ale citlivost cash flow na změnu sazby roste.
        </p>
        <p>
          Zkuste posun sazby o +1 p.b. v citlivostní analýze — zobrazí se dopad
          na DSCR a IRR.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function FinancingScenarioCompare({
  scenarios,
  selectedKind,
  onSelect,
  className,
}: {
  scenarios: FinancingScenario[];
  selectedKind: string;
  onSelect: (kind: string) => void;
  className?: string;
}) {
  const selected = scenarios.find((s) => s.kind === selectedKind) ?? scenarios[0];

  return (
    <div className={cn("space-y-4", className)}>
      <h4 className="text-sm font-semibold text-[var(--text-primary)]">
        Porovnání způsobů financování
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {scenarios.map((scenario) => (
          <ScenarioCard
            key={scenario.kind}
            scenario={scenario}
            isSelected={scenario.kind === selectedKind}
            onSelect={() => onSelect(scenario.kind)}
          />
        ))}
      </div>

      {selected && <LeverageInsightBlock selectedScenario={selected} />}

      <p className="text-xs text-[var(--text-muted)]">
        Výběr scénáře předvyplní parametry investiční analýzy (kapitál, výše
        úvěru). Citlivostní analýza ukáže dopad +/−&nbsp;1&nbsp;p.b. na cash
        flow, CoC, DSCR a IRR.
      </p>
    </div>
  );
}
