"use client";

import { useMemo, useState } from "react";

import { FINANCING_ASSUMPTIONS, resolveFinancingInputs } from "@/config/financing-assumptions";
import { HypotekaJasneCTA } from "@/components/financing/hypotekajasne-cta";
import { calculateMortgage } from "@/lib/calculators/mortgage";
import { formatCzk } from "@/lib/format";
import type { HypotekaJasneLinkContext } from "@/lib/financing/hypotekajasne-url";

export type FinancingSummaryProps = {
  propertyPriceCzk: number;
  propertyUrl?: string | null;
  country?: string | null;
  currency?: string | null;
  sourceContext?: HypotekaJasneLinkContext;
  variant?: "compact" | "panel" | "section";
  foreign?: boolean;
};

export function FinancingSummary({
  propertyPriceCzk,
  propertyUrl,
  country,
  currency,
  sourceContext = "property_detail",
  variant = "panel",
  foreign = false,
}: FinancingSummaryProps) {
  const [open, setOpen] = useState(false);
  const defaults = resolveFinancingInputs({ propertyPriceCzk });
  const [ownFunds, setOwnFunds] = useState(defaults.ownFundsCzk);
  const [rate, setRate] = useState(defaults.annualInterestRatePp);
  const [years, setYears] = useState(defaults.termYears);

  const resolved = useMemo(
    () =>
      resolveFinancingInputs({
        propertyPriceCzk,
        ownFundsCzk: ownFunds,
        annualInterestRatePp: rate,
        termYears: years,
      }),
    [propertyPriceCzk, ownFunds, rate, years],
  );

  const mortgage = useMemo(
    () =>
      calculateMortgage({
        principal: resolved.loanAmountCzk,
        annualInterestRate: resolved.annualInterestRatePp,
        years: resolved.termYears,
      }),
    [resolved],
  );

  if (!Number.isFinite(propertyPriceCzk) || propertyPriceCzk <= 0) {
    return (
      <div className="fs-card">
        <p className="fs-muted">
          Pro výpočet financování je potřeba znát cenu nemovitosti.
        </p>
      </div>
    );
  }

  if (resolved.loanAmountCzk <= 0) {
    return (
      <div className="fs-card">
        <p className="fs-label">Orientační financování</p>
        <p className="fs-muted">
          Při zadaných vlastních prostředcích nevzniká úvěr — splátku nezobrazujeme.
        </p>
      </div>
    );
  }

  const payment = mortgage.monthlyPayment;

  if (variant === "compact") {
    return (
      <div className="fs-compact">
        <p>
          Modelově ≈ {payment == null ? "—" : formatCzk(payment)} / měs.
        </p>
        <button type="button" className="fs-link" onClick={() => setOpen((v) => !v)}>
          Zobrazit financování →
        </button>
        {open ? (
          <CompactBody
            resolved={resolved}
            payment={payment}
            foreign={foreign}
            propertyUrl={propertyUrl}
            country={country}
            currency={currency}
            sourceContext={sourceContext}
            ownFunds={ownFunds}
            rate={rate}
            years={years}
            onOwnFunds={setOwnFunds}
            onRate={setRate}
            onYears={setYears}
            editorOpen
          />
        ) : null}
      </div>
    );
  }

  return (
    <section className={`fs-card ${variant === "section" ? "fs-section" : ""}`}>
      <div className="fs-head">
        <h3>{foreign ? "Možnosti financování" : "Financování této nemovitosti"}</h3>
        <p>Orientační výpočet — ne schválení úvěru.</p>
      </div>
      <CompactBody
        resolved={resolved}
        payment={payment}
        foreign={foreign}
        propertyUrl={propertyUrl}
        country={country}
        currency={currency}
        sourceContext={sourceContext}
        ownFunds={ownFunds}
        rate={rate}
        years={years}
        onOwnFunds={setOwnFunds}
        onRate={setRate}
        onYears={setYears}
        editorOpen={open}
        onToggleEditor={() => setOpen((v) => !v)}
        showEditorToggle
      />
    </section>
  );
}

