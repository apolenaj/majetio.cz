"use client";

import { useMemo, useState } from "react";

import { calculatePayback } from "@/lib/calculators";

import { CalculatorFooterCta, CalculatorShell } from "../calculator-shell";
import { useInvestmentForm } from "./use-investment-form";
import {
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
} from "./ui";

export function PaybackCalculator() {
  const form = useInvestmentForm();
  const [annualOverride, setAnnualOverride] = useState<number | null>(null);
  const result = useMemo(() => calculatePayback(form.input), [form.input]);
  const invested =
    form.input.ownCapital +
    form.input.acquisitionCosts +
    form.input.renovationCost +
    form.input.initialReserve;
  const simpleYears =
    annualOverride == null
      ? result.simplePaybackYears
      : annualOverride > 0 && invested > 0
        ? invested / annualOverride
        : null;
  const reason =
    annualOverride == null
      ? result.unavailableReason
      : annualOverride <= 0
        ? "Při současném cash flow se investice pouze z provozního cash flow nevrací."
        : "Návratnost z ručně zadaného ročního cash flow.";

  return (
    <CalculatorShell
      title="Návratnost investice"
      description="Jednoduchá návratnost z ročního cash flow a modelový výsledek za dobu držení."
      badge="Modelový scénář"
      breadcrumbs={[
        { href: "/", label: "Domů" },
        { href: "/analyzy-a-kalkulacky", label: "Analýzy a kalkulačky" },
        { label: "Návratnost investice" },
      ]}
      footer={<CalculatorFooterCta />}
    >
      <div className="calc-layout">
        <section className="calc-panel">
          <h2>Vstupy</h2>
          <ToolActions
            onDemo={() => {
              form.loadDemo();
              setAnnualOverride(null);
            }}
            onReset={() => {
              form.reset();
              setAnnualOverride(null);
            }}
          />
          <ModeToggle advanced={form.advanced} onChange={form.setAdvanced} />
          <MoneyField label="Vlastní kapitál" value={form.input.ownCapital} onChange={(ownCapital) => form.patch({ ownCapital })} />
          <MoneyField label="Rekonstrukce" value={form.input.renovationCost} onChange={(renovationCost) => form.patch({ renovationCost })} />
          <MoneyField label="Kupní cena" value={form.input.purchasePrice} onChange={(purchasePrice) => form.patch({ purchasePrice })} />
          <MoneyField label="Měsíční nájem" value={form.input.monthlyRent} onChange={(monthlyRent) => form.patch({ monthlyRent })} />
          <MoneyField
            label="Roční čistý cash flow (volitelný override)"
            value={annualOverride ?? 0}
            onChange={(value) => setAnnualOverride(value > 0 ? value : null)}
            hint="0 = použít cash flow ze sdíleného modelu."
          />
          {form.advanced ? (
            <>
              <PercentField label="Růst hodnoty / rok" value={form.input.appreciationRate} onChange={(appreciationRate) => form.patch({ appreciationRate })} />
              <PercentField label="Růst nájmu / rok" value={form.input.rentGrowthRate} onChange={(rentGrowthRate) => form.patch({ rentGrowthRate })} />
              <PercentField label="Růst nákladů / rok" value={form.input.expenseGrowthRate} onChange={(expenseGrowthRate) => form.patch({ expenseGrowthRate })} />
              <PercentField label="Náklady na prodej" value={form.input.saleCostRate} onChange={(saleCostRate) => form.patch({ saleCostRate })} />
              <IntField label="Doba držení (roky)" value={form.input.holdingPeriodYears} onChange={(holdingPeriodYears) => form.patch({ holdingPeriodYears })} />
              <div className="calc-grid-2">
                <MoneyField label="Úvěr" value={form.input.loanAmount ?? 0} onChange={(loanAmount) => form.patch({ loanAmount })} />
                <PercentField label="Sazba" value={form.input.annualInterestRate} onChange={(annualInterestRate) => form.patch({ annualInterestRate })} />
              </div>
            </>
          ) : (
            <IntField label="Doba držení (roky)" value={form.input.holdingPeriodYears} onChange={(holdingPeriodYears) => form.patch({ holdingPeriodYears })} />
          )}
        </section>
        <section className="calc-panel">
          <h2>Výsledky</h2>
          <div className="calc-result-hero">
            <span>Jednoduchá návratnost</span>
            <strong>
              {simpleYears == null
                ? "—"
                : `${simpleYears.toLocaleString("cs-CZ", { maximumFractionDigits: 1 })} let`}
            </strong>
            <p>{reason ?? "Návratnost jen z provozního cash flow, bez prodeje."}</p>
          </div>
          <div className="calc-stats">
            <Kpi label="Equity při prodeji" value={moneyText(result.equityAtSale)} />
            <Kpi label="Kumulované cash flow" value={moneyText(result.cumulativeCashFlow)} />
            <Kpi label="Celkový modelový výsledek" value={moneyText(result.totalModelResult)} hint="Equity při prodeji + kumulované cash flow − vložený kapitál." />
            <Kpi label="Budoucí hodnota" value={moneyText(result.futurePropertyValue)} />
            <Kpi label="Zůstatek úvěru" value={moneyText(result.remainingLoan)} />
            <Kpi label="Náklady na prodej" value={moneyText(result.saleCosts)} />
          </div>
          <p className="calc-assumptions">
            Modelový scénář, ne predikce trhu. Růst hodnoty {pctText(form.input.appreciationRate, 1)}, nájmu {pctText(form.input.rentGrowthRate, 1)}, nákladů {pctText(form.input.expenseGrowthRate, 1)}, držba {form.input.holdingPeriodYears} let.
          </p>
          <CrossLinks links={[{ href: "/kalkulacky/cash-flow", label: "Otevřít cash flow →" }]} />
          <Disclaimer />
        </section>
      </div>
    </CalculatorShell>
  );
}
