"use client";

import * as React from "react";

import { buildLoginUrl } from "@/lib/auth/callback-url";
import { formatPercentPoints } from "@/lib/format";
import { track } from "@/lib/analytics/events";
import {
  useInvestmentCalculation,
  type InvestmentCalculatorInputs,
} from "@/domains/investment/hooks";
import { MAJETIO_BASELINE } from "@/domains/investment/hooks/assumption-baseline";
import { buildRiskBaseCaseFromInputs } from "@/domains/investment/hooks/risk-base-from-inputs";
import { buildStrategyMetricDisplays } from "@/domains/investment/hooks/strategy-metrics";
import {
  INVESTMENT_STRATEGIES,
  STRATEGY_LABELS,
  type InvestmentStrategy,
} from "@/domains/investment/hooks/strategy";
import type { OverridableField } from "@/domains/investment/hooks/assumption-baseline";
import type { ScenarioVariantId } from "@/domains/investment/scenarios/sanitize-name";
import { InlineAlert } from "@/components/feedback/states";
import { Field } from "@/components/forms/field";
import {
  CurrencyInput,
  NumberInput,
  PercentageInput,
} from "@/components/forms/inputs";
import { RangeSlider } from "@/components/forms/range-slider";
import { CalculatorShell } from "@/components/layout/page-layouts";
import { ConfidenceIndicator } from "@/components/overlays/tooltip";
import { MobileDisclosure } from "@/components/property/mobile-disclosure";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardTitle } from "@/components/ui/card";
import { Grid } from "@/components/ui/layout-primitives";

import { AcquisitionCostBreakdown } from "./acquisition-cost-breakdown";
import { AssumptionPanel } from "./assumption-panel";
import { ExplainedMetricCard } from "./metric-formula-explain";
import { MethodologyAttribution } from "@/components/methodology/methodology-attribution";
import {
  AnnualProjectionChart,
  CashFlowBreakdownChart,
  CashFlowCallout,
  EquityGrowthBreakdown,
  ReturnDecomposition,
} from "./investment-charts";
import { ScenarioComparison } from "./scenario-comparison";
import { ScenarioSelector } from "./scenario-selector";
import { SensitivityHeatmap } from "./sensitivity-heatmap";

