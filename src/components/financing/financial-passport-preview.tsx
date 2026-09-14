"use client";

/**
 * FinancialPassportPreview — shows the user's Financial Passport data
 * relevant to financing, with explicit opt-in to pre-fill the calculator.
 *
 * Design principles (Prompt 13/3):
 *   1. Never silently inject passport data — explicit user action required.
 *   2. "Upravit pro tento scénář" overrides only the local scenario, never the global passport.
 *   3. Sensitive data (income, liabilities) shown in bucketed form, not exact.
 *   4. Login CTA shown when isAuthenticated=false — never fabricate a session.
 */

import * as React from "react";

import {
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  Edit2,
  LogIn,
  RotateCcw,
} from "lucide-react";

import type { PassportState } from "@/lib/financial-passport/types";
import { buildLoginUrl } from "@/lib/auth/callback-url";
import {
  applyScenarioOverride,
  buildReadinessInputFromPassport,
  type MortgageReadinessInput,
  type PassportScenarioOverride,
} from "@/domains/financing";
import type { PropertyFinancingSummary } from "@/domains/financing";
import { Field } from "@/components/forms/field";
import { CurrencyInput } from "@/components/forms/inputs";
import { InlineAlert } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Bucketed income display (never show exact amount in preview)
// ---------------------------------------------------------------------------

function bucketedLabel(
  value: number | null,
  type: "equity" | "income" | "liabilities",
): string {
  if (!value || !Number.isFinite(value) || value <= 0) return "—";

  if (type === "equity") {
    if (value >= 5_000_000) return "5 mil. Kč +";
    if (value >= 2_000_000) return "2–5 mil. Kč";
    if (value >= 1_000_000) return "1–2 mil. Kč";
    if (value >= 500_000) return "500 tis. – 1 mil. Kč";
    return "méně než 500 tis. Kč";
  }

  if (type === "income") {
    if (value >= 150_000) return "150 000 Kč/měs+";
    if (value >= 80_000) return "80 000–150 000 Kč/měs";
    if (value >= 40_000) return "40 000–80 000 Kč/měs";
    return "do 40 000 Kč/měs";
  }

  // liabilities
  if (value === 0) return "Žádné";
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(value);
}

// ---------------------------------------------------------------------------
// Passport data row
// ---------------------------------------------------------------------------

