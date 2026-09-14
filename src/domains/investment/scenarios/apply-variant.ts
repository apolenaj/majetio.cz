/**
 * Apply canonical variant spreads onto calculator inputs (from central config).
 */

import {
  resolveAssumptionDefaults,
  type CanonicalSpreadsConfig,
} from "@/config/investment-assumptions";
import type { InvestmentCalculatorInputs } from "../hooks/calculator-inputs";
import type { ScenarioVariantId } from "./sanitize-name";

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/**
 * Derive inputs for a selector variant from a realistic base.
 * Conservative / optimistic use config spreads — never hardcoded deltas.
 */
export function applyScenarioVariant(input: {
  base: InvestmentCalculatorInputs;
  variant: ScenarioVariantId;
  /** Custom keeps `base` as-is (already user-edited). */
  customOverride?: InvestmentCalculatorInputs;
  spreads?: CanonicalSpreadsConfig;
  propertyType?: string | null;
  locationSlug?: string | null;
}): InvestmentCalculatorInputs {
  if (input.variant === "custom") {
    return { ...(input.customOverride ?? input.base) };
  }

  const resolved = resolveAssumptionDefaults({
    propertyType: input.propertyType,
    strategy: input.base.strategy,
    locationSlug: input.locationSlug,
  });
  const spreads = input.spreads ?? resolved.spreads;
  const base = input.base;

  if (input.variant === "realistic") {
    return { ...base };
  }

  const side = input.variant === "conservative" ? "conservative" : "optimistic";
  const rent = base.monthlyRent;
  const opex = base.annualOpex;
  const rate = base.interestRatePp;
  const appreciation = base.appreciationPp;
  const rentGrowth = base.rentGrowthPp;

  return {
    ...base,
    monthlyRent:
      rent != null
        ? Math.round(rent * spreads.egiFactor[side])
        : rent,
    annualOpex:
      opex != null
        ? Math.round(opex * spreads.opexFactor[side])
        : opex,
    interestRatePp:
      rate != null
        ? clamp(rate + spreads.interestRatePp[side], 0, 20)
        : rate,
    appreciationPp:
      appreciation != null
        ? appreciation + spreads.appreciationPp[side]
        : appreciation,
    rentGrowthPp:
      rentGrowth != null
        ? rentGrowth + spreads.rentGrowthPp[side]
        : rentGrowth,
  };
}

/**
 * Build calculator defaults from central config + purchase/rent hints.
 */
export function buildInputsFromAssumptionConfig(input: {
  purchasePrice: number | null;
  monthlyRentHint?: number | null;
  propertyType?: string | null;
  strategy?: InvestmentCalculatorInputs["strategy"];
  locationSlug?: string | null;
  versionKey?: string;
}): Pick<
  InvestmentCalculatorInputs,
  | "vacancyPp"
  | "interestRatePp"
  | "termYears"
  | "annualOpex"
  | "repairFundAnnual"
  | "acquisitionCosts"
  | "fees"
  | "appreciationPp"
  | "rentGrowthPp"
  | "expenseInflationPp"
  | "sellingCostPp"
  | "holdYears"
  | "equity"
  | "monthlyRent"
> {
  const { defaults } = resolveAssumptionDefaults({
    propertyType: input.propertyType,
    strategy: input.strategy,
    locationSlug: input.locationSlug,
    versionKey: input.versionKey,
  });

  const price = input.purchasePrice;
  const rent = input.monthlyRentHint ?? null;
  const annualRent = rent != null ? rent * 12 : null;

  return {
    vacancyPp: defaults.vacancyRatePp,
    interestRatePp: defaults.interestRatePp,
    termYears: defaults.termYears,
    monthlyRent: rent,
    annualOpex:
      annualRent != null
        ? Math.round(annualRent * defaults.annualOpexShareOfRent)
        : null,
    repairFundAnnual:
      annualRent != null
        ? Math.round(annualRent * defaults.repairFundAnnualShareOfRent)
        : null,
    acquisitionCosts:
      price != null
        ? Math.round(price * defaults.acquisitionCostsShareOfPrice)
        : null,
    fees:
      price != null ? Math.round(price * defaults.feesShareOfPrice) : null,
    appreciationPp: defaults.appreciationPp,
    rentGrowthPp: defaults.rentGrowthPp,
    expenseInflationPp: defaults.expenseInflationPp,
    sellingCostPp: defaults.sellingCostPp,
    holdYears: defaults.holdYears,
    equity:
      price != null
        ? Math.round(price * defaults.defaultEquityShare)
        : null,
  };
}
