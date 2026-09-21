"use client";

import { useMemo, useState } from "react";

import { HypotekaJasneCTA } from "@/components/financing/hypotekajasne-cta";
import { FINANCING_ASSUMPTIONS } from "@/config/financing-assumptions";
import { calculateMortgage } from "@/lib/calculators";

import { CalculatorFooterCta, CalculatorShell } from "../calculator-shell";
import {
  BarCompare,
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

type FinanceState = {
  purchasePrice: number;
  ownCapital: number;
  loanAmount: number;
  loanTouched: boolean;
  rate: number;
  years: number;
  extraCosts: number;
};

const DEMO: FinanceState = {
  purchasePrice: 5_900_000,
  ownCapital: 1_500_000,
  loanAmount: 4_400_000,
  loanTouched: true,
  rate: FINANCING_ASSUMPTIONS.referenceMortgageRatePp,
  years: FINANCING_ASSUMPTIONS.defaultTermYears,
  extraCosts: 0,
};

const BLANK: FinanceState = {
  purchasePrice: 0,
  ownCapital: 0,
  loanAmount: 0,
  loanTouched: false,
  rate: FINANCING_ASSUMPTIONS.referenceMortgageRatePp,
  years: FINANCING_ASSUMPTIONS.defaultTermYears,
  extraCosts: 0,
};

export function FinancingTool() {
  const [state, setState] = useState<FinanceState>(DEMO);
  const loan = state.loanTouched
    ? state.loanAmount
    : Math.max(0, state.purchasePrice - state.ownCapital);
  const mortgage = useMemo(
    () =>
      calculateMortgage({
        principal: loan,
        annualInterestRate: Math.max(0, state.rate),
        years: state.years,
      }),
    [loan, state.rate, state.years],
  );
  const ltv =
    state.purchasePrice > 0 ? (loan / state.purchasePrice) * 100 : null;

  const scenarios = [-1, 0, 1].map((shift) => {
    const rate = Math.max(0, state.rate + shift);
    const result = calculateMortgage({
      principal: loan,
      annualInterestRate: rate,
      years: state.years,
    });
    const base = mortgage.monthlyPayment;
    const delta =
      result.monthlyPayment != null && base != null
        ? result.monthlyPayment - base
        : null;
    return { shift, rate, payment: result.monthlyPayment, delta };
  });

  return (
    <CalculatorShell
      title="Financování nemovitosti"
      description="Orientační anuitní splátka, LTV a průběh jistiny. Nejde o schválení úvěru ani nabídku banky."
      badge="Anuitní model"
      breadcrumbs={[
        { href: "/", label: "Domů" },
        { href: "/analyzy-a-kalkulacky", label: "Analýzy a kalkulačky" },
        { label: "Financování" },
      ]}
      footer={<CalculatorFooterCta />}
    >
      <div className="calc-layout">
        <section className="calc-panel">
          <h2>Vstupy</h2>
          <ToolActions
            onDemo={() => setState(DEMO)}
            onReset={() => setState(BLANK)}
          />
          <MoneyField
            label="Kupní cena"
            value={state.purchasePrice}
            onChange={(purchasePrice) =>
              setState((current) => ({ ...current, purchasePrice }))
            }
          />
          <div className="calc-grid-2">
            <MoneyField
              label="Vlastní prostředky"
              value={state.ownCapital}
              onChange={(ownCapital) =>
                setState((current) => ({
                  ...current,
                  ownCapital,
                  loanTouched: false,
                }))
              }
            />
            <MoneyField
              label="Výše úvěru"
              value={loan}
              onChange={(loanAmount) =>
                setState((current) => ({
                  ...current,
                  loanAmount,
                  loanTouched: true,
                }))
              }
            />
            <PercentField
              label="Úroková sazba p.a."
              value={state.rate}
              onChange={(rate) => setState((current) => ({ ...current, rate }))}
            />
            <IntField
              label="Splatnost v letech"
              value={state.years}
              onChange={(years) => setState((current) => ({ ...current, years }))}
            />
          </div>
          <MoneyField
            label="Jiné jednorázové náklady"
            value={state.extraCosts}
            onChange={(extraCosts) =>
              setState((current) => ({ ...current, extraCosts }))
            }
            hint="Neovlivňují splátku, jen celkovou potřebu hotovosti."
          />
          <p className="calc-assumptions">
            Referenční sazba{" "}
            {FINANCING_ASSUMPTIONS.referenceMortgageRatePp.toLocaleString("cs-CZ", {
              maximumFractionDigits: 2,
            })}{" "}
            % · {FINANCING_ASSUMPTIONS.sourceLabel} ·{" "}
            {FINANCING_ASSUMPTIONS.lastUpdated}
          </p>
        </section>
        <section className="calc-panel">
          <h2>Výsledky</h2>
          <div className="calc-result-hero">
            <span>Orientační měsíční splátka</span>
            <strong>{moneyText(mortgage.monthlyPayment)}</strong>
            <p>Výsledek při zadané sazbě a splatnosti. Není závazná nabídka banky.</p>
          </div>
          <div className="calc-stats">
            <Kpi label="Cena nemovitosti" value={moneyText(state.purchasePrice)} />
            <Kpi
              label="Vlastní prostředky"
              value={moneyText(state.ownCapital + state.extraCosts)}
            />
            <Kpi label="Výše úvěru" value={moneyText(loan)} />
            <Kpi label="LTV" value={pctText(ltv, 1)} hint="Úvěr dělený kupní cenou." />
            <Kpi label="Celkem zaplaceno" value={moneyText(mortgage.totalPaid)} />
            <Kpi label="Celkové úroky" value={moneyText(mortgage.totalInterest)} />
          </div>
          <h3 className="calc-subhead">Scénáře sazby</h3>
          <div className="calc-stats">
            {scenarios.map((item) => (
              <Kpi
                key={item.shift}
                label={
                  item.shift === 0
                    ? "Referenční"
                    : item.shift < 0
                      ? "Nižší"
                      : "Vyšší"
                }
                value={moneyText(item.payment)}
                hint={
                  item.delta == null || item.shift === 0
                    ? `${pctText(item.rate)}`
                    : `Rozdíl proti referenci ${moneyText(item.delta)}`
                }
              />
            ))}
          </div>
          <h3 className="calc-subhead">Zůstatek úvěru</h3>
          <BarCompare
            items={mortgage.schedule
              .filter((row) => row.year % 5 === 0 || row.year === 1)
              .map((row) => ({
                label: `Rok ${row.year}`,
                value: row.balance,
                display: moneyText(row.balance),
              }))}
          />
          <div className="calc-tips">
            <h3>Průběh po letech</h3>
            <ul>
              {mortgage.schedule
                .filter((row) => row.year % 5 === 0)
                .map((row) => (
                  <li key={row.year}>
                    Rok {row.year}: jistina {moneyText(row.principalPaid)}, úrok{" "}
                    {moneyText(row.interestPaid)}, zůstatek {moneyText(row.balance)}.
                  </li>
                ))}
            </ul>
          </div>

          <div className="calc-footer-cta">
            <HypotekaJasneCTA
              propertyPriceCzk={state.purchasePrice}
              ownFundsCzk={state.ownCapital}
              loanAmountCzk={loan}
              termYears={state.years}
              ratePp={state.rate}
              sourceContext="calculator"
              label="Porovnat aktuální financování"
              destination="compare"
            />
          </div>
          <p className="calc-assumptions">
            Chcete zjistit konkrétní možnosti? Aktuální sazby a varianty na
            HypotékaJasně.cz.
          </p>

          <CrossLinks
            links={[{ href: "/kalkulacky/cash-flow", label: "Spočítat cash flow →" }]}
          />
          <Disclaimer extra={FINANCING_ASSUMPTIONS.disclaimerCs} />
        </section>
      </div>
    </CalculatorShell>
  );
}