function PassportRow({
  label,
  display,
  filled,
}: {
  label: string;
  display: string;
  filled: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-[var(--border-default)] last:border-0">
      <div className="flex items-center gap-1.5">
        {filled ? (
          <BadgeCheck className="size-3.5 text-[var(--status-success)] shrink-0" aria-hidden />
        ) : (
          <span className="size-3.5 shrink-0" aria-hidden />
        )}
        <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      </div>
      <span
        className={cn(
          "text-sm font-medium",
          filled ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]",
        )}
      >
        {display}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scenario edit form
// ---------------------------------------------------------------------------

function ScenarioEditForm({
  override,
  onChange,
  onReset,
}: {
  override: PassportScenarioOverride;
  onChange: (o: PassportScenarioOverride) => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-4 mt-4 pt-4 border-t border-[var(--border-default)]">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[var(--text-primary)]">
          Upravit pro tento scénář
        </p>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
        >
          <RotateCcw className="size-3.5" aria-hidden />
          Vrátit z pasu
        </button>
      </div>
      <InlineAlert tone="info">
        Změny platí pouze pro tento výpočet — Finanční pas zůstane nezměněn.
      </InlineAlert>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field
          id="scenario-income"
          label="Měsíční příjem (Kč)"
          helperText="Orientační — pro posouzení úvěruschopnosti"
        >
          <CurrencyInput
            id="scenario-income"
            value={override.monthlyIncomeCzk ?? null}
            onValueChange={(v) => onChange({ ...override, monthlyIncomeCzk: v })}
            placeholder="65 000"
          />
        </Field>
        <Field
          id="scenario-liabilities"
          label="Měsíční závazky (Kč)"
          helperText="Stávající splátky úvěrů, leasingů"
        >
          <CurrencyInput
            id="scenario-liabilities"
            value={override.monthlyLiabilitiesCzk ?? null}
            onValueChange={(v) =>
              onChange({ ...override, monthlyLiabilitiesCzk: v })
            }
            placeholder="5 000"
          />
        </Field>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type FinancialPassportPreviewProps = {
  isAuthenticated: boolean;
  /** Populated when user is authenticated and has a passport. */
  passportState: PassportState | null;
  financingSummary: PropertyFinancingSummary | null;
  callbackUrl?: string;
  /** Fired when user explicitly clicks "Použít data z Finančního pasu". */
  onApplyPassport: (input: MortgageReadinessInput) => void;
  className?: string;
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function FinancialPassportPreview({
  isAuthenticated,
  passportState,
  financingSummary,
  callbackUrl,
  onApplyPassport,
  className,
}: FinancialPassportPreviewProps) {
  const [expanded, setExpanded] = React.useState(false);
  const [editMode, setEditMode] = React.useState(false);
  const [override, setOverride] = React.useState<PassportScenarioOverride>({});
  const [applied, setApplied] = React.useState(false);

  // ----- Not logged in -----
  if (!isAuthenticated) {
    return (
      <Card variant="muted" padding="md" className={cn("space-y-3", className)}>
        <div className="flex items-start gap-3">
          <LogIn className="size-5 text-[var(--text-muted)] shrink-0 mt-0.5" aria-hidden />
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Finanční pas
            </p>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              Po přihlášení si můžete předvyplnit vlastní zdroje, příjem a
              závazky z Finančního pasu — bez nutnosti je psát znovu.
            </p>
          </div>
        </div>
        <ButtonLink
          href={buildLoginUrl(callbackUrl)}
          variant="secondary"
          size="sm"
          className="w-full sm:w-auto"
        >
          <LogIn className="size-3.5" aria-hidden />
          Přihlásit se a použít pas
        </ButtonLink>
      </Card>
    );
  }

  // ----- Authenticated, no passport -----
  if (!passportState) {
    return (
      <Card variant="muted" padding="md" className={cn("space-y-3", className)}>
        <p className="text-sm font-medium text-[var(--text-primary)]">
          Finanční pas
        </p>
        <p className="text-sm text-[var(--text-secondary)]">
          Zatím nemáte vyplněný Finanční pas. Doplňte ho jednou a příště
          nemusíte zadávat příjem a vlastní zdroje ručně.
        </p>
        <ButtonLink
          href="/ucet/financni-profil"
          variant="secondary"
          size="sm"
        >
          Vyplnit Finanční pas
        </ButtonLink>
      </Card>
    );
  }

  // ----- Authenticated + has passport -----
  const passport = passportState;

  const baseInput = buildReadinessInputFromPassport(
    passport,
    financingSummary,
    true,
  );
  const effectiveInput = applyScenarioOverride(baseInput, override);

  const rows: Array<{ label: string; display: string; filled: boolean }> = [
    {
      label: "Vlastní zdroje",
      display: bucketedLabel(passport.availableEquityCzk, "equity"),
      filled: passport.availableEquityCzk != null,
    },
    {
      label: "Měsíční příjem",
      display: override.monthlyIncomeCzk != null
        ? bucketedLabel(override.monthlyIncomeCzk, "income") + " (upraveno)"
        : bucketedLabel(passport.monthlyIncomeCzk, "income"),
      filled:
        (override.monthlyIncomeCzk ?? passport.monthlyIncomeCzk) != null,
    },
    {
      label: "Měsíční závazky",
      display: override.monthlyLiabilitiesCzk != null
        ? bucketedLabel(override.monthlyLiabilitiesCzk, "liabilities") +
          " (upraveno)"
        : bucketedLabel(passport.monthlyLiabilitiesCzk, "liabilities"),
      filled:
        (override.monthlyLiabilitiesCzk ?? passport.monthlyLiabilitiesCzk) !=
        null,
    },
  ];

  function handleApply() {
    onApplyPassport(effectiveInput);
    setApplied(true);
    setTimeout(() => setApplied(false), 3000);
  }

  function handleReset() {
    setOverride({});
    setEditMode(false);
  }

  return (
    <Card variant="static" padding="md" className={cn("space-y-0", className)}>
      {/* Header */}
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 text-left"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <BadgeCheck className="size-4 text-[var(--status-success)]" aria-hidden />
          <span className="text-sm font-medium text-[var(--text-primary)]">
            Finanční pas
          </span>
          {applied && (
            <span className="text-xs text-[var(--status-success)]">
              ✓ Aplikováno
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="size-4 text-[var(--text-muted)]" aria-hidden />
        ) : (
          <ChevronDown className="size-4 text-[var(--text-muted)]" aria-hidden />
        )}
      </button>

      {/* Collapsed summary */}
      {!expanded && (
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Máte uložená data z pasu. Klikněte pro náhled a možnost předvyplnění.
        </p>
      )}

      {/* Expanded content */}
      {expanded && (
        <div className="mt-4 space-y-0">
          {/* Data preview */}
          <div>
            {rows.map((r) => (
              <PassportRow
                key={r.label}
                label={r.label}
                display={r.display}
                filled={r.filled}
              />
            ))}
          </div>

          {/* Scenario edit */}
          {editMode ? (
            <ScenarioEditForm
              override={override}
              onChange={setOverride}
              onReset={handleReset}
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditMode(true)}
              className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <Edit2 className="size-3.5" aria-hidden />
              Upravit pro tento scénář
            </button>
          )}

          {/* Apply CTA — explicit only */}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleApply}
            >
              Použít údaje z Finančního pasu
            </Button>
            <p className="text-xs text-[var(--text-muted)]">
              Data zůstanou pouze v tomto výpočtu.
            </p>
          </div>

          {/* Link to full passport */}
          <div className="mt-3 pt-3 border-t border-[var(--border-default)]">
            <ButtonLink
              href="/ucet/financni-profil"
              variant="ghost"
              size="sm"
              className="text-xs"
            >
              Upravit Finanční pas →
            </ButtonLink>
          </div>
        </div>
      )}
    </Card>
  );
}
