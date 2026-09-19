"use client";

import Decimal from "decimal.js";
import { useState } from "react";

import { calculateRentalDecision } from "@/domains/investment/engine/calculations/rental-decision";
import { formatCzk } from "@/lib/format";
import type { Property } from "@/lib/mock-properties";

type Field = {
  id: string;
  label: string;
  hint: string;
  value: string;
};

export function CatalogInvestmentPanel({ property }: { property: Property }) {
  const rentAsking = property.typ_transakce === "pronajem";
  const [fields, setFields] = useState<Field[]>([
    {
      id: "purchase",
      label: "Kupní cena",
      hint: rentAsking ? "vlastní scénář" : "údaj inzerenta",
      value: rentAsking ? "" : String(property.cena),
    },
    { id: "costs", label: "Jednorázové pořizovací náklady", hint: "chybí", value: "" },
    { id: "reno", label: "Počáteční rekonstrukce", hint: "chybí", value: "" },
    { id: "furnish", label: "Vybavení", hint: "chybí", value: "" },
    { id: "loan", label: "Čerpaný úvěr", hint: "chybí, 0 = bez úvěru", value: "" },
    { id: "rate", label: "Úrok p.a. (%)", hint: "vlastní scénář", value: "" },
    { id: "years", label: "Splatnost (roky)", hint: "vlastní scénář", value: "" },
    {
      id: "rent",
      label: "Čisté nájemné bez služeb / měsíc",
      hint: rentAsking ? "údaj inzerenta, nabídkový nájem" : "chybí",
      value: rentAsking ? String(property.cena) : "",
    },
    { id: "occupancy", label: "Obsazenost (%)", hint: "chybí", value: "" },
    { id: "opex", label: "Provozní náklady vlastníka / rok", hint: "chybí, 0 je nula", value: "" },
    { id: "reserve", label: "Roční odklad do rezervy", hint: "chybí, 0 je nula", value: "" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReturnType<typeof calculateRentalDecision> | null>(null);

  function update(id: string, value: string) {
    setFields((current) => current.map((field) => (field.id === id ? { ...field, value } : field)));
    setResult(null);
  }

  function calculate() {
    const read = (id: string) => fields.find((field) => field.id === id)?.value.trim() ?? "";
    const missing = fields.filter((field) => read(field.id) === "").map((field) => field.label);
    if (missing.length > 0) {
      setError(`Chybí: ${missing.join(", ")}. Prázdné pole není nula.`);
      setResult(null);
      return;
    }
    try {
      const computed = calculateRentalDecision({
        purchasePrice: new Decimal(read("purchase").replace(",", ".")),
        acquisitionCosts: new Decimal(read("costs").replace(",", ".")),
        renovation: new Decimal(read("reno").replace(",", ".")),
        furnishing: new Decimal(read("furnish").replace(",", ".")),
        loanAmount: new Decimal(read("loan").replace(",", ".")),
        annualInterestRate: new Decimal(read("rate").replace(",", ".")).div(100),
        termYears: Number(read("years").replace(",", ".")),
        monthlyNetRent: new Decimal(read("rent").replace(",", ".")),
        occupancy: new Decimal(read("occupancy").replace(",", ".")).div(100),
        annualOwnerOpex: new Decimal(read("opex").replace(",", ".")),
        annualCapexReserve: new Decimal(read("reserve").replace(",", ".")),
      });
      setError(null);
      setResult(computed);
    } catch {
      setError("Vstupy nejdou spočítat. Zkontrolujte, že jsou to nezáporná čísla a obsazenost je 0–100.");
      setResult(null);
    }
  }

  return (
    <section id="investice" className="mt-12">
      <h2 className="font-display text-2xl text-[var(--text-primary)]">Náklady a výnos</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--text-secondary)]">
        Vlastní scénář dlouhodobého pronájmu před daní. Není to tržní ocenění. Inzerát nájem, úvěr ani
        provozní náklady nedokládá, dokud je sem nezadáte. Záporný výsledek se nezakrývá.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field.id} className="block text-sm">
            <span className="font-medium text-[var(--text-primary)]">{field.label}</span>
            <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{field.hint}</span>
            <input
              value={field.value}
              inputMode="decimal"
              onChange={(event) => update(field.id, event.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 font-metric text-[var(--text-primary)]"
            />
          </label>
        ))}
      </div>
      <button
        type="button"
        onClick={calculate}
        className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
      >
        Spočítat scénář
      </button>
      {error ? <p className="mt-3 text-sm text-[var(--text-secondary)]">{error}</p> : null}
      {result ? (
        <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Metric label="Celková investice" value={formatCzk(Number(result.totalInvestment))} />
          <Metric label="Vlastní prostředky" value={formatCzk(Number(result.equity))} />
          <Metric label="NOI / rok" value={formatCzk(Number(result.noi))} />
          <Metric
            label="Cash flow po rezervě / rok"
            value={formatCzk(Number(result.disposableAnnualCashFlow))}
          />
          <Metric
            label="Cash-on-cash"
            value={
              result.cashOnCash == null
                ? "Nedává smysl při E ≤ 0"
                : `${result.cashOnCash.mul(100).toFixed(2)} %`
            }
          />
          <Metric label="DSCR" value={result.dscr == null ? "Bez úvěru" : result.dscr.toFixed(2)} />
          <Metric
            label="Cash flow po rezervě / měsíc"
            value={formatCzk(Number(result.disposableMonthlyCashFlow))}
          />
          <Metric
            label="Nájem k nulovému CF"
            value={
              result.breakEvenMonthlyRent == null
                ? "Nelze spočítat"
                : `${formatCzk(Number(result.breakEvenMonthlyRent))} / měsíc`
            }
          />
        </dl>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-default)] px-3 py-3">
      <dt className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{label}</dt>
      <dd className="mt-1 font-metric text-lg text-[var(--text-primary)]">{value}</dd>
    </div>
  );
}
