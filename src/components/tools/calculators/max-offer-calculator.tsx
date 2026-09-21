"use client";

import { useMemo, useState } from "react";

import { formatCzk, formatPct } from "@/components/marketing/format";

import {
  CalculatorFooterCta,
  CalculatorShell,
} from "../calculator-shell";
import { computeMaxOffer, parseAmount } from "./mvp-math";

export function MaxOfferCalculator() {
  const [rent, setRent] = useState("22000");
  const [opex, setOpex] = useState("5500");
  const [targetYield, setTargetYield] = useState("5.5");
  const [asking, setAsking] = useState("7200000");

  const result = useMemo(() => {
    const offer = computeMaxOffer({
      rentMonthly: parseAmount(rent),
      opexMonthly: parseAmount(opex),
      targetYieldPct: parseAmount(targetYield),
    });
    const ask = parseAmount(asking);
    const delta = offer.maxPrice - ask;
    const deltaPct = ask > 0 ? (delta / ask) * 100 : 0;
    return { ...offer, ask, delta, deltaPct };
  }, [rent, opex, targetYield, asking]);

  const fill =
    result.maxPrice <= 0
      ? 0
      : Math.min(
          100,
          Math.max(5, (result.maxPrice / Math.max(result.ask, result.maxPrice)) * 100),
        );

  return (
    <CalculatorShell
      title="Maximální nabídková cena"
      description="Zjistěte, jakou maximální cenu dává při daných parametrech ještě smysl nabídnout."
      badge="Doporučeno"
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
          <div className="calc-grid-2">
            <Field
              label="Odhad měsíčního nájmu (Kč)"
              value={rent}
              onChange={setRent}
            />
            <Field
              label="Měsíční provozní náklady (Kč)"
              value={opex}
              onChange={setOpex}
            />
            <Field
              label="Cílový čistý výnos (%)"
              value={targetYield}
              onChange={setTargetYield}
            />
            <Field
              label="Inzerovaná cena (Kč)"
              value={asking}
              onChange={setAsking}
              hint="Pro porovnání s modelem"
            />
          </div>
        </section>

        <section className="calc-panel">
          <h2>Výsledky</h2>
          <div className="calc-result-hero">
            <span>Maximální nabídková cena</span>
            <strong>{formatCzk(result.maxPrice)}</strong>
            <p>{result.comment}</p>
          </div>
          <div className="calc-stats">
            <Stat
              label="Roční čistý příjem"
              value={formatCzk(result.annualNet)}
            />
            <Stat label="Cílový výnos" value={formatPct(parseAmount(targetYield))} />
            <Stat label="Inzerovaná cena" value={formatCzk(result.ask)} />
            <Stat
              label="Rozdíl vs. inzerát"
              value={`${result.delta >= 0 ? "+" : ""}${formatCzk(result.delta)}`}
            />
          </div>
          <div className="calc-progress">
            <div className="calc-progress-label">
              <span>Model vs. inzerát</span>
              <span>
                {result.delta >= 0
                  ? "Prostor k nabídce"
                  : "Nad cílovým limitem"}
              </span>
            </div>
            <div className="calc-progress-track">
              <div className="calc-progress-fill" style={{ width: `${fill}%` }} />
            </div>
          </div>
          <div className="calc-tips">
            <h3>Tipy</h3>
            <ul>
              <li>Model počítá z cílového čistého výnosu (nájem − opex).</li>
              <li>Nezahrnuje financování — to řeší kalkulačka Financování.</li>
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
