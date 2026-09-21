"use client";

import { useMemo, useState } from "react";

import { formatCzk } from "@/components/marketing/format";

import {
  CalculatorFooterCta,
  CalculatorShell,
} from "../calculator-shell";
import { computeRenovation, parseAmount } from "./mvp-math";

const TYPES = [
  { id: "cosmetic", label: "Kosmetické úpravy" },
  { id: "standard", label: "Standardní rekonstrukce" },
  { id: "full", label: "Kompletní rekonstrukce" },
] as const;

export function RenovationCalculator() {
  const [type, setType] = useState<(typeof TYPES)[number]["id"]>("standard");
  const [area, setArea] = useState("72");
  const [contingency, setContingency] = useState("15");

  const result = useMemo(
    () =>
      computeRenovation({
        type,
        areaSqm: parseAmount(area),
        contingencyPct: parseAmount(contingency),
      }),
    [type, area, contingency],
  );

  const fill = Math.min(
    100,
    result.high > 0 ? (result.total / result.high) * 100 : 0,
  );

  return (
    <CalculatorShell
      title="Rekonstrukce"
      description="Odhadněte rozpočet úprav, rezervu a dopad na ekonomiku projektu. Orientační pásmo podle typu prací a plochy."
      badge="Praktické"
      breadcrumbs={[
        { href: "/", label: "Domů" },
        { href: "/analyzy-a-kalkulacky", label: "Analýzy a kalkulačky" },
        { label: "Rekonstrukce" },
      ]}
      footer={<CalculatorFooterCta />}
    >
      <div className="calc-layout">
        <section className="calc-panel">
          <h2>Vstupy</h2>
          <div className="calc-field">
            <label>Typ prací</label>
            <select
              value={type}
              onChange={(e) =>
                setType(e.target.value as (typeof TYPES)[number]["id"])
              }
            >
              {TYPES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="calc-grid-2">
            <div className="calc-field">
              <label>Plocha (m²)</label>
              <input
                inputMode="decimal"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </div>
            <div className="calc-field">
              <label>Rezerva (%)</label>
              <input
                inputMode="decimal"
                value={contingency}
                onChange={(e) => setContingency(e.target.value)}
              />
              <span className="calc-field-hint">Doporučeno 10–20 %</span>
            </div>
          </div>
          <p className="calc-field-hint">
            Orientační sazby: {formatCzk(result.rate.low)}–
            {formatCzk(result.rate.high)} / m² podle rozsahu.
          </p>
        </section>

        <section className="calc-panel">
          <h2>Výsledky</h2>
          <div className="calc-result-hero">
            <span>Odhad celkového rozpočtu</span>
            <strong>{formatCzk(result.total)}</strong>
            <p>{result.comment}</p>
          </div>
          <div className="calc-stats">
            <Stat label="Odhad minima" value={formatCzk(result.low)} />
            <Stat label="Základní odhad" value={formatCzk(result.base)} />
            <Stat label="Odhad maxima" value={formatCzk(result.high)} />
            <Stat
              label="Doporučená rezerva"
              value={formatCzk(result.contingency)}
            />
          </div>
          <div className="calc-progress">
            <div className="calc-progress-label">
              <span>Základ + rezerva vs. horní pásmo</span>
              <span>{Math.round(fill)} %</span>
            </div>
            <div className="calc-progress-track">
              <div className="calc-progress-fill" style={{ width: `${fill}%` }} />
            </div>
          </div>
          <div className="calc-tips">
            <h3>Tipy</h3>
            <ul>
              <li>Skutečný rozpočet ověřte položkově a lokalitou.</li>
              <li>
                Dopad na výnos spočítejte v Cash flow nebo Investičním výnosu.
              </li>
            </ul>
          </div>
        </section>
      </div>
    </CalculatorShell>
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
