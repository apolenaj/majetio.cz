"use client";

import * as React from "react";
import type { PropertyType } from "@prisma/client";

import { PassportSummaryCard } from "@/components/financial-passport/passport-summary";
import { InlineAlert } from "@/components/feedback/states";
import { Field, TextInput } from "@/components/forms/field";
import { CurrencyInput, NumberInput } from "@/components/forms/inputs";
import { RadioGroup } from "@/components/forms/controls";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { saveFinancialPassport } from "@/lib/financial-passport/actions";
import { computePassportProgress } from "@/lib/financial-passport/progress";
import { buildPassportRecommendations } from "@/lib/financial-passport/recommendations";
import {
  CZECH_REGIONS,
  DISPOSITION_OPTIONS,
  FINANCING_OPTIONS,
  INVESTMENT_STRATEGY_OPTIONS,
  ONBOARDING_GOALS,
  PROPERTY_TYPE_OPTIONS,
  RISK_TOLERANCE_OPTIONS,
  latestPassportTimestamp,
  type FinancingModeId,
  type OnboardingGoalId,
  type PassportState,
  type RiskToleranceId,
} from "@/lib/financial-passport/types";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

function ChoiceChip({
  selected,
  label,
  onClick,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "min-h-11 rounded-[var(--radius-md)] border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
        selected
          ? "border-[var(--action-primary)] bg-[color-mix(in_srgb,var(--action-primary)_8%,white)] font-medium"
          : "border-[var(--border-default)] bg-[var(--surface-primary)] hover:bg-[var(--background-secondary)]",
      )}
    >
      {label}
    </button>
  );
}

function SectionCard({
  letter,
  title,
  description,
  children,
}: {
  letter: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card padding="lg" id={`section-${letter}`}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <StatusBadge tone="neutral">{letter}</StatusBadge>
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <div className="mt-4 space-y-4">{children}</div>
    </Card>
  );
}

