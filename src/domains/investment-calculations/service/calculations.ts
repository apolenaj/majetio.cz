import { z } from "zod";

export const grossYieldInputSchema = z.object({
  propertyPriceCzk: z.number().positive(),
  annualRentCzk: z.number().nonnegative(),
});

export type GrossYieldInput = z.infer<typeof grossYieldInputSchema>;

/**
 * Gross rental yield = annual rent / purchase price.
 * Pure domain function — keep out of React components.
 */
export function calculateGrossYield(input: GrossYieldInput): number {
  const { propertyPriceCzk, annualRentCzk } = grossYieldInputSchema.parse(input);
  if (propertyPriceCzk === 0) {
    return 0;
  }
  return annualRentCzk / propertyPriceCzk;
}

export const monthlyCashFlowInputSchema = z.object({
  monthlyRentCzk: z.number().nonnegative(),
  monthlyCostsCzk: z.number().nonnegative(),
  monthlyMortgageCzk: z.number().nonnegative().default(0),
});

export type MonthlyCashFlowInput = z.infer<typeof monthlyCashFlowInputSchema>;

export function calculateMonthlyCashFlow(input: MonthlyCashFlowInput): number {
  const data = monthlyCashFlowInputSchema.parse(input);
  return data.monthlyRentCzk - data.monthlyCostsCzk - data.monthlyMortgageCzk;
}

export const ENGINE_VERSION = "0.1.0";