function CompactBody({
  resolved,
  payment,
  foreign,
  propertyUrl,
  country,
  currency,
  sourceContext,
  ownFunds,
  rate,
  years,
  onOwnFunds,
  onRate,
  onYears,
  editorOpen,
  onToggleEditor,
  showEditorToggle,
}: {
  resolved: ReturnType<typeof resolveFinancingInputs>;
  payment: number | null;
  foreign: boolean;
  propertyUrl?: string | null;
  country?: string | null;
  currency?: string | null;
  sourceContext: HypotekaJasneLinkContext;
  ownFunds: number;
  rate: number;
  years: number;
  onOwnFunds: (v: number) => void;
  onRate: (v: number) => void;
  onYears: (v: number) => void;
  editorOpen: boolean;
  onToggleEditor?: () => void;
  showEditorToggle?: boolean;
}) {
  const ctaProps = {
    propertyPriceCzk: resolved.propertyPriceCzk,
    ownFundsCzk: resolved.ownFundsCzk,
    loanAmountCzk: resolved.loanAmountCzk,
    termYears: resolved.termYears,
    ratePp: resolved.annualInterestRatePp,
    propertyUrl,
    country,
    currency,
    sourceContext,
  };

  return (
    <>
      <dl className="fs-grid">
        <div>
          <dt>Cena nemovitosti</dt>
          <dd>{formatCzk(resolved.propertyPriceCzk)}</dd>
        </div>
        <div>
          <dt>Vlastní prostředky</dt>
          <dd>{formatCzk(resolved.ownFundsCzk)}</dd>
        </div>
        <div>
          <dt>Hypotéka / úvěr</dt>
          <dd>{formatCzk(resolved.loanAmountCzk)}</dd>
        </div>
        <div>
          <dt>Orientační splátka</dt>
          <dd className="fs-emphasis">
            {payment == null ? "—" : `≈ ${formatCzk(payment)} / měs.`}
          </dd>
        </div>
        <div>
          <dt>Sazba ve výpočtu</dt>
          <dd>
            {resolved.annualInterestRatePp.toLocaleString("cs-CZ", {
              maximumFractionDigits: 2,
            })}{" "}
            %
          </dd>
        </div>
        <div>
          <dt>Splatnost</dt>
          <dd>{resolved.termYears} let</dd>
        </div>
      </dl>

      {showEditorToggle ? (
        <button type="button" className="fs-link" onClick={onToggleEditor}>
          {editorOpen ? "Skrýt úpravu" : "Upravit výpočet"}
        </button>
      ) : null}

      {editorOpen ? (
        <div className="fs-editor">
          <label>
            Vlastní prostředky (Kč)
            <input
              inputMode="numeric"
              value={ownFunds}
              onChange={(e) =>
                onOwnFunds(Number(e.target.value.replace(/\D/g, "")) || 0)
              }
            />
          </label>
          <label>
            Úroková sazba (% p.a.)
            <input
              inputMode="decimal"
              value={String(rate).replace(".", ",")}
              onChange={(e) => {
                const n = Number(e.target.value.replace(",", "."));
                onRate(Number.isFinite(n) ? Math.max(0, n) : 0);
              }}
            />
          </label>
          <label>
            Splatnost (roky)
            <input
              inputMode="numeric"
              value={years}
              onChange={(e) =>
                onYears(Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1))
              }
            />
          </label>
        </div>
      ) : null}

      <p className="fs-disclaimer">
        {foreign
          ? FINANCING_ASSUMPTIONS.foreignDisclaimerCs
          : FINANCING_ASSUMPTIONS.disclaimerCs}
      </p>
      <p className="fs-meta">
        {FINANCING_ASSUMPTIONS.sourceLabel} · aktualizace{" "}
        {FINANCING_ASSUMPTIONS.lastUpdated}
      </p>

      <div className="fs-actions">
        <HypotekaJasneCTA
          {...ctaProps}
          destination="compare"
          label={
            foreign
              ? "Zjistit možnosti financování"
              : "Porovnat možnosti financování"
          }
        />
        <HypotekaJasneCTA
          {...ctaProps}
          destination="calculator"
          label="Otevřít kalkulačku"
          className="fs-secondary"
        />
      </div>
      <p className="fs-brand">
        Kompletní hypoteční kalkulačka na HypotékaJasně.cz
      </p>
    </>
  );
}