export function FinancialPassportForm({
  initialState,
}: {
  initialState: PassportState;
}) {
  const [state, setState] = React.useState(initialState);
  const [error, setError] = React.useState<string | null>(null);
  const [conflict, setConflict] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [savedHint, setSavedHint] = React.useState(false);
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const progress = computePassportProgress(state);
  const recommendations = buildPassportRecommendations(state);
  const lastSaved = latestPassportTimestamp(state.timestamps);

  React.useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  function patch(partial: Partial<PassportState>) {
    setState((prev) => {
      const next = { ...prev, ...partial };
      queueAutosave(next);
      return next;
    });
  }

  function queueAutosave(next: PassportState) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persist(next, { silent: true });
    }, 700);
  }

  async function persist(next: PassportState, options?: { silent?: boolean }) {
    setSaving(true);
    setError(null);
    setConflict(false);
    const result = await saveFinancialPassport({
      expectedTimestamps: next.timestamps,
      goal: next.goal,
      maxPriceCzk: next.maxPriceCzk,
      availableEquityCzk: next.availableEquityCzk,
      equityPercent: next.equityPercent,
      financingMode: next.financingMode,
      monthlyIncomeCzk: next.monthlyIncomeCzk,
      monthlyLiabilitiesCzk: next.monthlyLiabilitiesCzk,
      riskTolerance: next.riskTolerance,
      strategies: next.strategies,
      targetGrossYieldPct: next.targetGrossYieldPct,
      targetCashFlowMonthlyCzk: next.targetCashFlowMonthlyCzk,
      preferredCity: next.preferredCity,
      regions: next.regions,
      propertyTypes: next.propertyTypes,
      dispositions: next.dispositions,
      minAreaSqm: next.minAreaSqm,
      maxAreaSqm: next.maxAreaSqm,
    });
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      if (result.code === "CONFLICT" && result.state) {
        setConflict(true);
        setState(result.state);
      }
      return false;
    }

    setState(result.state);
    if (!options?.silent) {
      setSavedHint(true);
      setTimeout(() => setSavedHint(false), 1800);
    }
    return true;
  }

  function toggleType(type: PropertyType) {
    patch({
      propertyTypes: state.propertyTypes.includes(type)
        ? state.propertyTypes.filter((t) => t !== type)
        : [...state.propertyTypes, type],
    });
  }

  function toggleRegion(region: string) {
    patch({
      regions: state.regions.includes(region)
        ? state.regions.filter((r) => r !== region)
        : [...state.regions, region].slice(0, 5),
    });
  }

  function toggleDisposition(value: string) {
    patch({
      dispositions: state.dispositions.includes(value)
        ? state.dispositions.filter((d) => d !== value)
        : [...state.dispositions, value],
    });
  }

  function toggleStrategy(id: string) {
    patch({
      strategies: state.strategies.includes(id)
        ? state.strategies.filter((s) => s !== id)
        : [...state.strategies, id],
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-h2 text-[var(--text-primary)]">Finanční pas</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
            Jen údaje potřebné k personalizaci. Neptáme se na rodné číslo, adresu bydliště ani
            zaměstnavatele.
          </p>
        </div>
        <div className="text-sm text-[var(--text-muted)] sm:text-right">
          <p>
            {saving ? "Ukládám…" : savedHint ? "Uloženo" : "Automatické ukládání"}
          </p>
          <p>Naposledy: {formatDateTime(lastSaved)}</p>
        </div>
      </div>

      <Card padding="lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium text-[var(--text-primary)]">{progress.label}</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{progress.description}</p>
          </div>
          <StatusBadge
            tone={
              progress.level === "ready"
                ? "success"
                : progress.level === "extended"
                  ? "info"
                  : progress.level === "basic"
                    ? "warning"
                    : "neutral"
            }
          >
            {progress.percent} %
          </StatusBadge>
        </div>
        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--background-secondary)]"
          role="progressbar"
          aria-valuenow={progress.percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-[var(--action-accent)]"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-3">
          {progress.sections.map((section) => (
            <li key={section.id} className="text-xs text-[var(--text-muted)]">
              <a href={`#section-${section.letter}`} className="hover:underline">
                {section.letter}. {section.title}
                {section.filled ? " ✓" : ""}
              </a>
            </li>
          ))}
        </ul>
      </Card>

      {conflict ? (
        <InlineAlert tone="warning" title="Konflikt verzí">
          Pas byl upraven jinde. Načetli jsme aktuální data — zkontrolujte je a uložte znovu.
        </InlineAlert>
      ) : null}
      {error && !conflict ? (
        <InlineAlert tone="error" title="Uložení se nepovedlo">
          {error}
        </InlineAlert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <SectionCard
            letter="A"
            title="Cíl"
            description="Proč nemovitost hledáte — podle toho upravíme doporučení."
          >
            <div className="grid gap-2">
              {ONBOARDING_GOALS.map((goal) => (
                <ChoiceChip
                  key={goal.id}
                  selected={state.goal === goal.id}
                  label={goal.label}
                  onClick={() => patch({ goal: goal.id as OnboardingGoalId })}
                />
              ))}
            </div>
          </SectionCard>

          <SectionCard
            letter="B"
            title="Rozpočet"
            description="Maximální kupní cena — orientační horní hranice."
          >
            <Field id="passport-budget" label="Max. kupní cena" optional>
              <CurrencyInput
                value={state.maxPriceCzk}
                onValueChange={(value) => patch({ maxPriceCzk: value })}
              />
            </Field>
          </SectionCard>

          <SectionCard
            letter="C"
            title="Vlastní kapitál"
            description="Částka nebo podíl. Nemusíte vyplnit obojí."
          >
            <Field id="passport-equity" label="Vlastní zdroje" optional>
              <CurrencyInput
                value={state.availableEquityCzk}
                onValueChange={(value) => patch({ availableEquityCzk: value })}
              />
            </Field>
            <Field id="passport-equity-pct" label="Podíl z kupní ceny" optional>
              <NumberInput
                value={state.equityPercent}
                onValueChange={(value) => patch({ equityPercent: value })}
                suffix="%"
              />
            </Field>
          </SectionCard>

          <SectionCard letter="D" title="Financování" description="Jak plánujete koupi financovat.">
            <div className="grid gap-2">
              {FINANCING_OPTIONS.map((opt) => (
                <ChoiceChip
                  key={opt.id}
                  selected={state.financingMode === opt.id}
                  label={opt.label}
                  onClick={() => patch({ financingMode: opt.id as FinancingModeId })}
                />
              ))}
            </div>
          </SectionCard>

          <SectionCard
            letter="E"
            title="Příjem"
            description="Volitelné. Nepotřebujeme zaměstnavatele ani výplatní pásky."
          >
            <Field id="passport-income" label="Měsíční čistý příjem" optional>
              <CurrencyInput
                value={state.monthlyIncomeCzk}
                onValueChange={(value) => patch({ monthlyIncomeCzk: value })}
              />
            </Field>
          </SectionCard>

          <SectionCard
            letter="F"
            title="Závazky"
            description="Volitelné. Součet měsíčních splátek a podobných závazků."
          >
            <Field id="passport-liabilities" label="Měsíční závazky" optional>
              <CurrencyInput
                value={state.monthlyLiabilitiesCzk}
                onValueChange={(value) => patch({ monthlyLiabilitiesCzk: value })}
              />
            </Field>
          </SectionCard>

          <SectionCard
            letter="G"
            title="Investiční preference"
            description="Tolerance rizika a případné výnosové cíle. Nejde o investiční doporučení."
          >
            <RadioGroup
              name="risk-tolerance"
              legend="Tolerance rizika"
              value={state.riskTolerance ?? undefined}
              onChange={(value) => patch({ riskTolerance: value as RiskToleranceId })}
              options={RISK_TOLERANCE_OPTIONS.map((r) => ({
                value: r.id,
                label: r.label,
                description: r.description,
              }))}
            />
            <div>
              <p className="mb-2 text-sm font-medium">Strategie</p>
              <div className="flex flex-wrap gap-2">
                {INVESTMENT_STRATEGY_OPTIONS.map((opt) => (
                  <ChoiceChip
                    key={opt.id}
                    selected={state.strategies.includes(opt.id)}
                    label={opt.label}
                    onClick={() => toggleStrategy(opt.id)}
                  />
                ))}
              </div>
            </div>
            <Field id="passport-yield" label="Požadovaný hrubý výnos" optional>
              <NumberInput
                value={state.targetGrossYieldPct}
                onValueChange={(value) => patch({ targetGrossYieldPct: value })}
                suffix="%"
              />
            </Field>
            <Field id="passport-cf" label="Cílové cash flow měsíčně" optional>
              <CurrencyInput
                value={state.targetCashFlowMonthlyCzk}
                onValueChange={(value) => patch({ targetCashFlowMonthlyCzk: value })}
              />
            </Field>
          </SectionCard>

          <SectionCard
            letter="H"
            title="Lokality"
            description="Město a kraj stačí — přesnou adresu neukládáme."
          >
            <Field id="passport-city" label="Město" optional>
              <TextInput
                value={state.preferredCity}
                onChange={(e) => patch({ preferredCity: e.target.value })}
                autoComplete="address-level2"
              />
            </Field>
            <div>
              <p className="mb-2 text-sm font-medium">Kraj</p>
              <div className="grid max-h-56 gap-2 overflow-y-auto sm:grid-cols-2">
                {CZECH_REGIONS.map((region) => (
                  <ChoiceChip
                    key={region}
                    selected={state.regions.includes(region)}
                    label={region}
                    onClick={() => toggleRegion(region)}
                  />
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            letter="I"
            title="Preference nemovitosti"
            description="Typ, dispozice a orientační výměra."
          >
            <div>
              <p className="mb-2 text-sm font-medium">Typ</p>
              <div className="flex flex-wrap gap-2">
                {PROPERTY_TYPE_OPTIONS.map((opt) => (
                  <ChoiceChip
                    key={opt.id}
                    selected={state.propertyTypes.includes(opt.id)}
                    label={opt.label}
                    onClick={() => toggleType(opt.id)}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Dispozice</p>
              <div className="flex flex-wrap gap-2">
                {DISPOSITION_OPTIONS.map((opt) => (
                  <ChoiceChip
                    key={opt}
                    selected={state.dispositions.includes(opt)}
                    label={opt}
                    onClick={() => toggleDisposition(opt)}
                  />
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="passport-area-min" label="Min. výměra" optional>
                <NumberInput
                  value={state.minAreaSqm}
                  onValueChange={(value) => patch({ minAreaSqm: value })}
                  suffix="m²"
                />
              </Field>
              <Field id="passport-area-max" label="Max. výměra" optional>
                <NumberInput
                  value={state.maxAreaSqm}
                  onValueChange={(value) => patch({ maxAreaSqm: value })}
                  suffix="m²"
                />
              </Field>
            </div>
          </SectionCard>

          <div className="flex flex-col gap-3 sm:flex-row-reverse">
            <Button
              type="button"
              size="lg"
              fullWidth
              loading={saving}
              onClick={() => void persist(state)}
            >
              Uložit pas
            </Button>
            <ButtonLink href="/ucet" variant="secondary" size="lg" fullWidth>
              Zpět na přehled
            </ButtonLink>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <PassportSummaryCard state={state} />
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Orientační tipy
            </h2>
            {recommendations.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">
                Po doplnění rozpočtu a financování zde uvidíte transparentní orientační tipy.
              </p>
            ) : (
              recommendations.map((tip) => (
                <InlineAlert key={tip.id} tone={tip.tone} title={tip.title}>
                  {tip.body}
                </InlineAlert>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
