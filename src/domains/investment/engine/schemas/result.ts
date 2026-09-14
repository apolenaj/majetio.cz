/**
 * InvestmentCalculationResult — strict Zod contract for engine outputs.
 * Metric values reference formula registry keys for UI explainability.
 */

import { z } from "zod";

import { FORMULA_REGISTRY_VERSION, listFormulaKeys } from "../formulas/registry";
import { moneyMinorDtoOrNullSchema, moneyMinorDtoSchema } from "../money";
import { percentageRatioDtoOrNullSchema } from "../percentage";

const formulaKeySchema = z.enum(
  listFormulaKeys() as [string, ...string[]],
);

export const metricStatusSchema = z.enum([
  "calculated",
  "insufficient_input",
  "not_applicable",
  "error",
]);

export const moneyMetricSchema = z.object({
  kind: z.literal("money"),
  formulaKey: formulaKeySchema,
  status: metricStatusSchema,
  value: moneyMinorDtoOrNullSchema,
  /** Human reason when value is null. */
  statusReason: z.string().nullable().default(null),
});

export const ratioMetricSchema = z.object({
  kind: z.literal("ratio"),
  formulaKey: formulaKeySchema,
  status: metricStatusSchema,
  /** Ratio DTO (0.054) — UI formats as %. */
  value: percentageRatioDtoOrNullSchema,
  statusReason: z.string().nullable().default(null),
});

export const calculationMetricSchema = z.discriminatedUnion("kind", [
  moneyMetricSchema,
  ratioMetricSchema,
]);

export type CalculationMetric = z.infer<typeof calculationMetricSchema>;

export const totalAcquisitionCostResultSchema = z.object({
  formulaKey: z.literal("total_acquisition_cost"),
  status: metricStatusSchema,
  purchasePrice: moneyMinorDtoSchema,
  acquisitionCosts: moneyMinorDtoOrNullSchema,
  renovation: moneyMinorDtoOrNullSchema,
  initialFurnishing: moneyMinorDtoOrNullSchema,
  fees: moneyMinorDtoOrNullSchema,
  total: moneyMinorDtoOrNullSchema,
  includedLines: z.array(z.string()),
  statusReason: z.string().nullable().default(null),
});

/**
 * Engine result envelope. Individual metric bodies may be filled by later
 * calculation steps; empty metrics use status insufficient_input.
 */
export const investmentCalculationResultSchema = z.object({
  schemaVersion: z.literal("1.0.0"),
  engineVersion: z.string().min(1),
  formulaRegistryVersion: z.literal(FORMULA_REGISTRY_VERSION),
  calculatedAt: z.string().datetime(),
  currency: z.string().min(3).max(3),
  acquisition: totalAcquisitionCostResultSchema,
  metrics: z.array(calculationMetricSchema),
  /**
   * Traceability: which input schemaVersion produced this result.
   */
  inputSchemaVersion: z.literal("1.0.0"),
  warnings: z.array(z.string()).default([]),
});

export type InvestmentCalculationResult = z.infer<
  typeof investmentCalculationResultSchema
>;

export function parseInvestmentCalculationResult(
  raw: unknown,
): InvestmentCalculationResult {
  return investmentCalculationResultSchema.parse(raw);
}

export function safeParseInvestmentCalculationResult(raw: unknown) {
  return investmentCalculationResultSchema.safeParse(raw);
}

/** Placeholder metric when a formula cannot run yet / missing inputs. */
export function insufficientMoneyMetric(
  formulaKey: z.infer<typeof formulaKeySchema>,
  reason: string,
): z.infer<typeof moneyMetricSchema> {
  return {
    kind: "money",
    formulaKey,
    status: "insufficient_input",
    value: null,
    statusReason: reason,
  };
}

export function insufficientRatioMetric(
  formulaKey: z.infer<typeof formulaKeySchema>,
  reason: string,
): z.infer<typeof ratioMetricSchema> {
  return {
    kind: "ratio",
    formulaKey,
    status: "insufficient_input",
    value: null,
    statusReason: reason,
  };
}
