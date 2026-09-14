"use client";

/**
 * PropertyFinancingSummary component — shows the structured breakdown of
 * purchasePrice, valuation, equity, loan, LTV, and payment.
 *
 * Also surfaces the financing gap ("financingGap") in Czech with clear phrasing.
 */

import { AlertTriangle, Info } from "lucide-react";

import type { PropertyFinancingSummary } from "@/domains/financing";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function formatCzk(czk: number, compact = false): string {
  if (compact && czk >= 1_000_000) {
    return (czk / 1_000_000).toFixed(1).replace(".", ",") + "\u00a0mil.\u00a0Kč";
  }
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(czk);
}

function formatPct(pct: number): string {
  return pct.toFixed(1).replace(".", ",") + "\u00a0%";
}

// ---------------------------------------------------------------------------
// Valuation vs price warning
// ---------------------------------------------------------------------------

function ValuationGapWarning({
  askingPriceCzk,
  valuationCzk,
}: {
  askingPriceCzk: number;
  valuationCzk: number;
}) {
  const diff = askingPriceCzk - valuationCzk;
  return (
    <div className="flex items-start gap-2 rounded-[var(--radius-sm)] px-3 py-2.5 bg-[color-mix(in_srgb,var(--status-warning)_8%,white)] border border-[color-mix(in_srgb,var(--status-warning)_25%,white)]">
      <AlertTriangle
        className="size-4 text-[var(--status-warning)] shrink-0 mt-0.5"
        aria-hidden
      />
      <p className="text-sm text-[var(--text-primary)]">
        Odhadovaná hodnota ({formatCzk(valuationCzk, true)}) je nižší než kupní
        cena ({formatCzk(askingPriceCzk, true)}). Banka pravděpodobně vypočítá
        LTV z hodnoty odhadu — potřebný úvěr může přesahovat povolenou výši.{" "}
        <strong>Rozdíl {formatCzk(diff)} musíte pokrýt vlastním kapitálem.</strong>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single stat row
// ---------------------------------------------------------------------------

function StatRow({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 py-2.5 border-b border-[var(--border-default)] last:border-0",
        highlight && "bg-[var(--background-secondary)] -mx-3 px-3 rounded-[var(--radius-sm)]",
      )}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-sm text-[var(--text-secondary)]">{label}</span>
        {sub && <span className="text-xs text-[var(--text-muted)]">{sub}</span>}
      </div>
      <span className={cn("text-sm font-semibold tabular-nums shrink-0", highlight && "text-[var(--text-primary)]")}>
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Financing gap callout
// ---------------------------------------------------------------------------

function FinancingGapCallout({ gapCzk }: { gapCzk: number }) {
  if (gapCzk === 0) return null;
  return (
    <div className="flex items-start gap-2 mt-3 rounded-[var(--radius-sm)] px-3 py-2.5 bg-[color-mix(in_srgb,var(--status-error)_6%,white)] border border-[color-mix(in_srgb,var(--status-error)_20%,white)]">
      <AlertTriangle
        className="size-4 text-[var(--status-error)] shrink-0 mt-0.5"
        aria-hidden
      />
      <p className="text-sm">
        Podle zadaného scénáře chybí přibližně{" "}
        <strong className="text-[var(--status-error)]">{formatCzk(gapCzk)}</strong>.
        Zvyšte vlastní kapitál nebo vyberte produkt s vyšším povoleným LTV.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Post-fixation rate note
// ---------------------------------------------------------------------------

function RateAssumptionNote({
  postFixationPp,
  futureRefinancePp,
}: {
  postFixationPp: number;
  futureRefinancePp: number;
}) {
  return (
    <div className="flex items-start gap-2 mt-3 rounded-[var(--radius-sm)] px-3 py-2.5 bg-[var(--background-secondary)]">
      <Info className="size-4 text-[var(--text-muted)] shrink-0 mt-0.5" aria-hidden />
      <p className="text-xs text-[var(--text-muted)]">
        Modelový předpoklad: po skončení fixace sazba{" "}
        <strong>{formatPct(postFixationPp)}</strong> (refipředpoklad:{" "}
        {formatPct(futureRefinancePp)}). Tyto hodnoty slouží pro projekci IRR a
        cash flow v investiční analýze — nejde o nabídku banky.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function PropertyFinancingSummaryCard({
  summary,
  className,
}: {
  summary: PropertyFinancingSummary;
  className?: string;
}) {
  const {
    purchasePriceCzk,
    valuationCzk,
    valuationBelowPriceWarning,
    availableEquityCzk,
    requestedLoanCzk,
    maxEligibleLoanCzk,
    financingGapCzk,
    ltvOnAskingPricePct,
    ltvOnValuationPct,
    nominalInterestRatePp,
    aprPp,
    estimatedMonthlyPaymentCzk,
    totalPaidCzk,
    totalInterestCzk,
    termYears,
    postFixationRateAssumptionPp,
    futureRefinanceRateAssumptionPp,
  } = summary;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Valuation warning */}
      {valuationBelowPriceWarning && valuationCzk !== null && (
        <ValuationGapWarning
          askingPriceCzk={purchasePriceCzk}
          valuationCzk={valuationCzk}
        />
      )}

      {/* Acquisition summary */}
      <Card variant="static" padding="md">
        <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
          Struktura financování
        </h4>
        <StatRow label="Kupní cena" value={formatCzk(purchasePriceCzk)} />
        {valuationCzk !== null && (
          <StatRow
            label="Odhadovaná hodnota"
            value={formatCzk(valuationCzk)}
            sub={valuationBelowPriceWarning ? "LTV se počítá z odhadu" : undefined}
          />
        )}
        <StatRow
          label="Vlastní kapitál"
          value={formatCzk(availableEquityCzk)}
          highlight
        />
        <StatRow label="Požadovaný úvěr" value={formatCzk(requestedLoanCzk)} highlight />
        {maxEligibleLoanCzk !== null && (
          <StatRow
            label="Max. úvěr (dle LTV podmínek)"
            value={formatCzk(maxEligibleLoanCzk)}
            sub="Na základě vybrané nabídky"
          />
        )}
        {ltvOnAskingPricePct !== null && (
          <StatRow
            label="LTV (z kupní ceny)"
            value={formatPct(ltvOnAskingPricePct)}
          />
        )}
        {ltvOnValuationPct !== null && valuationBelowPriceWarning && (
          <StatRow
            label="LTV (z odhadu)"
            value={formatPct(ltvOnValuationPct)}
            sub="Toto LTV banka pravděpodobně použije"
            highlight
          />
        )}
      </Card>

      {/* Financing gap */}
      {financingGapCzk !== null && financingGapCzk > 0 && (
        <FinancingGapCallout gapCzk={financingGapCzk} />
      )}

      {/* Payment summary */}
      {estimatedMonthlyPaymentCzk !== null && (
        <Card variant="static" padding="md">
          <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
            Orientační splátka (modelový scénář)
          </h4>
          <StatRow
            label="Měsíční splátka"
            value={formatCzk(estimatedMonthlyPaymentCzk)}
            sub={
              nominalInterestRatePp != null
                ? `Sazba ${nominalInterestRatePp.toFixed(2).replace(".", ",")}%, ${termYears} let`
                : undefined
            }
            highlight
          />
          {aprPp !== null ? (
            <StatRow
              label="RPSN (Reprezentativní)"
              value={formatPct(aprPp)}
              sub="Informativní — nezahrnuje individuální podmínky"
            />
          ) : (
            <div className="py-2 text-sm text-[var(--text-muted)]">
              RPSN není v tomto zdroji dostupné
            </div>
          )}
          {totalPaidCzk !== null && (
            <StatRow label="Celkem zaplaceno" value={formatCzk(totalPaidCzk)} />
          )}
          {totalInterestCzk !== null && (
            <StatRow label="Z toho úroky" value={formatCzk(totalInterestCzk)} />
          )}
          <p className="text-xs text-[var(--text-muted)] mt-3 leading-relaxed">
            Modelový scénář — výpočet platí pro rovnoměrnou anuitní splátku po
            celou dobu splatnosti bez předčasného splacení. Skutečná splátka
            závisí na podmínkách banky a případných poplatcích.
          </p>
        </Card>
      )}

      {/* Post-fixation assumptions */}
      {postFixationRateAssumptionPp !== null &&
        futureRefinanceRateAssumptionPp !== null && (
          <RateAssumptionNote
            postFixationPp={postFixationRateAssumptionPp}
            futureRefinancePp={futureRefinanceRateAssumptionPp}
          />
        )}
    </div>
  );
}
