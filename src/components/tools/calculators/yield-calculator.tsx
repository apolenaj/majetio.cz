"use client";

import { useMemo } from "react";

import { buildIncomeStatement } from "@/lib/calculators";

import { CalculatorFooterCta, CalculatorShell } from "../calculator-shell";
import { useInvestmentForm } from "./use-investment-form";
import {
  Breakdown,
  CrossLinks,
  Disclaimer,
  Kpi,
  ModeToggle,
  MoneyField,
  PercentField,
  ToolActions,
  moneyText,
  pctText,
} from "./ui";

export function YieldCalculator() {
  const form = useInvestmentForm();
  const statement = useMemo(() => buildIncomeStatement(form.input), [form.input]);
  const annualOpex = form.input.useItemizedOpex
    ? statement.annualOperatingCosts
    : form.input.monthlyOperatingLump * 12;

  return (
    <CalculatorShell
      title="Výnos investiční nemovitosti"
      description="Hrubý, efektivní a čistý výnos ze stejného modelu příjmu a NOI jako cash flow."
      badge="Sdílený model NOI"
      breadcrumbs={[
        { href: "/", label: "Domů" },
        { href: "/analyzy-a-kalkulacky", label: "Analýzy a kalkulačky" },
        { label: "Investiční výnos" },
      ]}
      footer={<CalculatorFooterCta />}
    >
      <div className="calc-layout">
        <section className="calc-panel">
          <h2>Vstupy</h2>
          <ToolActions onDemo={form.loadDemo} onReset={form.reset} />
          <ModeToggle advanced={form.advanced} onChange={form.setAdvanced} />
          <MoneyField label="Kupní cena" value={form.input.purchasePrice} onChange={(purchasePrice) => form.patch({ purchasePrice })} />
          <MoneyField label="Měsíční nájem" value={form.input.monthlyRent} onChange={(monthlyRent) => form.patch({ monthlyRent })} />
          {form.advanced ? (
            <>
              <MoneyField label="Další měsíční příjem" value={form.input.otherMonthlyIncome} onChange={(otherMonthlyIncome) => form.patch({ otherMonthlyIncome })} />
              <PercentField label="Vacancy" value={form.input.vacancyRate} onChange={(vacancyRate) => form.patch({ vacancyRate })} />
              <div className="calc-grid-2">
                <MoneyField label="Fond oprav / HOA" value={form.input.monthlyHOA} onChange={(monthlyHOA) => form.patch({ monthlyHOA })} />
                <MoneyField label="Údržba" value={form.input.maintenanceMonthly} onChange={(maintenanceMonthly) => form.patch({ maintenanceMonthly })} />
                <MoneyField label="Pojištění" value={form.input.insuranceMonthly} onChange={(insuranceMonthly) => form.patch({ insuranceMonthly })} />
                <MoneyField label="Správa" value={form.input.managementMonthly} onChange={(managementMonthly) => form.patch({ managementMonthly })} />
              </div>
              <MoneyField label="Náklady na koupi" value={form.input.acquisitionCosts} onChange={(acquisitionCosts) => form.patch({ acquisitionCosts })} />
              <MoneyField label="Počáteční rezerva" value={form.input.initialReserve} onChange={(initialReserve) => form.patch({ initialReserve })} />
              <div className="calc-grid-2">
                <MoneyField label="Vlastní kapitál" value={form.input.ownCapital} onChange={(ownCapital) => form.patch({ ownCapital })} />
                <MoneyField label="Úvěr" value={form.input.loanAmount ?? 0} onChange={(loanAmount) => form.patch({ loanAmount })} />
                <PercentField label="Sazba p.a." value={form.input.annualInterestRate} onChange={(annualInterestRate) => form.patch({ annualInterestRate })} />
                <MoneyField label="Rekonstrukce" value={form.input.renovationCost} onChange={(renovationCost) => form.patch({ renovationCost })} />
              </div>
            </>
          ) : (
            <>
              <MoneyField
                label="Roční provozní náklady"
                value={Math.round(form.input.monthlyOperatingLump * 12)}
                onChange={(annual) => form.patch({ monthlyOperatingLump: annual / 12 })}
              />
              <PercentField label="Vacancy" value={form.input.vacancyRate} onChange={(vacancyRate) => form.patch({ vacancyRate })} />
              <MoneyField label="Rekonstrukce" value={form.input.renovationCost} onChange={(renovationCost) => form.patch({ renovationCost })} />
            </>
          )}
        </section>
        <section className="calc-panel">
          <h2>Výsledky</h2>
          <div className="calc-result-hero">
            <span>Čistý výnos</span>
            <strong>{pctText(statement.netYieldPct)}</strong>
            <p>Výsledek při zadaných předpokladech. Není investiční doporučení.</p>
          </div>
          <div className="calc-stats">
            <Kpi label="Hrubý výnos" value={pctText(statement.grossYieldPct)} hint="Roční potenciální nájem / kupní cena." />
            <Kpi label="Efektivní hrubý výnos" value={pctText(statement.effectiveGrossYieldPct)} hint="Příjem po vacancy a ostatních příjmech / kupní cena." />
            <Kpi label="NOI ročně" value={moneyText(statement.annualNoi)} hint="Efektivní příjem minus provozní náklady." />
            <Kpi label="Celková investice" value={moneyText(statement.totalAcquisitionCost)} />
            <Kpi label="Efektivní příjem" value={moneyText(statement.effectiveAnnualIncome)} />
            <Kpi label="Cash-on-cash" value={pctText(statement.cashOnCashPct)} hint="Roční cash flow po splátce / vlastní vložené peníze. Není totéž co čistý výnos." />
          </div>
          <h3 className="calc-subhead">Jak jsme k výsledku došli</h3>
          <Breakdown
            rows={[
              { label: "Nájem při 100 % obsazenosti", value: moneyText(statement.potentialAnnualRent) },
              { label: "Po odečtení vacancy + ostatní příjem", value: moneyText(statement.effectiveAnnualIncome) },
              { sign: "−", label: "Provozní náklady", value: moneyText(annualOpex) },
              { sign: "=", label: "NOI", value: moneyText(statement.annualNoi) },
              { sign: "=", label: "Čistý výnos", value: pctText(statement.netYieldPct) },
            ]}
          />
          <p className="calc-assumptions">
            Použité předpoklady: vacancy {pctText(form.input.vacancyRate, 1)} · sazba {pctText(form.input.annualInterestRate)} · úvěr {moneyText(statement.loanAmount)}
          </p>
          <CrossLinks
            links={[
              { href: "/kalkulacky/maximalni-nabidkova-cena", label: "Zjistit maximální nabídkovou cenu →" },
              { href: "/kalkulacky/investicni-vynos?model=pokrocily", label: "Pokročilý model (IRR, citlivost) →" },
            ]}
          />
          <Disclaimer />
        </section>
      </div>
    </CalculatorShell>
  );
}
