"use client";

/**
 * MortgageOfferDisplay — structured presentation of a single CanonicalMortgageOffer.
 *
 * Strict 3-tier labelling per Prompt 13/2:
 *   "Inzerovaná sazba"      — interestRateFrom from offer
 *   "Modelový scénář"       — computed annuity on user inputs
 *   "Personalizovaná nabídka" — future: after real underwriting, never shown here
 *
 * No asterisks — all caveats are rendered inline.
 */

import {
  AlertTriangle,
  BadgeCheck,
  Clock,
  Info,
  Lock,
} from "lucide-react";

import type {
  CanonicalMortgageOffer,
  MortgageFreshness,
} from "@/integrations/hypotekajasne/schemas";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPp(pp: number): string {
  return pp.toFixed(2).replace(".", ",") + "\u00a0%";
}

function formatCzk(czk: number): string {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(czk);
}

// ---------------------------------------------------------------------------
// Freshness badge
// ---------------------------------------------------------------------------

export function MortgageFreshnessBadge({
  freshness,
  className,
}: {
  freshness: MortgageFreshness;
  className?: string;
}) {
  if (freshness.isStale) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[var(--text-muted)] text-xs",
          className,
        )}
        title="Sazba nebyla nedávno obnovena"
      >
        <Clock className="size-3.5" aria-hidden />
        {freshness.label}
      </span>
    );
  }

  if (freshness.dataTier === "live") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[var(--status-success)] text-xs",
          className,
        )}
      >
        <BadgeCheck className="size-3.5" aria-hidden />
        {freshness.label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[var(--text-muted)] text-xs",
        className,
      )}
    >
      <Clock className="size-3.5" aria-hidden />
      {freshness.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Rate display label
// ---------------------------------------------------------------------------

/**
 * Row for a single rate figure — rate, label, disclosure mode.
 */
function RateRow({
  label,
  value,
  mode,
  note,
}: {
  label: string;
  value: string;
  mode: "advertised" | "modelled" | "rpsn" | "unavailable";
  note?: string;
}) {
  const modeLabel: Record<typeof mode, string> = {
    advertised: "Inzerovaná sazba",
    modelled: "Modelový scénář",
    rpsn: "Reprezentativní RPSN",
    unavailable: "",
  };

  const modeTone: Record<
    typeof mode,
    "neutral" | "info" | "warning"
  > = {
    advertised: "neutral",
    modelled: "info",
    rpsn: "neutral",
    unavailable: "neutral",
  };

  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-[var(--border-default)] last:border-0">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm text-[var(--text-secondary)]">{label}</span>
        {modeLabel[mode] && (
          <Badge tone={modeTone[mode]} className="self-start text-[10px]">
            {modeLabel[mode]}
          </Badge>
        )}
        {note && (
          <span className="text-xs text-[var(--text-muted)] mt-0.5">{note}</span>
        )}
      </div>
      <span
        className={cn(
          "text-lg font-semibold tabular-nums shrink-0",
          mode === "unavailable"
            ? "text-[var(--text-muted)]"
            : "text-[var(--text-primary)]",
        )}
      >
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fees section
// ---------------------------------------------------------------------------

function FeesSection({
  fees,
}: {
  fees: NonNullable<CanonicalMortgageOffer["fees"]>;
}) {
  const rows: Array<{ label: string; value: string }> = [];
  if (fees.arrangementFeeCzk != null) {
    rows.push({
      label: "Poplatek za sjednání",
      value: fees.arrangementFeeCzk === 0 ? "Zdarma" : formatCzk(fees.arrangementFeeCzk),
    });
  }
  if (fees.valuationFeeCzk != null) {
    rows.push({
      label: "Odhad nemovitosti",
      value: fees.valuationFeeCzk === 0 ? "Zdarma" : formatCzk(fees.valuationFeeCzk),
    });
  }
  if (fees.monthlyFeeCzk != null) {
    rows.push({
      label: "Měsíční poplatek",
      value: fees.monthlyFeeCzk === 0 ? "Zdarma" : `${formatCzk(fees.monthlyFeeCzk)}/měs`,
    });
  }
  if (rows.length === 0) return null;

  return (
    <div className="mt-3">
      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
        Poplatky a podmínky
      </p>
      <ul className="space-y-1">
        {rows.map((r) => (
          <li key={r.label} className="flex justify-between text-sm">
            <span className="text-[var(--text-secondary)]">{r.label}</span>
            <span className="font-medium">{r.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status indicator
// ---------------------------------------------------------------------------

function OfferStatusIndicator({
  status,
}: {
  status: CanonicalMortgageOffer["status"];
}) {
  if (status === "active") return null;

  const config = {
    review_required: {
      tone: "warning" as const,
      icon: AlertTriangle,
      text: "Nabídka čeká na ověření — sazba se mohla změnit",
    },
    inactive: {
      tone: "neutral" as const,
      icon: Lock,
      text: "Nabídka je dočasně nedostupná",
    },
    stale: {
      tone: "neutral" as const,
      icon: Clock,
      text: "Data nebyla nedávno obnovena",
    },
  }[status];

  if (!config) return null;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-sm mb-3",
        status === "review_required"
          ? "bg-[color-mix(in_srgb,var(--status-warning)_8%,white)] text-[var(--status-warning)]"
          : "bg-[var(--background-secondary)] text-[var(--text-muted)]",
      )}
    >
      <Icon className="size-4 shrink-0 mt-0.5" aria-hidden />
      <span>{config.text}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MortgageOfferDisplay({
  offer,
  freshness,
  className,
}: {
  offer: CanonicalMortgageOffer;
  freshness?: MortgageFreshness | null;
  className?: string;
}) {
  return (
    <Card variant="static" padding="md" className={className}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-0.5">
            {offer.bankName}
          </p>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            {offer.productName}
          </h3>
          {offer.fixationYears != null && (
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              Fixace {offer.fixationYears} {offer.fixationYears === 1 ? "rok" : offer.fixationYears < 5 ? "roky" : "let"}
            </p>
          )}
        </div>
        {freshness && (
          <MortgageFreshnessBadge freshness={freshness} className="shrink-0 mt-0.5" />
        )}
      </div>

      <OfferStatusIndicator status={offer.status} />

      {/* Rates */}
      <RateRow
        label="Úroková sazba od"
        value={formatPp(offer.interestRateFrom)}
        mode="advertised"
        note="Platí pro splnění podmínek banky (příjem, pojištění, aj.)"
      />

      {offer.aprFrom != null ? (
        <RateRow
          label="RPSN od"
          value={formatPp(offer.aprFrom)}
          mode="rpsn"
          note="Zahrnuje úrok + poplatky. Pouze orientační — nezohledňuje individuální podmínky."
        />
      ) : (
        <div className="flex items-center gap-2 py-2 border-b border-[var(--border-default)] last:border-0">
          <Info className="size-4 text-[var(--text-muted)] shrink-0" aria-hidden />
          <span className="text-sm text-[var(--text-muted)]">
            RPSN není v tomto zdroji dostupné
          </span>
        </div>
      )}

      {/* LTV conditions */}
      {(offer.ltvMinPct != null || offer.ltvMaxPct != null) && (
        <div className="py-2 border-b border-[var(--border-default)]">
          <span className="text-sm text-[var(--text-secondary)]">LTV podmínky</span>
          <span className="ml-auto text-sm font-medium">
            {offer.ltvMinPct != null && offer.ltvMaxPct != null
              ? `${offer.ltvMinPct}\u00a0%\u2013${offer.ltvMaxPct}\u00a0%`
              : offer.ltvMaxPct != null
                ? `max.\u00a0${offer.ltvMaxPct}\u00a0%`
                : `min.\u00a0${offer.ltvMinPct}\u00a0%`}
          </span>
        </div>
      )}

      {/* Fees */}
      {offer.fees && <FeesSection fees={offer.fees} />}

      {/* Disclaimer */}
      <p className="text-xs text-[var(--text-muted)] mt-4 leading-relaxed">
        Jedná se o inzerovanou sazbu poskytovatele, nikoli personalizovanou nabídku.
        Skutečná sazba závisí na vašem příjmu, zástavní hodnotě nemovitosti a dalších
        podmínkách banky. Pro personalizovanou nabídku kontaktujte HypotekaJasne.cz.
      </p>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Offer list with empty / stale states
// ---------------------------------------------------------------------------

export function MortgageOfferList({
  offers,
  freshness,
  maxVisible = 3,
  className,
}: {
  offers: CanonicalMortgageOffer[];
  freshness?: MortgageFreshness | null;
  maxVisible?: number;
  className?: string;
}) {
  if (offers.length === 0) {
    return (
      <Card variant="muted" padding="md" className={className}>
        <div className="flex items-center gap-2 text-[var(--text-muted)]">
          <Clock className="size-5" aria-hidden />
          <div>
            <p className="text-sm font-medium">Sazby nejsou momentálně dostupné</p>
            {freshness ? (
              <p className="text-xs mt-0.5">{freshness.label}</p>
            ) : (
              <p className="text-xs mt-0.5">
                Zobrazujeme orientační sazbu z předpokladů analýzy.
              </p>
            )}
          </div>
        </div>
      </Card>
    );
  }

  const visible = offers.slice(0, maxVisible).filter((o) => o.status !== "inactive");

  return (
    <div className={cn("space-y-3", className)}>
      {visible.map((offer) => (
        <MortgageOfferDisplay key={offer.id} offer={offer} freshness={freshness} />
      ))}
      {offers.length > maxVisible && (
        <p className="text-xs text-center text-[var(--text-muted)]">
          + {offers.length - maxVisible} dalších nabídek na HypotekaJasne.cz
        </p>
      )}
    </div>
  );
}
