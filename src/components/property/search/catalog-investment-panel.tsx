"use client";

import type { ReactNode } from "react";
import Decimal from "decimal.js";
import { useMemo, useState } from "react";

import {
  calculateRentalDecision,
  monthlyAnnuityPayment,
} from "@/domains/investment/engine/calculations/rental-decision";
import { formatCzk } from "@/lib/format";
import type { Property } from "@/lib/mock-properties";
import { cn } from "@/lib/utils";

type Mode = "bydleni" | "investice";

function parseAmount(raw: string): Decimal | null {
  const cleaned = raw.replace(/\s/g, "").replace(",", ".");
  if (cleaned === "") return null;
  try {
    const value = new Decimal(cleaned);
    if (!value.isFinite() || value.isNegative()) return null;
    return value;
  } catch {
    return null;
  }
}

export function CatalogInvestmentPanel({ property }: { property: Property }) {
  const rentAsking = property.typ_transakce === "pronajem";
  const [mode, setMode] = useState<Mode>(rentAsking ? "investice" : "bydleni");
  const [showAssumptions, setShowAssumptions] = useState(false);

  const [purchase, setPurchase] = useState(rentAsking ? "" : String(property.cena));
  const [loan, setLoan] = useState("");
  const [reno, setReno] = useState("");
  const [rent, setRent] = useState(rentAsking ? String(property.cena) : "");
  const [costs, setCosts] = useState("");
  const [furnish, setFurnish] = useState("");
  const [rate, setRate] = useState("5");
  const [years, setYears] = useState("30");
  const [occupancy, setOccupancy] = useState("95");
  const [opex, setOpex] = useState("");
  const [reserve, setReserve] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [usedModel, setUsedModel] = useState(false);

  function applyModelAssumptions() {
    const price = parseAmount(purchase) ?? new Decimal(property.typ_transakce === "prodej" ? property.cena : 0);
    setCosts("100000");
    setFurnish("0");
    setReno(reno || "0");
    setLoan(price.isZero() ? "0" : price.mul("0.7").toDecimalPlaces(0).toFixed(0));
    setRate("5");
    setYears("30");
    setOccupancy("95");
    setOpex("36000");
    setReserve("12000");
    if (!rentAsking && !rent) setRent("");
    setUsedModel(true);
    setShowAssumptions(true);
    setError(null);
  }

  const livingResult = useMemo(() => {
    if (mode !== "bydleni") return null;
    const purchaseValue = parseAmount(purchase);
    const loanValue = parseAmount(loan);
    const renoValue = parseAmount(reno) ?? new Decimal(0);
    const costsValue = parseAmount(costs) ?? new Decimal(0);
    const furnishValue = parseAmount(furnish) ?? new Decimal(0);
    const rateValue = parseAmount(rate);
    const yearsValue = Number((years || "").replace(",", "."));
    if (purchaseValue == null || loanValue == null || rateValue == null || !Number.isFinite(yearsValue) || yearsValue <= 0) {
      return null;
    }
    try {
      const total = purchaseValue.plus(costsValue).plus(renoValue).plus(furnishValue);
      const equity = total.minus(loanValue);
      const payment = loanValue.isZero()
        ? null
        : monthlyAnnuityPayment(loanValue, rateValue.div(100), yearsValue).toDecimalPlaces(2);
      return { total, equity, payment };
    } catch {
      return null;
    }
  }, [mode, purchase, loan, reno, costs, furnish, rate, years]);

  const investmentResult = useMemo(() => {
    if (mode !== "investice") return null;
    const purchaseValue = parseAmount(purchase);
    const loanValue = parseAmount(loan);
    const renoValue = parseAmount(reno);
    const rentValue = parseAmount(rent);
    const costsValue = parseAmount(costs);
    const furnishValue = parseAmount(furnish);
    const rateValue = parseAmount(rate);
    const occupancyValue = parseAmount(occupancy);
    const opexValue = parseAmount(opex);
    const reserveValue = parseAmount(reserve);
    const yearsValue = Number((years || "").replace(",", "."));

    const required = [
      purchaseValue,
      loanValue,
      renoValue,
      rentValue,
      costsValue,
      furnishValue,
      rateValue,
      occupancyValue,
      opexValue,
      reserveValue,
    ];
    if (required.some((value) => value == null) || !Number.isFinite(yearsValue) || yearsValue <= 0) {
      return null;
    }
    try {
      return calculateRentalDecision({
        purchasePrice: purchaseValue!,
        acquisitionCosts: costsValue!,
        renovation: renoValue!,
        furnishing: furnishValue!,
        loanAmount: loanValue!,
        annualInterestRate: rateValue!.div(100),
        termYears: yearsValue,
        monthlyNetRent: rentValue!,
        occupancy: occupancyValue!.div(100),
        annualOwnerOpex: opexValue!,
        annualCapexReserve: reserveValue!,
      });
    } catch {
      return null;
    }
  }, [mode, purchase, loan, reno, rent, costs, furnish, rate, years, occupancy, opex, reserve]);

  function validateInvestment() {
    if (mode !== "investice") return;
    const missing: string[] = [];
    if (!parseAmount(purchase)) missing.push("kupní cenu");
    if (parseAmount(loan) == null) missing.push("úvěr");
    if (parseAmount(reno) == null) missing.push("rekonstrukci");
    if (!parseAmount(rent)) missing.push("nájemné");
    if (parseAmount(costs) == null) missing.push("pořizovací náklady");
    if (parseAmount(furnish) == null) missing.push("vybavení");
    if (parseAmount(opex) == null) missing.push("provozní náklady");
    if (parseAmount(reserve) == null) missing.push("rezervu");
    if (missing.length > 0) {
      setError(`Doplňte: ${missing.join(", ")}. Nebo použijte modelové předpoklady.`);
    } else {
      setError(null);
    }
  }

  return (
    <section id="investice" className="mt-12">
      <h2 className="font-display text-2xl text-[var(--text-primary)]">Náklady a výnos</h2>
      <p className="mt-2 max-w-3xl text-sm text-[var(--text-secondary)]">
        Spočítejte si orientační rozpočet. Výpočet je před daní a vychází z vašich vstupů.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <ModeButton active={mode === "bydleni"} onClick={() => setMode("bydleni")}>
          Pro vlastní bydlení
        </ModeButton>
        <ModeButton active={mode === "investice"} onClick={() => setMode("investice")}>
          Pro investici
        </ModeButton>
      </div>

      {mode === "bydleni" ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Field label="Kupní cena" value={purchase} onChange={setPurchase} suffix="Kč" hint="údaj nabídky" />
          <Field label="Čerpaný úvěr" value={loan} onChange={setLoan} suffix="Kč" hint="0 = bez úvěru" />
          <Field label="Rekonstrukce" value={reno} onChange={setReno} suffix="Kč" hint="volitelné" />
          <Field label="Úrok p.a." value={rate} onChange={setRate} suffix="%" />
          <Field label="Splatnost" value={years} onChange={setYears} suffix="roky" />
          <Field label="Další pořizovací náklady" value={costs} onChange={setCosts} suffix="Kč" hint="volitelné" />
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Field label="Kupní cena" value={purchase} onChange={setPurchase} suffix="Kč" hint="údaj nabídky" />
            <Field label="Čerpaný úvěr" value={loan} onChange={setLoan} suffix="Kč" hint="0 = bez úvěru" />
            <Field label="Rekonstrukce" value={reno} onChange={setReno} suffix="Kč" />
            <Field
              label="Čisté nájemné / měsíc"
              value={rent}
              onChange={setRent}
              suffix="Kč"
              hint={rentAsking ? "údaj nabídky" : "vlastní scénář"}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowAssumptions((value) => !value)}
              className="rounded-full border border-[var(--border-default)] bg-[var(--surface-primary)] px-4 py-2 text-sm font-medium text-[var(--text-primary)]"
            >
              {showAssumptions ? "Skrýt předpoklady" : "Upravit předpoklady"}
            </button>
            <button
              type="button"
              onClick={applyModelAssumptions}
              className="rounded-full border border-[var(--border-default)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)]"
            >
              Použít modelové předpoklady
            </button>
            <button
              type="button"
              onClick={validateInvestment}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Spočítat
            </button>
          </div>
          {usedModel ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Modelové předpoklady: 70 % LTV, 5 % p.a., 30 let, 95 % obsazenost, provoz 36 000 Kč/rok,
              rezerva 12 000 Kč/rok. Lze upravit.
            </p>
          ) : null}
          {showAssumptions ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Pořizovací náklady" value={costs} onChange={setCosts} suffix="Kč" />
              <Field label="Vybavení" value={furnish} onChange={setFurnish} suffix="Kč" />
              <Field label="Úrok p.a." value={rate} onChange={setRate} suffix="%" />
              <Field label="Splatnost" value={years} onChange={setYears} suffix="roky" />
              <Field label="Obsazenost" value={occupancy} onChange={setOccupancy} suffix="%" />
              <Field label="Provoz vlastníka / rok" value={opex} onChange={setOpex} suffix="Kč" />
              <Field label="Odklad do rezervy / rok" value={reserve} onChange={setReserve} suffix="Kč" />
            </div>
          ) : null}
        </>
      )}

      {error ? <p className="mt-3 text-sm text-[var(--text-secondary)]">{error}</p> : null}

      {mode === "bydleni" && livingResult ? (
        <dl className="mt-6 grid gap-3 sm:grid-cols-3">
          <Metric label="Celková investice" value={formatCzk(livingResult.total.toNumber())} />
          <Metric label="Vlastní prostředky" value={formatCzk(livingResult.equity.toNumber())} />
          <Metric
            label="Měsíční splátka"
            value={
              livingResult.payment == null
                ? "Bez úvěru"
                : `${formatCzk(livingResult.payment.toNumber())} / měsíc`
            }
          />
        </dl>
      ) : null}

      {mode === "investice" && investmentResult ? (
        <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Metric label="Celková investice" value={formatCzk(investmentResult.totalInvestment.toNumber())} />
          <Metric label="Vlastní kapitál" value={formatCzk(investmentResult.equity.toNumber())} />
          <Metric
            label="Měsíční splátka"
            value={
              investmentResult.monthlyPayment == null
                ? "Bez úvěru"
                : `${formatCzk(investmentResult.monthlyPayment.toNumber())} / měsíc`
            }
          />
          <Metric label="NOI / rok" value={formatCzk(investmentResult.noi.toNumber())} />
          <Metric
            label="Cash flow po rezervě / měsíc"
            value={formatCzk(investmentResult.disposableMonthlyCashFlow.toNumber())}
          />
          <Metric
            label="Cash-on-cash"
            value={
              investmentResult.cashOnCash == null
                ? "Nelze spočítat"
                : `${investmentResult.cashOnCash.mul(100).toFixed(2)} %`
            }
          />
        </dl>
      ) : null}
    </section>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-2 text-sm font-medium",
        active
          ? "bg-slate-900 text-white"
          : "border border-[var(--border-default)] bg-[var(--surface-primary)] text-[var(--text-secondary)]",
      )}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  suffix,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  hint?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-[var(--text-primary)]">{label}</span>
      {hint ? <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{hint}</span> : null}
      <span className="mt-1 flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2">
        <input
          value={value}
          inputMode="decimal"
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent font-metric text-[var(--text-primary)] outline-none"
        />
        {suffix ? <span className="shrink-0 text-xs text-[var(--text-muted)]">{suffix}</span> : null}
      </span>
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-3">
      <dt className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{label}</dt>
      <dd className="mt-1 font-metric text-lg text-[var(--text-primary)]">{value}</dd>
    </div>
  );
}
