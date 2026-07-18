"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { CurrencyInput, NumberInput } from "@/components/forms/inputs";
import { Field, TextInput } from "@/components/forms/field";
import { InlineAlert } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import {
  completeOnboarding,
  saveOnboardingProgress,
  skipOnboarding,
} from "@/lib/onboarding/actions";
import {
  CZECH_REGIONS,
  FINANCING_OPTIONS,
  INVESTMENT_STRATEGY_OPTIONS,
  ONBOARDING_GOALS,
  PROPERTY_TYPE_OPTIONS,
  emptyOnboardingState,
  getVisibleSteps,
  goalLabel,
  needsInvestmentSteps,
  stepDescription,
  stepTitle,
  type OnboardingState,
  type OnboardingStepId,
} from "@/lib/onboarding/types";
import { formatCzk, formatPercentPoints } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PropertyType } from "@prisma/client";

function ProgressBar({
  currentIndex,
  total,
}: {
  currentIndex: number;
  total: number;
}) {
  const pct = Math.round(((currentIndex + 1) / total) * 100);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span>
          Krok {currentIndex + 1} / {total}
        </span>
        <span>{pct} %</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-[var(--background-secondary)]"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Průběh onboardingu"
      >
        <div
          className="h-full rounded-full bg-[var(--action-accent)] transition-[width] duration-[var(--duration-normal)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ChoiceButton({
  selected,
  title,
  description,
  onClick,
}: {
  selected: boolean;
  title: string;
  description?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-14 w-full rounded-[var(--radius-md)] border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
        selected
          ? "border-[var(--action-primary)] bg-[color-mix(in_srgb,var(--action-primary)_8%,white)]"
          : "border-[var(--border-default)] bg-[var(--surface-primary)] hover:bg-[var(--background-secondary)]",
      )}
      aria-pressed={selected}
    >
      <span className="block font-medium text-[var(--text-primary)]">{title}</span>
      {description ? (
        <span className="mt-1 block text-sm text-[var(--text-secondary)]">{description}</span>
      ) : null}
    </button>
  );
}

