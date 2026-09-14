/**
 * Canonical Base / Conservative / Optimistic derivation from fixed spreads.
 */

import { resolveAssumptionDefaults } from "@/config/investment-assumptions";
import {
  type Money,
  Percentage,
  type NominalInterestRate,
} from "@/domains/finance";

import { bindFormula } from "../calculations/helpers";
import { calculateLongTermRentalScenario } from "../scenarios/long-term-rental";
import type { LongTermRentalScenarioInput } from "../scenarios/long-term-rental";
import type { LongTermRentalScenarioResult } from "../scenarios/types";
import {
  evaluateYear1Metrics,
  shiftNominalRateByPercentagePoints,
  type RiskBaseCase,
  type Year1OperatingMetrics,
} from "./base-case";

/** Relative / absolute spreads applied to Base → Conservative / Optimistic. */
export type CanonicalSpreads = {
  /** Interest rate delta in percentage points (e.g. +1.0). */
  interestRatePp: { conservative: number; optimistic: number };
  /** Multipliers on EGI / rent (e.g. 0.9 = −10 %). */
  egiFactor: { conservative: number; optimistic: number };
  /** Multipliers on opex. */
  opexFactor: { conservative: number; optimistic: number };
  /** Appreciation rate deltas in percentage points. */
  appreciationPp: { conservative: number; optimistic: number };
  rentGrowthPp: { conservative: number; optimistic: number };
};

export const DEFAULT_CANONICAL_SPREADS: CanonicalSpreads =
  resolveAssumptionDefaults().spreads;

export type CanonicalScenarioLabel = "base" | "conservative" | "optimistic";

export type CanonicalTripletResult = {
  formulaKey: "canonical_scenarios";
  formulaVersion: string;
  spreads: CanonicalSpreads;
  year1: Record<CanonicalScenarioLabel, Year1OperatingMetrics>;
  /** Full holding projections when LTR inputs provided. */
  longTerm?: Record<CanonicalScenarioLabel, LongTermRentalScenarioResult>;
};

function adjustGrowthRate(rate: Percentage, deltaPp: number): Percentage {
  const next = rate.toRatio().plus(Percentage.fromPercentPoints(deltaPp).toRatio());
  return Percentage.fromRatio(next.lt(-0.99) ? -0.99 : next);
}

function applySpreadsToBaseCase(
  base: RiskBaseCase,
  spreads: CanonicalSpreads,
  side: "conservative" | "optimistic",
): RiskBaseCase {
  const rate =
    base.nominalInterestRate != null
      ? shiftNominalRateByPercentagePoints(
          base.nominalInterestRate,
          spreads.interestRatePp[side],
        )
      : null;

  return {
    ...base,
    annualEgi: base.annualEgi.mul(spreads.egiFactor[side]).roundForDisplay(),
    annualOpex: base.annualOpex.mul(spreads.opexFactor[side]).roundForDisplay(),
    potentialGrossIncome:
      base.potentialGrossIncome != null
        ? base.potentialGrossIncome.mul(spreads.egiFactor[side]).roundForDisplay()
        : null,
    nominalInterestRate: rate,
  };
}

function applySpreadsToLtrInput(
  input: LongTermRentalScenarioInput,
  spreads: CanonicalSpreads,
  side: "conservative" | "optimistic",
): LongTermRentalScenarioInput {
  return {
    ...input,
    baseEgi: input.baseEgi.mul(spreads.egiFactor[side]).roundForDisplay(),
    baseOpex: input.baseOpex.mul(spreads.opexFactor[side]).roundForDisplay(),
    loan: {
      ...input.loan,
      nominalInterestRate: shiftNominalRateByPercentagePoints(
        input.loan.nominalInterestRate,
        spreads.interestRatePp[side],
      ),
    },
    growth: {
      ...input.growth,
      appreciationRate: adjustGrowthRate(
        input.growth.appreciationRate,
        spreads.appreciationPp[side],
      ),
      rentGrowthRate: adjustGrowthRate(
        input.growth.rentGrowthRate,
        spreads.rentGrowthPp[side],
      ),
    },
  };
}

/**
 * Build Base + Conservative + Optimistic year-1 metrics (and optional full LTR runs).
 */
export function deriveCanonicalScenarios(input: {
  base: RiskBaseCase;
  spreads?: CanonicalSpreads;
  longTermRental?: LongTermRentalScenarioInput;
}): CanonicalTripletResult {
  const spreads = input.spreads ?? DEFAULT_CANONICAL_SPREADS;
  const conservative = applySpreadsToBaseCase(input.base, spreads, "conservative");
  const optimistic = applySpreadsToBaseCase(input.base, spreads, "optimistic");

  const bound = bindFormula("canonical_scenarios", null);

  const result: CanonicalTripletResult = {
    formulaKey: "canonical_scenarios",
    formulaVersion: bound.formulaVersion,
    spreads,
    year1: {
      base: evaluateYear1Metrics(input.base),
      conservative: evaluateYear1Metrics(conservative),
      optimistic: evaluateYear1Metrics(optimistic),
    },
  };

  if (input.longTermRental) {
    result.longTerm = {
      base: calculateLongTermRentalScenario(input.longTermRental),
      conservative: calculateLongTermRentalScenario(
        applySpreadsToLtrInput(input.longTermRental, spreads, "conservative"),
      ),
      optimistic: calculateLongTermRentalScenario(
        applySpreadsToLtrInput(input.longTermRental, spreads, "optimistic"),
      ),
    };
  }

  return result;
}

export type { Money, Percentage, NominalInterestRate };
