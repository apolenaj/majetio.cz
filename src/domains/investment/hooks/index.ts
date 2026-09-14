export {
  DEFAULT_CALCULATOR_INPUTS,
  type CalculatorMode,
  type InvestmentCalculatorField,
  type InvestmentCalculatorInputs,
} from "./calculator-inputs";

export {
  buildAssumptionSetFromInputs,
  buildEphemeralSnapshot,
  resolveLoanAmount,
} from "./input-mapping";

export { buildRiskBaseCaseFromInputs } from "./risk-base-from-inputs";

export {
  UNAVAILABLE_LABEL,
  buildScenarioComparisonView,
  metricDisplayFromResult,
  acquisitionBreakdownFromResult,
  formatSubstitutionLines,
  year1ToScenarioColumn,
  type ScenarioColumnKey,
  type ScenarioColumnView,
  type ScenarioComparisonView,
  type MetricDisplay,
  type AcquisitionLineView,
} from "./scenario-view-model";

export {
  useInvestmentCalculation,
  type SaveScenarioResult,
  type UseInvestmentCalculationOptions,
} from "./use-investment-calculation";

export {
  MAJETIO_BASELINE,
  listModifiedFields,
  isFieldModified,
  resetInputsToBaseline,
  ASSUMPTION_CATEGORY_LABELS,
  type OverridableField,
  type AssumptionCategory,
} from "./assumption-baseline";

export {
  INVESTMENT_STRATEGIES,
  STRATEGY_LABELS,
  STRATEGY_METRIC_KEYS,
  PROVENANCE_LABELS,
  type InvestmentStrategy,
  type UiProvenanceSource,
} from "./strategy";

export { buildStrategyMetricDisplays } from "./strategy-metrics";

export {
  buildCashFlowBreakdownView,
  buildProjectionChartView,
  buildEquityGrowthView,
  buildReturnDecompositionView,
  type CashFlowBreakdownView,
  type ProjectionChartView,
} from "./chart-view-models";
