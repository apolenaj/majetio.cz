"use client";

/**
 * Client hook — ephemeral investment calculation + optional Save scenario.
 */

import * as React from "react";

import {
  calculateConfidenceScore,
  deriveCanonicalScenarios,
  type CanonicalTripletResult,
} from "@/domains/investment/engine";
import { hashCalculationInput } from "@/domains/investment/service/hash";
import { intentFromStrategy } from "@/domains/investment/service/intent";
import { runInvestmentCalculationPure } from "@/domains/investment/service/run-calculation";
import { allWarningMessages } from "@/domains/investment/service/warning-helpers";
import { withCalculationTelemetry } from "@/domains/investment/observability";

import {
  BASELINE_PROVENANCE,
  listModifiedFields,
  MAJETIO_BASELINE,
  resetInputsToBaseline,
  type OverridableField,
} from "./assumption-baseline";
import {
  buildCashFlowBreakdownView,
  buildEquityGrowthView,
  buildProjectionChartView,
  buildReturnDecompositionView,
} from "./chart-view-models";
import {
  DEFAULT_CALCULATOR_INPUTS,
  type CalculatorMode,
  type InvestmentCalculatorField,
  type InvestmentCalculatorInputs,
} from "./calculator-inputs";
import {
  buildAssumptionSetFromInputs,
  buildEphemeralSnapshot,
} from "./input-mapping";
import { buildRiskBaseCaseFromInputs } from "./risk-base-from-inputs";
import {
  buildScenarioComparisonView,
  type ScenarioComparisonView,
} from "./scenario-view-model";
import {
  provenanceToEngineKind,
  type InvestmentStrategy,
  type UiProvenanceSource,
} from "./strategy";

export type SaveScenarioResult =
  | { ok: true; scenarioId: string }
  | { ok: false; error: string; requiresAuth?: boolean };

export type UseInvestmentCalculationOptions = {
  initialInputs?: Partial<InvestmentCalculatorInputs>;
  saveFn?: (payload: {
    inputs: InvestmentCalculatorInputs;
    scenarioName?: string;
    analysisId?: string | null;
  }) => Promise<SaveScenarioResult>;
};

function computeEphemeral(inputs: InvestmentCalculatorInputs) {
  const assumptionSet = buildAssumptionSetFromInputs(inputs);
  const propertySnapshot = buildEphemeralSnapshot(inputs);
  const inputHash = hashCalculationInput({
    propertySnapshot,
    assumptionSet,
    scenarioType: "BASE_METRICS",
  });

  const result = withCalculationTelemetry(() =>
    runInvestmentCalculationPure({
      propertySnapshot,
      assumptionSet,
      scenarioType: "BASE_METRICS",
      intent: intentFromStrategy(inputs.strategy),
      inputHash,
    }),
  );

  const riskBase = buildRiskBaseCaseFromInputs(inputs);
  let canonical: CanonicalTripletResult | null = null;
  let scenarioView: ScenarioComparisonView | null = null;
  if (riskBase) {
    canonical = deriveCanonicalScenarios({ base: riskBase });
    scenarioView = buildScenarioComparisonView(canonical.year1);
  }

  const cashFlow = buildCashFlowBreakdownView(result, inputs);
  const projection = buildProjectionChartView(inputs);
  const equityGrowth = buildEquityGrowthView(inputs, projection);
  const returns = buildReturnDecompositionView(result, inputs, projection);

  return {
    result,
    canonical,
    scenarioView,
    cashFlow,
    projection,
    equityGrowth,
    returns,
  };
}

function buildConfidence(
  inputs: InvestmentCalculatorInputs,
  modified: OverridableField[],
) {
  const fields = (
    Object.keys(BASELINE_PROVENANCE) as OverridableField[]
  ).map((field) => {
    const source: UiProvenanceSource = modified.includes(field)
      ? "user"
      : BASELINE_PROVENANCE[field];
    return {
      field,
      provenance: provenanceToEngineKind(source),
      weight:
        field === "monthlyRent" || field === "purchasePrice" || field === "interestRatePp"
          ? 2
          : 1,
    };
  });
  return calculateConfidenceScore(fields);
}

