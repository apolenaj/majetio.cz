/**
 * InvestmentCalculationInput — strict Zod contract (engine boundary).
 * Amounts = integer minor units; percentages = ratio strings.
 */

import { z } from "zod";

import { CURRENCY_CODES } from "@/domains/finance";

import { totalAcquisitionCostInputSchema } from "../acquisition-cost";
import { moneyMinorDtoOrNullSchema, moneyMinorDtoSchema } from "../money";
import { percentageRatioDtoOrNullSchema } from "../percentage";

export const investmentHorizonSchema = z.object({
  /** Hold period in whole years (scenario length). */
  holdYears: z.number().int().positive().max(100),
});

export const financingInputSchema = z.object({
  loanAmount: moneyMinorDtoOrNullSchema.default(null),
  /** Nominal interest — ratio DTO (e.g. 0.0525). Not APR. */
  nominalInterestRate: percentageRatioDtoOrNullSchema.default(null),
  /** APR / RPSN — separate from nominal. */
  apr: percentageRatioDtoOrNullSchema.default(null),
  termYears: z.number().int().positive().max(50).nullable().default(null),
  monthlyDebtService: moneyMinorDtoOrNullSchema.default(null),
});

export const incomeExpenseInputSchema = z.object({
  monthlyRent: moneyMinorDtoOrNullSchema.default(null),
  annualRent: moneyMinorDtoOrNullSchema.default(null),
  monthlyOperatingCosts: moneyMinorDtoOrNullSchema.default(null),
  annualOperatingCosts: moneyMinorDtoOrNullSchema.default(null),
  vacancyRate: percentageRatioDtoOrNullSchema.default(null),
});

export const marketAssumptionsInputSchema = z.object({
  /** Property / market appreciation — distinct rate kind. */
  appreciationRate: percentageRatioDtoOrNullSchema.default(null),
  rentGrowthRate: percentageRatioDtoOrNullSchema.default(null),
});

export const propertyContextInputSchema = z.object({
  propertyId: z.string().min(1).nullable().default(null),
  usableAreaSqm: z.number().positive().finite().nullable().default(null),
  currency: z.enum(CURRENCY_CODES).default("CZK"),
});

/**
 * Full engine input. Scenario runners will consume this later —
 * this schema only validates shape and money/ratio safety.
 */
export const investmentCalculationInputSchema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    property: propertyContextInputSchema,
    acquisition: totalAcquisitionCostInputSchema,
    /**
     * Base used for yield formulas: purchase_price | total_acquisition_cost.
     * Default keeps backward-compatible “price only” mental model.
     */
    yieldBase: z
      .enum(["purchase_price", "total_acquisition_cost"])
      .default("purchase_price"),
    incomeExpense: incomeExpenseInputSchema.default({
      monthlyRent: null,
      annualRent: null,
      monthlyOperatingCosts: null,
      annualOperatingCosts: null,
      vacancyRate: null,
    }),
    financing: financingInputSchema.default({
      loanAmount: null,
      nominalInterestRate: null,
      apr: null,
      termYears: null,
      monthlyDebtService: null,
    }),
    market: marketAssumptionsInputSchema.default({
      appreciationRate: null,
      rentGrowthRate: null,
    }),
    horizon: investmentHorizonSchema.default({ holdYears: 10 }),
    /** Asking / list price if distinct from purchase (optional). */
    askingPrice: moneyMinorDtoOrNullSchema.default(null),
  })
  .superRefine((val, ctx) => {
    const currency = val.acquisition.purchasePrice.currency;
    if (val.property.currency !== currency) {
      ctx.addIssue({
        code: "custom",
        path: ["property", "currency"],
        message: `property.currency must match acquisition currency (${currency})`,
      });
    }
    if (val.askingPrice && val.askingPrice.currency !== currency) {
      ctx.addIssue({
        code: "custom",
        path: ["askingPrice", "currency"],
        message: `askingPrice.currency must match acquisition currency (${currency})`,
      });
    }
  });

export type InvestmentCalculationInput = z.infer<
  typeof investmentCalculationInputSchema
>;

export function parseInvestmentCalculationInput(
  raw: unknown,
): InvestmentCalculationInput {
  return investmentCalculationInputSchema.parse(raw);
}

export function safeParseInvestmentCalculationInput(raw: unknown) {
  return investmentCalculationInputSchema.safeParse(raw);
}

/** Re-export for callers composing partial money lines. */
export { moneyMinorDtoSchema };
