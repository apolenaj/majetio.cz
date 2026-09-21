"use client";

import { useMemo, useState } from "react";

import { formatCzk, formatPct } from "@/components/marketing/format";

import {
  CalculatorFooterCta,
  CalculatorShell,
} from "../calculator-shell";
import { computeCashFlow, parseAmount } from "./mvp-math";

export function CashFlowCalculator() {
  const [price, setPrice] = useState("6500000");
  const [rent, setRent] = useState("22000");
  const [fees, setFees] = useState("2500");
  const [reserveFund, setReserveFund] = useState("800");
  const [insurance, setInsurance] = useState("350");
  const [maintenance, setMaintenance] = useState("1200");
  const [management, setManagement] = useState("1500");
  const [mortgage, setMortgage] = useState("12000");
  const [vacancy, setVacancy] = useState("5");

  const result = useMemo(() => {
    const cf = computeCashFlow({
      rent: parseAmount(rent),
      fees: parseAmount(fees),
      reserveFund: parseAmount(reserveFund),
      insurance: parseAmount(insurance),
      maintenance: parseAmount(maintenance),
      management: parseAmount(management),
      mortgage: parseAmount(mortgage),
      vacancyPct: parseAmount(vacancy),
    });
    const p = parseAmount(price);
    const annualRent = parseAmount(rent) * 12;
    const gross = p > 0 ? (annualRent / p) * 100 : 0;
    const netAnnual = (cf.effectiveRent - cf.opex) * 12;
    const net = p > 0 ? (netAnnual / p) * 100 : 0;
    return { ...cf, gross, net };
  }, [
    price,
    rent,
    fees,
    reserveFund,
    insurance,
    maintenance,
    management,
    mortgage,
    vacancy,
  ]);

  const fillPct = Math.min(
    100,
    Math.max(0, 50 + (result.monthly / 20000) * 50),
  );

  return (
    <CalculatorShell
      title="Cash flow"
      description="Spočítejte příjmy, náklady a měsíční bilanci investiční nemovitosti. Výsledky jsou orientační."
      badge="Rychlý výpočet"
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
          <div className="calc-grid-2">
            <Field label="Kupní cena (Kč)" value={price} onChange={setPrice} />
            <Field label="Měsíční nájem (Kč)" value={rent} onChange={setRent} />
            <Field label="Poplatky (Kč)" value={fees} onChange={setFees} />
            <Field
              label="Fond oprav (Kč)"
              value={reserveFund}
              onChange={setReserveFund}
            />
            <Field
              label="Pojištění (Kč)"
              value={insurance}
              onChange={setInsurance}
            />
            <Field
              label="Údržba (Kč)"
              value={maintenance}
              onChange={setMaintenance}
            />
            <Field
              label="Správa (Kč)"
              value={management}
              onChange={setManagement}
            />
            <Field
              label="Splátka (Kč)"
              value={mortgage}
              onChange={setMortgage}
            />
            <Field
              label="Vacancy / rezerva (%)"
              value={vacancy}
              onChange={setVacancy}
              hint="Snížení efektivního nájmu"
            />
          </div>
        </section>

        <section className="calc-panel">
          <h2>Výsledky</h2>
          <div className="calc-result-hero">
            <span>Měsíční cash flow</span>
            <strong>
              {result.monthly >= 0 ? "+" : ""}
              {formatCzk(result.monthly)}
            </strong>
            <p>{result.comment}</p>
          </div>
          <div className="calc-stats">
            <Stat label="Roční cash flow" value={formatCzk(result.annual)} />
            <Stat label="Hrubý výnos" value={formatPct(result.gross)} />
            <Stat label="Čistý výnos" value={formatPct(result.net)} />
            <Stat label="Provozní náklady" value={formatCzk(result.opex)} />
            <Stat
              label="Efektivní nájem"
              value={formatCzk(result.effectiveRent)}
            />
            <Stat
              label="Ztráta vacancy"
              value={formatCzk(result.vacancyLoss)}
            />
          </div>
          <div className="calc-progress">
            <div className="calc-progress-label">
              <span>Bilance scénáře</span>
              <span>{result.monthly >= 0 ? "Kladná" : "Záporná"}</span>
            </div>
            <div className="calc-progress-track">
              <div
                className="calc-progress-fill"
                style={{ width: `${fillPct}%` }}
              />
            </div>
          </div>
          <div className="calc-tips">
            <h3>Tipy</h3>
            <ul>
              <li>Vacancy 3–8 % je běžný konzervativní odhad.</li>
              <li>
                Pro detailnější scénáře otevřete kalkulačku Investiční výnos.
              </li>
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
