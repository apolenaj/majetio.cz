"use client";

import { useMemo, useState } from "react";

import {
  SCENARIO_DELTAS,
  applyScenario,
  buildIncomeStatement,
  type ScenarioId,
} from "@/lib/calculators";

import { CalculatorFooterCta, CalculatorShell } from "../calculator-shell";
import { useInvestmentForm } from "./use-investment-form";
import {
  BarCompare,
  Breakdown,
  CrossLinks,
  Disclaimer,
  IntField,
  Kpi,
  ModeToggle,
  MoneyField,
  PercentField,
  ToolActions,
  moneyText,
  pctText,
  readQueryNumber,
} from "./ui";

export function CashFlowCalculator({
  initialQuery,
}: {
  initialQuery?: Record<string, string | string[] | undefined>;
}) {
  const form = useInvestmentForm({
    purchasePrice: readQueryNumber(initialQuery, "kupniCena") ?? undefined,
    monthlyRent: readQueryNumber(initialQuery, "najem") ?? undefined,
  });
  const [scenario, setScenario] = useState<ScenarioId>("base");
  const statement = useMemo(
    () => buildIncomeStatement(applyScenario(form.input, scenario)),
    [form.input, scenario],
  );
  const tone =
    statement.monthlyCashFlow == null
      ? "neutral"
      : statement.monthlyCashFlow >= 0
        ? "positive"
        : "negative";

  return (
    <CalculatorShell
      title="Cash flow nemovitosti"
      description="Zjistěte, kolik vám může nemovitost každý měsíc skutečně vydělávat nebo kolik budete doplácet."
      badge="Sdílený model NOI"
      breadcrumbs={[
        { href: "/", label: "Domů" },
        { href: "/analyzy-a-kalkulacky", label: "Analýzy a kalkulačky" },
        { label: "Cash flow" },
      ]}
      footer={<CalculatorFooterCta />}
    >
      <div className="calc-layout">
        <section className="calc-panel">
          <h2>Vstupy</h2>
          <ToolActions onDemo={form.loadDemo} onReset={form.reset} />
          <ModeToggle advanced={form.advanced} onChange={form.setAdvanced} />
          <MoneyField
            label="Kupní cena"
            value={form.input.purchasePrice}
            onChange={(purchasePrice) => form.patch({ purchasePrice })}
          />
          <MoneyField
            label="Měsíční nájem"
            value={form.input.monthlyRent}
            onChange={(monthlyRent) => form.patch({ monthlyRent })}
          />
          <div className="calc-grid-2">
            <MoneyField
              label="Vlastní prostředky"
              value={form.input.ownCapital}
              onChange={(ownCapital) => form.patch({ ownCapital })}
            />
            <MoneyField
              label="Výše úvěru"
              value={form.input.loanAmount ?? 0}
              onChange={(loanAmount) => form.patch({ loanAmount })}
            />
            <PercentField
              label="Úroková sazba p.a."
              value={form.input.annualInterestRate}
              onChange={(annualInterestRate) => form.patch({ annualInterestRate })}
            />
            <IntField
              label="Doba splatnosti (roky)"
              value={form.input.loanYears}
              onChange={(loanYears) => form.patch({ loanYears })}
            />
          </div>
          {form.advanced ? (
            <>
              <MoneyField
                label="Další měsíční příjem"
                value={form.input.otherMonthlyIncome}
                onChange={(otherMonthlyIncome) => form.patch({ otherMonthlyIncome })}
              />
              <div className="calc-grid-2">
                <MoneyField label="Fond oprav / HOA" value={form.input.monthlyHOA} onChange={(monthlyHOA) => form.patch({ monthlyHOA })} />
                <MoneyField label="Pojištění" value={form.input.insuranceMonthly} onChange={(insuranceMonthly) => form.patch({ insuranceMonthly })} />
                <MoneyField label="Údržba" value={form.input.maintenanceMonthly} onChange={(maintenanceMonthly) => form.patch({ maintenanceMonthly })} />
                <MoneyField label="Správa" value={form.input.managementMonthly} onChange={(managementMonthly) => form.patch({ managementMonthly })} />
                <MoneyField label="Ostatní měsíční náklady" value={form.input.otherOperatingMonthly} onChange={(otherOperatingMonthly) => form.patch({ otherOperatingMonthly })} />
                <MoneyField label="Roční daň / poplatky" value={form.input.annualPropertyTax} onChange={(annualPropertyTax) => form.patch({ annualPropertyTax })} />
              </div>
              <PercentField
                label="Vacancy rate"
                value={form.input.vacancyRate}
                onChange={(vacancyRate) => form.patch({ vacancyRate })}
              />
            </>
          ) : (
            <MoneyField
              label="Měsíční provozní náklady"
              value={form.input.monthlyOperatingLump}
              onChange={(monthlyOperatingLump) => form.patch({ monthlyOperatingLump })}
            />
          )}
        </section>

        <section className="calc-panel">
          <h2>Výsledky</h2>
          <div className="calc-mode">
            {(Object.keys(SCENARIO_DELTAS) as ScenarioId[]).map((id) => (
              <button
                key={id}
                type="button"
                className="tools-filter"
                aria-pressed={scenario === id}
                onClick={() => setScenario(id)}
              >
                {SCENARIO_DELTAS[id].label}
              </button>
            ))}
          </div>
          <p className="calc-assumptions">{SCENARIO_DELTAS[scenario].note}</p>
          <div className={`calc-result-hero calc-kpi-${tone}`}>
            <span>Měsíční cash flow</span>
            <strong>{moneyText(statement.monthlyCashFlow)}</strong>
            <p>
              {statement.monthlyCashFlow == null
                ? "Splátku nelze spočítat při zadané splatnosti."
                : statement.monthlyCashFlow >= 0
                  ? "Pozitivní měsíční cash flow při zadaných předpokladech."
                  : "Záporné měsíční cash flow při zadaných předpokladech."}
            </p>
          </div>
          <div className="calc-stats">
            <Kpi label="Roční cash flow" value={moneyText(statement.annualCashFlow)} tone={tone} />
            <Kpi label="Efektivní nájem" value={moneyText(statement.effectiveMonthlyRent)} />
            <Kpi label="Provozní náklady" value={moneyText(statement.monthlyOperatingCosts)} />
            <Kpi label="Splátka" value={moneyText(statement.monthlyDebtService)} hint="Anuitní splátka z jistiny, sazby a doby." />
            <Kpi label="NOI / měsíc" value={moneyText(statement.monthlyNoi)} hint="Čistý provozní příjem po nákladech, před splátkou." />
            <Kpi label="Hrubý výnos" value={pctText(statement.grossYieldPct)} hint="Roční nájem při plné obsazenosti dělený kupní cenou." />
          </div>
          <h3 className="calc-subhead">Jak jsme k výsledku došli</h3>
          <Breakdown
            rows={[
              { sign: "+", label: "Nájem", value: moneyText(statement.potentialMonthlyRent) },
              { sign: "+", label: "Další příjmy", value: moneyText(statement.otherMonthlyIncome) },
              { sign: "−", label: "Neobsazenost", value: moneyText(statement.vacancyLossMonthly) },
              { sign: "−", label: "Provozní náklady", value: moneyText(statement.monthlyOperatingCosts) },
              { sign: "−", label: "Splátka", value: moneyText(statement.monthlyDebtService) },
              { sign: "=", label: "Cash flow", value: moneyText(statement.monthlyCashFlow) },
            ]}
          />
          <BarCompare
            items={[
              { label: "Efektivní příjem", value: statement.effectiveMonthlyRent + statement.otherMonthlyIncome, display: moneyText(statement.effectiveMonthlyRent + statement.otherMonthlyIncome) },
              { label: "Náklady + splátka", value: statement.monthlyOperatingCosts + (statement.monthlyDebtService ?? 0), display: moneyText(statement.monthlyOperatingCosts + (statement.monthlyDebtService ?? 0)) },
            ]}
          />
          <p className="calc-assumptions">
            Použité předpoklady: sazba {pctText(applyScenario(form.input, scenario).annualInterestRate)} ·{" "}
            {applyScenario(form.input, scenario).loanYears} let · vacancy{" "}
            {pctText(applyScenario(form.input, scenario).vacancyRate, 1)}
          </p>
          {statement.issues.length > 0 ? (
            <p className="calc-assumptions">{statement.issues.map((issue) => issue.message).join(" ")}</p>
          ) : null}
          <CrossLinks links={[{ href: "/kalkulacky/investicni-vynos", label: "Zkontrolovat výnos →" }]} />
          <Disclaimer />
        </section>
      </div>
    </CalculatorShell>
  );
}