export function useInvestmentCalculation(
  options: UseInvestmentCalculationOptions = {},
) {
  const [inputs, setInputs] = React.useState<InvestmentCalculatorInputs>(() => ({
    ...DEFAULT_CALCULATOR_INPUTS,
    ...options.initialInputs,
  }));
  const [fieldProvenance, setFieldProvenance] = React.useState<
    Partial<Record<OverridableField, UiProvenanceSource>>
  >({});
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState<string | null>(null);

  const deferredInputs = React.useDeferredValue(inputs);
  const isCalculating = deferredInputs !== inputs;

  const modifiedFields = React.useMemo(
    () => listModifiedFields(inputs, MAJETIO_BASELINE),
    [inputs],
  );

  const computed = React.useMemo(
    () => computeEphemeral(deferredInputs),
    [deferredInputs],
  );

  const confidence = React.useMemo(
    () => buildConfidence(inputs, modifiedFields),
    [inputs, modifiedFields],
  );

  const getProvenance = React.useCallback(
    (field: OverridableField): UiProvenanceSource => {
      if (modifiedFields.includes(field)) return "user";
      return fieldProvenance[field] ?? BASELINE_PROVENANCE[field];
    },
    [fieldProvenance, modifiedFields],
  );

  const setMode = React.useCallback((mode: CalculatorMode) => {
    React.startTransition(() => {
      setInputs((prev) => ({ ...prev, mode }));
    });
  }, []);

  const setStrategy = React.useCallback((strategy: InvestmentStrategy) => {
    React.startTransition(() => {
      setInputs((prev) => ({ ...prev, strategy }));
    });
  }, []);

  const setField = React.useCallback(
    <K extends InvestmentCalculatorField>(
      field: K,
      value: InvestmentCalculatorInputs[K],
    ) => {
      React.startTransition(() => {
        setInputs((prev) => ({ ...prev, [field]: value }));
        if (field !== "mode" && field !== "strategy") {
          setFieldProvenance((prev) => ({
            ...prev,
            [field as OverridableField]: "user",
          }));
        }
      });
    },
    [],
  );

  const patchInputs = React.useCallback(
    (patch: Partial<InvestmentCalculatorInputs>) => {
      React.startTransition(() => {
        setInputs((prev) => ({ ...prev, ...patch }));
      });
    },
    [],
  );

  const resetToDefaults = React.useCallback(() => {
    React.startTransition(() => {
      setInputs((prev) => resetInputsToBaseline(prev, MAJETIO_BASELINE));
      setFieldProvenance({});
    });
  }, []);

  const saveScenario = React.useCallback(
    async (opts?: { name?: string; analysisId?: string | null }) => {
      setIsSaving(true);
      setSaveMessage(null);
      try {
        const saveFn =
          options.saveFn ??
          (await import("../server/save-scenario")).saveInvestmentScenario;
        const outcome = await saveFn({
          inputs,
          scenarioName: opts?.name,
          analysisId: opts?.analysisId,
        });
        if (outcome.ok) {
          setSaveMessage("Scénář byl uložen.");
        } else {
          setSaveMessage(outcome.error);
        }
        return outcome;
      } catch {
        const fail: SaveScenarioResult = {
          ok: false,
          error: "Uložení se nezdařilo. Zkuste to znovu.",
        };
        setSaveMessage(fail.error);
        return fail;
      } finally {
        setIsSaving(false);
      }
    },
    [inputs, options.saveFn],
  );

  const warningMessages = React.useMemo(
    () =>
      allWarningMessages({
        resultWarnings: computed.result.resultWarnings ?? [],
        legacyWarnings: computed.result.warnings,
      }),
    [computed.result],
  );

  return {
    inputs,
    setField,
    setMode,
    setStrategy,
    patchInputs,
    resetToDefaults,
    modifiedFields,
    getProvenance,
    baseline: MAJETIO_BASELINE,
    confidence,
    result: computed.result,
    canonical: computed.canonical,
    scenarioView: computed.scenarioView,
    cashFlow: computed.cashFlow,
    projection: computed.projection,
    equityGrowth: computed.equityGrowth,
    returns: computed.returns,
    warnings: warningMessages,
    resultWarnings: computed.result.resultWarnings ?? [],
    isCalculating,
    isSaving,
    saveMessage,
    saveScenario,
  };
}