export function OnboardingWizard({ initialState }: { initialState: OnboardingState }) {
  const router = useRouter();
  const [state, setState] = React.useState(initialState);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [savedHint, setSavedHint] = React.useState(false);
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const steps = getVisibleSteps(state.goal);
  const stepIndex = Math.max(0, steps.indexOf(state.step));
  const currentStep = steps[stepIndex] ?? "goal";

  React.useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  function queueAutosave(next: OnboardingState, step: OnboardingStepId) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persist(next, step, { silent: true });
    }, 450);
  }

  async function persist(
    next: OnboardingState,
    step: OnboardingStepId,
    options?: { silent?: boolean },
  ) {
    setSaving(true);
    setError(null);
    const result = await saveOnboardingProgress({
      step,
      goal: next.goal,
      propertyTypes: next.propertyTypes,
      preferredCity: next.preferredCity,
      regions: next.regions,
      maxPriceCzk: next.maxPriceCzk,
      availableEquityCzk: next.availableEquityCzk,
      equityPercent: next.equityPercent,
      financingMode: next.financingMode,
      strategies: next.strategies,
      targetGrossYieldPct: next.targetGrossYieldPct,
      targetCashFlowMonthlyCzk: next.targetCashFlowMonthlyCzk,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    setState((prev) => ({ ...result.state, step: prev.step }));
    if (!options?.silent) {
      setSavedHint(true);
      setTimeout(() => setSavedHint(false), 1500);
    }
    return true;
  }

  function goTo(step: OnboardingStepId) {
    setState((prev) => ({ ...prev, step }));
  }

  async function goNext() {
    const visible = getVisibleSteps(state.goal);
    const idx = visible.indexOf(currentStep);
    const nextStep = visible[idx + 1];
    if (!nextStep) return;

    if (currentStep === "goal" && !state.goal) {
      setError("Vyberte prosím cíl.");
      return;
    }
    if (currentStep === "propertyType" && state.propertyTypes.length === 0) {
      setError("Vyberte alespoň jeden typ nemovitosti.");
      return;
    }

    const ok = await persist(state, nextStep);
    if (!ok) return;
    goTo(nextStep);
  }

  function goBack() {
    const visible = getVisibleSteps(state.goal);
    const idx = visible.indexOf(currentStep);
    const prev = visible[idx - 1];
    if (prev) goTo(prev);
  }

  async function finish() {
    const ok = await persist(state, "complete");
    if (!ok) return;
    const result = await completeOnboarding("complete");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setState(result.state);
    goTo("complete");
  }

  async function onSkip() {
    const result = await skipOnboarding();
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/ucet");
    router.refresh();
  }

  function update(patch: Partial<OnboardingState>) {
    setState((prev) => {
      const next = { ...prev, ...patch };
      // If goal changes away from investment, drop investment-only step
      if (patch.goal && !needsInvestmentSteps(patch.goal) && needsInvestmentSteps(prev.goal)) {
        next.strategies = [];
        next.targetGrossYieldPct = null;
        next.targetCashFlowMonthlyCzk = null;
      }
      queueAutosave(next, currentStep);
      return next;
    });
  }

  function toggleType(type: PropertyType) {
    update({
      propertyTypes: state.propertyTypes.includes(type)
        ? state.propertyTypes.filter((t) => t !== type)
        : [...state.propertyTypes, type],
    });
  }

  function toggleRegion(region: string) {
    update({
      regions: state.regions.includes(region)
        ? state.regions.filter((r) => r !== region)
        : [...state.regions, region].slice(0, 5),
    });
  }

  function toggleStrategy(id: string) {
    update({
      strategies: state.strategies.includes(id)
        ? state.strategies.filter((s) => s !== id)
        : [...state.strategies, id],
    });
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <ProgressBar currentIndex={stepIndex} total={steps.length} />

      <div className="flex items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
        <span>{saving ? "Ukládám…" : savedHint ? "Uloženo" : "Automatické ukládání"}</span>
        {currentStep !== "complete" ? (
          <button
            type="button"
            className="underline-offset-2 hover:underline"
            onClick={() => void onSkip()}
          >
            Přerušit a dokončit později
          </button>
        ) : (
          <span />
        )}
      </div>

      {error ? (
        <InlineAlert tone="error" title="Nelze pokračovat">
          {error}
        </InlineAlert>
      ) : null}

      <div>
        <h1 className="text-h2 text-[var(--text-primary)]">{stepTitle(currentStep)}</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          {stepDescription(currentStep)}
        </p>
      </div>

      <div className="space-y-3">
        {currentStep === "goal"
          ? ONBOARDING_GOALS.map((goal) => (
              <ChoiceButton
                key={goal.id}
                selected={state.goal === goal.id}
                title={goal.label}
                description={goal.description}
                onClick={() => update({ goal: goal.id })}
              />
            ))
          : null}

        {currentStep === "propertyType"
          ? PROPERTY_TYPE_OPTIONS.map((opt) => (
              <ChoiceButton
                key={opt.id}
                selected={state.propertyTypes.includes(opt.id)}
                title={opt.label}
                onClick={() => toggleType(opt.id)}
              />
            ))
          : null}

        {currentStep === "location" ? (
          <div className="space-y-4">
            <Field id="onboarding-city" label="Město" optional>
              <TextInput
                value={state.preferredCity}
                onChange={(e) => update({ preferredCity: e.target.value })}
                placeholder="např. Brno"
                autoComplete="address-level2"
              />
            </Field>
            <div>
              <p className="mb-2 text-sm font-medium text-[var(--text-primary)]">Kraj</p>
              <div className="grid max-h-64 gap-2 overflow-y-auto pr-1">
                {CZECH_REGIONS.map((region) => (
                  <ChoiceButton
                    key={region}
                    selected={state.regions.includes(region)}
                    title={region}
                    onClick={() => toggleRegion(region)}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {currentStep === "budget" ? (
          <Field id="onboarding-budget" label="Maximální kupní cena" optional>
            <CurrencyInput
              value={state.maxPriceCzk}
              onValueChange={(value) => update({ maxPriceCzk: value })}
              placeholder="např. 6 500 000"
            />
          </Field>
        ) : null}

        {currentStep === "equity" ? (
          <div className="space-y-4">
            <Field id="onboarding-equity" label="Vlastní zdroje" optional>
              <CurrencyInput
                value={state.availableEquityCzk}
                onValueChange={(value) => update({ availableEquityCzk: value })}
                placeholder="např. 1 300 000"
              />
            </Field>
            <Field
              id="onboarding-equity-pct"
              label="Nebo podíl z kupní ceny"
              optional
              helperText="0–100 %"
            >
              <NumberInput
                value={state.equityPercent}
                onValueChange={(value) => update({ equityPercent: value })}
                suffix="%"
                placeholder="např. 20"
              />
            </Field>
          </div>
        ) : null}

        {currentStep === "financing"
          ? FINANCING_OPTIONS.map((opt) => (
              <ChoiceButton
                key={opt.id}
                selected={state.financingMode === opt.id}
                title={opt.label}
                description={opt.description}
                onClick={() => update({ financingMode: opt.id })}
              />
            ))
          : null}

        {currentStep === "strategy"
          ? INVESTMENT_STRATEGY_OPTIONS.map((opt) => (
              <ChoiceButton
                key={opt.id}
                selected={state.strategies.includes(opt.id)}
                title={opt.label}
                onClick={() => toggleStrategy(opt.id)}
              />
            ))
          : null}

        {currentStep === "investmentPrefs" ? (
          <div className="space-y-4">
            <Field
              id="onboarding-yield"
              label="Požadovaný hrubý výnos"
              optional
              helperText="V procentních bodech, např. 5,4"
            >
              <NumberInput
                value={state.targetGrossYieldPct}
                onValueChange={(value) => update({ targetGrossYieldPct: value })}
                suffix="%"
                placeholder="např. 5,4"
              />
            </Field>
            <Field id="onboarding-cf" label="Cílové cash flow měsíčně" optional>
              <CurrencyInput
                value={state.targetCashFlowMonthlyCzk}
                onValueChange={(value) => update({ targetCashFlowMonthlyCzk: value })}
                placeholder="např. 5 000"
              />
            </Field>
          </div>
        ) : null}

        {currentStep === "complete" ? (
          <div className="space-y-4 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--background-secondary)] p-4">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--text-muted)]">Cíl</dt>
                <dd className="font-medium">{goalLabel(state.goal)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--text-muted)]">Typ</dt>
                <dd className="text-right font-medium">
                  {state.propertyTypes.length
                    ? state.propertyTypes
                        .map(
                          (t) =>
                            PROPERTY_TYPE_OPTIONS.find((o) => o.id === t)?.label ?? t,
                        )
                        .join(", ")
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--text-muted)]">Lokalita</dt>
                <dd className="text-right font-medium">
                  {[state.preferredCity, ...state.regions].filter(Boolean).join(" · ") ||
                    "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--text-muted)]">Rozpočet</dt>
                <dd className="font-metric font-medium">
                  {state.maxPriceCzk != null ? formatCzk(state.maxPriceCzk) : "—"}
                </dd>
              </div>
              {needsInvestmentSteps(state.goal) ? (
                <>
                  <div className="flex justify-between gap-3">
                    <dt className="text-[var(--text-muted)]">Strategie</dt>
                    <dd className="text-right font-medium">
                      {state.strategies.length
                        ? state.strategies
                            .map(
                              (id) =>
                                INVESTMENT_STRATEGY_OPTIONS.find((o) => o.id === id)?.label ??
                                id,
                            )
                            .join(", ")
                        : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-[var(--text-muted)]">Výnos</dt>
                    <dd className="font-metric font-medium">
                      {state.targetGrossYieldPct != null
                        ? formatPercentPoints(state.targetGrossYieldPct)
                        : "—"}
                    </dd>
                  </div>
                </>
              ) : null}
            </dl>
            <div className="flex flex-col gap-3 pt-2">
              <ButtonLink href="/nemovitosti" size="lg" fullWidth>
                Zobrazit vhodné nemovitosti
              </ButtonLink>
              <ButtonLink href="/analyza" variant="secondary" size="lg" fullWidth>
                Analyzovat nemovitost
              </ButtonLink>
              <ButtonLink href="/ucet" variant="ghost" fullWidth>
                Přejít na účet
              </ButtonLink>
            </div>
          </div>
        ) : null}
      </div>

      {currentStep !== "complete" ? (
        <div className="flex flex-col gap-3 sm:flex-row-reverse">
          {currentStep === "financing" && !needsInvestmentSteps(state.goal) ? (
            <Button type="button" size="lg" fullWidth onClick={() => void finish()} loading={saving}>
              Dokončit
            </Button>
          ) : currentStep === "investmentPrefs" ? (
            <Button type="button" size="lg" fullWidth onClick={() => void finish()} loading={saving}>
              Dokončit
            </Button>
          ) : (
            <Button type="button" size="lg" fullWidth onClick={() => void goNext()} loading={saving}>
              Pokračovat
            </Button>
          )}
          <Button
            type="button"
            size="lg"
            fullWidth
            variant="secondary"
            onClick={goBack}
            disabled={stepIndex === 0 || saving}
          >
            Zpět
          </Button>
        </div>
      ) : null}

      <p className="text-center text-xs text-[var(--text-muted)]">
        <Link href="/ucet" className="underline-offset-2 hover:underline">
          Zpět na účet
        </Link>
      </p>
    </div>
  );
}

export function OnboardingWizardFallback() {
  return <OnboardingWizard initialState={emptyOnboardingState()} />;
}
