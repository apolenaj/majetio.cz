/**
 * Assumption overrides applied on top of a property snapshot (orchestration).
 */

import { z } from "zod";

import {
  moneyMinorDtoOrNullSchema,
  percentageRatioDtoOrNullSchema,
} from "../engine";

/**
 * User / analyst overrides. Null means “explicitly clear / missing”
 * (do not coerce to zero). Undefined means “leave snapshot value”.
 */
export const assumptionSetSchema = z
  .object({
    purchasePrice: moneyMinorDtoOrNullSchema.optional(),
    acquisitionCosts: moneyMinorDtoOrNullSchema.optional(),
    renovation: moneyMinorDtoOrNullSchema.optional(),
    initialFurnishing: moneyMinorDtoOrNullSchema.optional(),
    fees: moneyMinorDtoOrNullSchema.optional(),
    monthlyRent: moneyMinorDtoOrNullSchema.optional(),
    annualRent: moneyMinorDtoOrNullSchema.optional(),
    monthlyOperatingCosts: moneyMinorDtoOrNullSchema.optional(),
    annualOperatingCosts: moneyMinorDtoOrNullSchema.optional(),
    /** Fond oprav / repair reserve — tracked for warnings when absent. */
    repairFundAnnual: moneyMinorDtoOrNullSchema.optional(),
    vacancyRate: percentageRatioDtoOrNullSchema.optional(),
    loanAmount: moneyMinorDtoOrNullSchema.optional(),
    nominalInterestRate: percentageRatioDtoOrNullSchema.optional(),
    apr: percentageRatioDtoOrNullSchema.optional(),
    termYears: z.number().int().positive().max(50).nullable().optional(),
    appreciationRate: percentageRatioDtoOrNullSchema.optional(),
    rentGrowthRate: percentageRatioDtoOrNullSchema.optional(),
    holdYears: z.number().int().positive().max(100).optional(),
  })
  .strict();

export type AssumptionSet = z.infer<typeof assumptionSetSchema>;

export function parseAssumptionSet(raw: unknown): AssumptionSet {
  return assumptionSetSchema.parse(raw ?? {});
}

export function safeParseAssumptionSet(raw: unknown) {
  return assumptionSetSchema.safeParse(raw ?? {});
}