export function InvestmentYieldCalculator({
  initialInputs,
  isAuthenticated = false,
}: {
  initialInputs?: Partial<InvestmentCalculatorInputs>;
  isAuthenticated?: boolean;
}) {
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [variant, setVariant] = React.useState<ScenarioVariantId>("realistic");
  const [realisticBase, setRealisticBase] =
    React.useState<InvestmentCalculatorInputs | null>(null);
  const calc = useInvestmentCalculation({ initialInputs });
  const {
    inputs,
    setField,
    setMode,
    setStrategy,
    resetToDefaults,
    modifiedFields,
    getProvenance,
    baseline,
    confidence,
    result,
    scenarioView,
    cashFlow,
    projection,
    equityGrowth,
    returns,
    warnings,
    isCalculating,
    isSaving,
    saveMessage,
    saveScenario,
  } = calc;

  React.useEffect(() => {
    track({
      name: "investment_analysis_viewed",
      props: {
        entry: "calculator",
        strategy: inputs.strategy,
        mode: inputs.mode === "advanced" ? "advanced" : "simple",
      },
    });
    track({
      name: "analysis_started",
      props: { entry: "calculator" },
    });
    void import("@/lib/analytics/decision-metrics").then(({ observeFunnelStep }) => {
      observeFunnelStep("analysis");
    });
    // Fire once on mount for entry funnel — strategy/mode tracked on change elsewhere
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount-only
  }, []);

  React.useEffect(() => {
    if (variant === "realistic" || realisticBase == null) {
      setRealisticBase(inputs);
    }
  }, [inputs, variant, realisticBase]);

  const interest =
    inputs.interestRatePp ?? MAJETIO_BASELINE.interestRatePp ?? 0;
  const vacancy = inputs.vacancyPp ?? MAJETIO_BASELINE.vacancyPp ?? 0;
  const strategyMetrics = buildStrategyMetricDisplays({
    strategy: inputs.strategy,
    result,
    inputs,
    projection,
  });
  const riskBase = buildRiskBaseCaseFromInputs(inputs);

  return (
    <>
      <CalculatorShell
        inputs={
          <>
            <Card elevation="flat">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-base">Vstupy</CardTitle>
                <ButtonGroup aria-label="Režim kalkulačky">
                  <Button
                    type="button"
                    size="sm"
                    variant={inputs.mode === "basic" ? "primary" : "outline"}
                    onClick={() => setMode("basic")}
                  >
                    Základní
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={inputs.mode === "advanced" ? "primary" : "outline"}
                    onClick={() => setMode("advanced")}
                  >
                    Pokročilý
                  </Button>
                </ButtonGroup>
              </div>

              <Field id="strategy" label="Strategie">
                <select
                  id="strategy"
                  className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-sm"
                  value={inputs.strategy}
                  onChange={(e) =>
                    setStrategy(e.target.value as InvestmentStrategy)
                  }
                >
                  {INVESTMENT_STRATEGIES.map((s) => (
                    <option key={s} value={s}>
                      {STRATEGY_LABELS[s]}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="mt-4 space-y-4">
                <Field id="purchasePrice" label="Kupní cena" required>
                  <CurrencyInput
                    id="purchasePrice"
                    value={inputs.purchasePrice}
                    onValueChange={(v) => setField("purchasePrice", v)}
                  />
                </Field>

                <Field
                  id="equity"
                  label="Vlastní kapitál"
                  helperText="Úvěr = kupní cena − vlastní kapitál"
                >
                  <CurrencyInput
                    id="equity"
                    value={inputs.equity}
                    onValueChange={(v) => setField("equity", v)}
                  />
                </Field>

                <Field id="interestRatePp" label="Nominální úrok">
                  <RangeSlider
                    id="interestRatePp"
                    min={0}
                    max={15}
                    step={0.05}
                    value={interest}
                    displayValue={formatPercentPoints(interest)}
                    aria-label="Nominální úroková sazba"
                    onValueChange={(v) => setField("interestRatePp", v)}
                  />
                  <div className="mt-2">
                    <PercentageInput
                      id="interestRatePp-input"
                      value={inputs.interestRatePp}
                      onValueChange={(v) => setField("interestRatePp", v)}
                    />
                  </div>
                </Field>

                <Field id="termYears" label="Splatnost úvěru">
                  <NumberInput
                    id="termYears"
                    suffix="let"
                    value={inputs.termYears}
                    onValueChange={(v) =>
                      setField("termYears", v == null ? null : Math.round(v))
                    }
                  />
                </Field>

                <Field id="monthlyRent" label="Měsíční nájem" required>
                  <CurrencyInput
                    id="monthlyRent"
                    value={inputs.monthlyRent}
                    onValueChange={(v) => setField("monthlyRent", v)}
                  />
                  {modifiedFields.includes("monthlyRent") ? (
                    <p className="mt-1 text-[var(--text-caption)] text-[var(--status-warning)]">
                      Upraveno · Odhad Majetio:{" "}
                      {baseline.monthlyRent?.toLocaleString("cs-CZ")} Kč vs.
                      Váš scénář: {inputs.monthlyRent?.toLocaleString("cs-CZ")}{" "}
                      Kč
                    </p>
                  ) : (
                    <p className="mt-1 text-[var(--text-caption)] text-[var(--text-muted)]">
                      Zdroj: Odhad Majetio
                    </p>
                  )}
                </Field>

                <Field id="vacancyPp" label="Neobsazenost">
                  <RangeSlider
                    id="vacancyPp"
                    min={0}
                    max={30}
                    step={0.5}
                    value={vacancy}
                    displayValue={formatPercentPoints(vacancy)}
                    aria-label="Míra neobsazenosti"
                    onValueChange={(v) => setField("vacancyPp", v)}
                  />
                </Field>

                <Field id="annualOpex" label="Roční provozní náklady">
                  <CurrencyInput
                    id="annualOpex"
                    value={inputs.annualOpex}
                    onValueChange={(v) => setField("annualOpex", v)}
                  />
                </Field>

                {inputs.mode === "advanced" ? (
                  <p className="text-sm text-[var(--text-secondary)]">
                    Detailní nákladové a růstové položky otevřete v panelu
                    předpokladů — na mobilu se tak nezobrazí desítky polí
                    najednou.
                  </p>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setPanelOpen(true)}
                >
                  Upravit předpoklady
                  {modifiedFields.length > 0
                    ? ` (${modifiedFields.length})`
                    : ""}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={modifiedFields.length === 0}
                  onClick={resetToDefaults}
                >
                  Obnovit výchozí hodnoty
                </Button>
              </div>

              <div className="mt-4">
                <ConfidenceIndicator level={confidence.level} />
                <p className="text-[var(--text-caption)] text-[var(--text-muted)]">
                  Skóre spolehlivosti: {confidence.value}/100
                </p>
              </div>
            </Card>
          </>
        }
        results={
          <>
            <section
              aria-label="Výsledky kalkulace"
              aria-live="polite"
              aria-busy={isCalculating}
            >
            <ScenarioSelector
              variant={variant}
              onVariantChange={setVariant}
              realisticBase={realisticBase ?? inputs}
              inputs={inputs}
              onApplyInputs={(next) => {
                calc.patchInputs(next);
              }}
              isAuthenticated={isAuthenticated}
              showPublicNeutralNotice
              onDuplicate={
                isAuthenticated
                  ? (name) => {
                      void saveScenario({ name });
                    }
                  : undefined
              }
            />

            {isCalculating ? (
              <p className="text-sm text-[var(--text-muted)]" aria-live="polite">
                Přepočítávám…
              </p>
            ) : null}

            {warnings.length > 0 ? (
              <InlineAlert tone="warning" title="Částečné vstupy">
                <ul className="mt-1 list-inside list-disc">
                  {warnings.slice(0, 4).map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </InlineAlert>
            ) : null}

            <CashFlowCallout view={cashFlow} />

            <Grid cols={2} className="gap-3">
              {strategyMetrics.map((display) => {
                const synthetic = [
                  "irr",
                  "monthly_housing_cost",
                  "flip_gross_profit",
                  "flip_cost_margin",
                ].includes(display.formulaKey);
                if (synthetic) {
                  return (
                    <Card key={display.formulaKey} elevation="flat">
                      <p className="text-[var(--text-caption)] uppercase tracking-wide text-[var(--text-muted)]">
                        {display.label}
                      </p>
                      <p
                        className={`mt-2 font-metric text-[var(--text-metric-l)] font-semibold ${
                          display.tone === "positive"
                            ? "text-[var(--investment-positive)]"
                            : display.tone === "negative"
                              ? "text-[var(--investment-negative)]"
                              : "text-[var(--text-primary)]"
                        }`}
                      >
                        {display.displayValue}
                      </p>
                      {display.statusReason ? (
                        <p className="mt-1 text-[var(--text-caption)] text-[var(--text-muted)]">
                          {display.statusReason}
                        </p>
                      ) : null}
                    </Card>
                  );
                }
                return (
                  <ExplainedMetricCard
                    key={display.formulaKey}
                    display={display}
                    result={result}
                  />
                );
              })}
            </Grid>

            <MobileDisclosure title="Grafy a rozklady">
              <div className="space-y-4">
                {cashFlow.barSeries.length > 0 ? (
                  <CashFlowBreakdownChart view={cashFlow} />
                ) : null}
                {inputs.strategy === "long_term_rental" && projection ? (
                  <AnnualProjectionChart view={projection} />
                ) : null}
                {equityGrowth ? (
                  <EquityGrowthBreakdown view={equityGrowth} />
                ) : null}
                {returns ? <ReturnDecomposition view={returns} /> : null}
              </div>
            </MobileDisclosure>

            <MobileDisclosure title="Scénáře a citlivost">
              <div className="space-y-4">
                {scenarioView ? (
                  <ScenarioComparison view={scenarioView} />
                ) : null}
                <SensitivityHeatmap base={riskBase} />
                <AcquisitionCostBreakdown result={result} />
              </div>
            </MobileDisclosure>

            <Card elevation="flat" className="space-y-3">
              <CardTitle className="text-base">Uložení scénáře</CardTitle>
              <p className="text-sm text-[var(--text-secondary)]">
                Přepočty ve formuláři jsou dočasné. Uložení zapíše snapshot včetně
                verze enginu a balíčku metodiky.
              </p>
              <MethodologyAttribution
                compact
                calculationEngineVersion={result?.engineVersion}
                formulaRegistryVersion={result?.formulaRegistryVersion}
              />
              {isAuthenticated ? (
                <Button
                  type="button"
                  loading={isSaving}
                  onClick={() => {
                    track({
                      name: "investment_scenario_saved",
                      props: { authenticated: true },
                    });
                    void saveScenario({
                      name: "Investiční výnos — kalkulačka",
                    });
                  }}
                >
                  Uložit scénář
                </Button>
              ) : (
                <div className="space-y-2">
                  <InlineAlert tone="info" title="Vyžaduje přihlášení">
                    Pro uložení scénáře se přihlaste. Ephemeral výpočet funguje i
                    bez účtu.
                  </InlineAlert>
                  <ButtonLink
                    href={buildLoginUrl("/kalkulacky/investicni-vynos")}
                    variant="secondary"
                  >
                    Přihlásit se
                  </ButtonLink>
                </div>
              )}
              {saveMessage ? (
                <p className="text-sm text-[var(--text-secondary)]" role="status">
                  {saveMessage}
                </p>
              ) : null}
            </Card>
            </section>
          </>
        }
      />

      <AssumptionPanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        inputs={inputs}
        baseline={baseline}
        modifiedCount={modifiedFields.length}
        getProvenance={getProvenance}
        onFieldChange={(field: OverridableField, value) =>
          setField(field, value)
        }
        onReset={resetToDefaults}
      />
    </>
  );
}
