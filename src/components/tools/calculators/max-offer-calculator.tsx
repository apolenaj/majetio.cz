"use client";

import { useMemo, useState } from "react";

import {
  calculateMaxOfferByCashFlow,
  calculateMaxOfferByYield,
  offerGap,
} from "@/lib/calculators";

import { CalculatorFooterCta, CalculatorShell } from "../calculator-shell";
import { useInvestmentForm } from "./use-investment-form";
import {
  CrossLinks,
  Disclaimer,
  IntField,
  Kpi,
  MoneyField,
  PercentField,
  ToolActions,
  moneyText,
  pctText,
} from "./ui";

export function MaxOfferCalculator() {
  const form = useInvestmentForm();
  const [method, setMethod] = useState<"yield" | "cashflow">("yield");
  const [targetYield, setTargetYield] = useState(5.5);
  const [asking, setAsking] = useState(5_900_000);
  const [targetCf, setTargetCf] = useState(0);

  const byYield = useMemo(
    () => calculateMaxOfferByYield(form.input, targetYield),
    [form.input, targetYield],
  );
  const byCashFlow = useMemo(
    () => calculateMaxOfferByCashFlow({ ...form.input, loanAmount: null }, targetCf),
    [form.input, targetCf],
  );
  const price =
    method === "yield" ? byYield.maximumPurchasePrice : byCashFlow.maximumPurchasePrice;
  const gap = offerGap(asking, price);
  const message = method === "yield" ? byYield.message : byCashFlow.message;

  return (
    <CalculatorShell
      title="Jakou maximální cenu má smysl nabídnout?"
      description="Spočítejte maximální kupní cenu podle výnosu, nákladů a parametrů investice."
      badge="Model při zadaných předpokladech"
      breadcrumbs={[
        { href: "/", label: "Domů" },
        { href: "/analyzy-a-kalkulacky", label: "Analýzy a kalkulačky" },
        { label: "Maximální nabídková cena" },
      ]}
      footer={<CalculatorFooterCta />}
    >
      <div className="calc-layout">
        <section className="calc-panel">
          <h2>Vstupy</h2>
          <ToolActions onDemo={form.loadDemo} onReset={form.reset} />
          <div className="calc-mode">
            <button type="button" className="tools-filter" aria-pressed={method === "yield"} onClick={() => setMethod("yield")}>
              Podle výnosu
            </button>
            <button type="button" className="tools-filter" aria-pressed={method === "cashflow"} onClick={() => setMethod("cashflow")}>
              Podle cash flow
            </button>
          </div>
          <MoneyField label="Očekávaný měsíční nájem" value={form.input.monthlyRent} onChange={(monthlyRent) => form.patch({ monthlyRent })} />
          <PercentField label="Vacancy" value={form.input.vacancyRate} onChange={(vacancyRate) => form.patch({ vacancyRate })} />
          <MoneyField
            label="Roční provozní náklady"
            value={Math.round(form.input.monthlyOperatingLump * 12)}
            onChange={(annual) => form.patch({ monthlyOperatingLump: annual / 12, useItemizedOpex: false })}
          />
          {method === "yield" ? (
            <PercentField label="Cílový čistý výnos" value={targetYield} onChange={setTargetYield} />
          ) : (
            <>
              <MoneyField label="Požadované měsíční cash flow" value={targetCf} signed onChange={setTargetCf} hint="0 = model na nule. Záporné číslo = maximální měsíční doplatek." />
              <MoneyField label="Vlastní prostředky" value={form.input.ownCapital} onChange={(ownCapital) => form.patch({ ownCapital, loanAmount: null })} />
              <div className="calc-grid-2">
                <PercentField label="Sazba p.a." value={form.input.annualInterestRate} onChange={(annualInterestRate) => form.patch({ annualInterestRate })} />
                <IntField label="Splatnost" value={form.input.loanYears} onChange={(loanYears) => form.patch({ loanYears })} />
              </div>
            </>
          )}
          <MoneyField label="Rekonstrukce" value={form.input.renovationCost} onChange={(renovationCost) => form.patch({ renovationCost })} />
          <MoneyField label="Náklady na koupi" value={form.input.acquisitionCosts} onChange={(acquisitionCosts) => form.patch({ acquisitionCosts })} />
          <MoneyField label="Počáteční rezerva" value={form.input.initialReserve} onChange={(initialReserve) => form.patch({ initialReserve })} />
          <MoneyField label="Nabídka inzerátu" value={asking} onChange={setAsking} hint="Jen pro porovnání. Není tržní ocenění." />
        </section>
        <section className="calc-panel">
          <h2>Výsledky</h2>
          <div className="calc-result-hero">
            <span>Modelová maximální kupní cena</span>
            <strong>{moneyText(price)}</strong>
            <p>
              {message ??
                "Modelová maximální cena při zadaných předpokladech. Není správná cena ani skutečná hodnota."}
            </p>
          </div>
          <div className="calc-stats">
            <Kpi label="Nabídka inzerátu" value={moneyText(asking)} />
            <Kpi label="Rozdíl" value={gap.delta == null ? "—" : moneyText(gap.delta)} />
            <Kpi label="Rozdíl v %" value={pctText(gap.deltaPct, 1)} />
            <Kpi label="NOI" value={moneyText(byYield.annualNoi)} />
          </div>
          <div className="calc-bars">
            <div className="calc-bar-row">
              <div className="calc-bar-label">
                <span>Inzerovaná cena</span>
                <strong>{moneyText(asking)}</strong>
              </div>
              <div className="calc-progress-track">
                <div className="calc-progress-fill" style={{ width: "100%" }} />
              </div>
            </div>
            <div className="calc-bar-row">
              <div className="calc-bar-label">
                <span>Modelová maximální cena</span>
                <strong>{moneyText(price)}</strong>
              </div>
              <div className="calc-progress-track">
                <div
                  className="calc-progress-fill"
                  style={{
                    width: `${price == null || asking <= 0 ? 0 : Math.min(100, (price / asking) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
          <CrossLinks links={[{ href: "/kalkulacky/financovani", label: "Spočítat financování →" }]} />
          <Disclaimer />
        </section>
      </div>
    </CalculatorShell>
  );
}
