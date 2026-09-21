"use client";

import { useMemo, useState } from "react";

import { formatCzk, formatPct } from "@/components/marketing/format";

import {
  CalculatorFooterCta,
  CalculatorShell,
} from "../calculator-shell";
import { computePayback, parseAmount } from "./mvp-math";

export function PaybackCalculator() {
  const [investment, setInvestment] = useState("1800000");
  const [annualProfit, setAnnualProfit] = useState("120000");

  const result = useMemo(() => {
    const inv = parseAmount(investment);
    const profit = parseAmount(annualProfit);
    const payback = computePayback(inv, profit);
    const monthly = profit / 12;
    const coc = inv > 0 ? (profit / inv) * 100 : 0;
    return { ...payback, monthly, coc, inv, profit };
  }, [investment, annualProfit]);

  const fill =
    result.years == null
      ? 0
      : Math.min(100, Math.max(8, (1 / Math.max(result.years, 0.1)) * 100));

  return (
    <CalculatorShell
      title="Návratnost investice"
      description="Spočítejte, za jak dlouho se vám investice může vrátit při daném ročním čistém zisku."
      badge="Rychlý výpočet"
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
          <Field
            label="Vstupní investice / vlastní kapitál (Kč)"
            value={investment}
            onChange={setInvestment}
            hint="Typicky vlastní zdroje + náklady na pořízení"
          />
          <Field
            label="Roční čistý zisk (Kč)"
            value={annualProfit}
            onChange={setAnnualProfit}
            hint="Po provozních nákladech a splátce"
          />
        </section>

        <section className="calc-panel">
          <h2>Výsledky</h2>
          <div className="calc-result-hero">
            <span>Orientační návratnost</span>
            <strong>
              {result.years == null
                ? "—"
                : `${result.years.toLocaleString("cs-CZ", {
                    maximumFractionDigits: 1,
                  })} let`}
            </strong>
            <p>{result.comment}</p>
          </div>
          <div className="calc-stats">
            <Stat label="Vlastní kapitál" value={formatCzk(result.inv)} />
            <Stat label="Roční zisk" value={formatCzk(result.profit)} />
            <Stat label="Měsíčně" value={formatCzk(result.monthly)} />
            <Stat label="Cash-on-cash" value={formatPct(result.coc)} />
          </div>
          <div className="calc-progress">
            <div className="calc-progress-label">
              <span>Rychlost návratu (model)</span>
              <span>{result.years == null ? "—" : `${Math.round(fill)} %`}</span>
            </div>
            <div className="calc-progress-track">
              <div className="calc-progress-fill" style={{ width: `${fill}%` }} />
            </div>
          </div>
          <div className="calc-tips">
            <h3>Tipy</h3>
            <ul>
              <li>Jednoduchá návratnost nepočítá růst nájmu ani prodej.</li>
              <li>Pro IRR a scénáře použijte Investiční výnos.</li>
            </ul>
          </div>
        </section>
      </div>
    </CalculatorShell>
  );
}

function Field({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div className="calc-field">
      <label>{label}</label>
      <input
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint ? <span className="calc-field-hint">{hint}</span> : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="calc-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
