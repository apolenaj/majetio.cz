/**
 * Orchestration result contracts — partial metrics, never fake zeros.
 */

import { z } from "zod";

import {
  calculationMetricSchema,
  totalAcquisitionCostResultSchema,
  type CalculationMetric,
  type InvestmentCalculationInput,
} from "../engine";
import {
  CALCULATION_ERROR_CATEGORIES,
  RESULT_WARNING_CODES,
  type CalculationIssue,
  type ResultWarning,
} from "../engine/validation";
import type { AssumptionSet } from "./assumptions";
import type { PropertyInvestmentSnapshot } from "./property-snapshot";

export type { CalculationMetric };

export const ANALYSIS_SCENARIO_TYPES = [
  "LONG_TERM_RENTAL",
  "CASH_PURCHASE",
  "SHORT_TERM_RENTAL",
  "FLIP",
  "RENOVATION_RENT",
  "BASE_METRICS",
] as const;

export type AnalysisScenarioTypeCode = (typeof ANALYSIS_SCENARIO_TYPES)[number];

export const ANALYSIS_SCENARIO_STATUSES = [
  "DRAFT",
  "CALCULATED",
  "PARTIAL",
  "STALE",
  "FAILED",
  "ARCHIVED",
] as const;

export type AnalysisScenarioStatusCode =
  (typeof ANALYSIS_SCENARIO_STATUSES)[number];

export const calculationIssueSchema = z.object({
  category: z.enum(CALCULATION_ERROR_CATEGORIES),
  code: z.string().min(1),
  message: z.string().min(1),
  field: z.string().optional(),
});

export const resultWarningSchema = z.object({
  code: z.enum(RESULT_WARNING_CODES),
  severity: z.enum(["info", "warning", "critical"]),
  message: z.string().min(1),
});

export type { CalculationIssue, ResultWarning };

/**
 * Persisted / API result. Versions are plain strings so historical rows
 * remain valid after formula registry bumps.
 */
export const orchestratedCalculationResultSchema = z.object({
  schemaVersion: z.literal("1.0.0"),
  engineVersion: z.string().min(1),
  formulaRegistryVersion: z.string().min(1),
  calculatedAt: z.string().datetime(),
  currency: z.string().min(3).max(3),
  scenarioType: z.enum(ANALYSIS_SCENARIO_TYPES),
  inputHash: z.string().min(1),
  status: z.enum(["CALCULATED", "PARTIAL", "FAILED"]),
  acquisition: totalAcquisitionCostResultSchema.nullable(),
  /** Metrics that were successfully computed. */
  availableMetrics: z.array(calculationMetricSchema),
  /** Metrics blocked by missing / inapplicable inputs (value always null). */
  unavailableMetrics: z.array(calculationMetricSchema),
  /** Structured warnings — calculation succeeded but interpret with care. */
  resultWarnings: z.array(resultWarningSchema).default([]),
  /** Domain validation failures when status is FAILED (Part 2/C). */
  issues: z.array(calculationIssueSchema).default([]),
  /** Legacy free-text trace (merge gaps, blocking reasons). */
  warnings: z.array(z.string()),
  inputSchemaVersion: z.literal("1.0.0"),
  cacheHit: z.boolean().default(false),
});

export type OrchestratedCalculationResult = z.infer<
  typeof orchestratedCalculationResultSchema
>;

export type RunCalculationRequest = {
  propertySnapshot: PropertyInvestmentSnapshot;
  assumptionSet?: AssumptionSet;
  scenarioType?: AnalysisScenarioTypeCode;
  analysisId?: string | null;
  scenarioName?: string | null;
  /** Skip DB cache lookup / write (pure compute). */
  skipCache?: boolean;
  asOf?: Date;
};

export type PersistedScenarioRecord = {
  id: string;
  propertyId: string | null;
  analysisId: string | null;
  scenarioType: AnalysisScenarioTypeCode;
  status: AnalysisScenarioStatusCode;
  inputHash: string;
  calculationEngineVersion: string;
  formulaRegistryVersion: string;
  methodologyPackageVersion: string | null;
  results: OrchestratedCalculationResult;
  cacheHit: boolean;
};

export type MergedEngineInput = {
  input: InvestmentCalculationInput | null;
  warnings: string[];
  /** Why a full engine input could not be built (purchase price missing, etc.). */
  blockingReasons: string[];
  resultWarnings: ResultWarning[];
  issues: CalculationIssue[];
};

export function splitMetrics(metrics: CalculationMetric[]): {
  availableMetrics: CalculationMetric[];
  unavailableMetrics: CalculationMetric[];
} {
  const availableMetrics: CalculationMetric[] = [];
  const unavailableMetrics: CalculationMetric[] = [];
  for (const m of metrics) {
    if (m.status === "calculated" && m.value != null) {
      availableMetrics.push(m);
    } else {
      unavailableMetrics.push(m);
    }
  }
  return { availableMetrics, unavailableMetrics };
}
