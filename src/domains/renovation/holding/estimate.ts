/**
 * Holding costs during renovation — integrates with Investment / Finance engine.
 * Interest, mortgage, HOA, energy, lost rent.
 */

import { resolveAssumptionDefaults } from "@/config/investment-assumptions";
import { Money, Percentage, nominalInterestRateFromPercentPoints } from "@/domains/finance";
import { calculateAnnuityPayment } from "@/domains/investment/engine/calculations/financing";
import { calculateGrossIncome } from "@/domains/investment/engine/calculations/income";

import type { CostBand } from "../costs/bands";
import type {
  RenovationTimelineEstimate,
  TimelineScenario,
} from "../timeline/types";
import { pickTimelineDuration } from "../timeline/types";

export const HOLDING_COST_MODEL_VERSION = "holding-cost.v2026.07";

export type HoldingCostsInput = {
  timeline: RenovationTimelineEstimate;
  /** Which duration track drives holding costs. */
  timelineScenario?: TimelineScenario;
  purchasePriceCzk: number;
  loanPrincipalCzk?: number | null;
  /** Nominal annual rate in percent points (defaults from ASSUMPTION_CONFIG). */
  nominalInterestRatePp?: number;
  termYears?: number;
  monthlyHoaCzk?: number | null;
  monthlyEnergyCzk?: number | null;
  /** Expected market rent during downtime (lost rent basis). */
  monthlyRentCzk?: number | null;
  vacancyRatePp?: number;
};

export type HoldingCostBreakdown = {
  durationMonths: number;
  debtService: CostBand;
  hoa: CostBand;
  energy: CostBand;
  lostRent: CostBand;
  total: CostBand;
  holdingModelVersion: string;
};

function roundCzk(n: number): number {
  return Math.round(n);
}

function scaleBand(band: CostBand, lowMul: number, highMul: number): CostBand {
  return {
    lowCzk: roundCzk(band.baseCzk * lowMul),
    baseCzk: band.baseCzk,
    highCzk: roundCzk(band.baseCzk * highMul),
  };
}

function monthlyDebtService(
  principalCzk: number,
  ratePp: number,
  termYears: number,
): number {
  if (principalCzk <= 0) {
    return 0;
  }
  const result = calculateAnnuityPayment({
    principal: Money.fromMajor(principalCzk, "CZK"),
    nominalInterestRate: nominalInterestRateFromPercentPoints(ratePp),
    termYears,
  });
  return result.monthlyPayment.value.toMajorNumber();
}

/**
 * Holding costs for renovation downtime.
 * Lost rent = EGI forgone during works (Expected Rent × Downtime).
 */
export function estimateHoldingCosts(input: HoldingCostsInput): HoldingCostBreakdown {
  const scenario = input.timelineScenario ?? "base";
  const duration = pickTimelineDuration(input.timeline, scenario);
  const months = Math.max(1, Math.ceil(duration.months));

  const loan = input.loanPrincipalCzk ?? 0;
  const { defaults } = resolveAssumptionDefaults();
  const ratePp = input.nominalInterestRatePp ?? defaults.interestRatePp;
  const termYears = input.termYears ?? defaults.termYears;

  const monthlyDs = monthlyDebtService(loan, ratePp, termYears);
  const debtBase = roundCzk(monthlyDs * months);

  const hoaMonthly = input.monthlyHoaCzk ?? 0;
  const energyMonthly = input.monthlyEnergyCzk ?? 0;
  const hoaBase = roundCzk(hoaMonthly * months);
  const energyBase = roundCzk(energyMonthly * months);

  let lostRentBase = 0;
  if (input.monthlyRentCzk != null && input.monthlyRentCzk > 0) {
    const rentIncome = calculateGrossIncome({
      monthlyRent: Money.fromMajor(input.monthlyRentCzk, "CZK"),
      vacancyRate:
        input.vacancyRatePp != null
          ? Percentage.fromPercentPoints(input.vacancyRatePp)
          : Percentage.zero(),
    });
    const monthlyEgi = rentIncome.effectiveGrossIncome.value
      .toMajorNumber() / 12;
    lostRentBase = roundCzk(monthlyEgi * months);
  }

  const debtService: CostBand = scaleBand(
    { lowCzk: debtBase, baseCzk: debtBase, highCzk: debtBase },
    0.95,
    1.05,
  );
  const hoa: CostBand = scaleBand(
    { lowCzk: hoaBase, baseCzk: hoaBase, highCzk: hoaBase },
    0.9,
    1.1,
  );
  const energy: CostBand = scaleBand(
    { lowCzk: energyBase, baseCzk: energyBase, highCzk: energyBase },
    0.85,
    1.25,
  );
  const lostRent: CostBand = scaleBand(
    { lowCzk: lostRentBase, baseCzk: lostRentBase, highCzk: lostRentBase },
    0.9,
    1.15,
  );

  const totalBase =
    debtService.baseCzk +
    hoa.baseCzk +
    energy.baseCzk +
    lostRent.baseCzk;

  const total: CostBand = {
    lowCzk:
      debtService.lowCzk + hoa.lowCzk + energy.lowCzk + lostRent.lowCzk,
    baseCzk: totalBase,
    highCzk:
      debtService.highCzk + hoa.highCzk + energy.highCzk + lostRent.highCzk,
  };

  return {
    durationMonths: months,
    debtService,
    hoa,
    energy,
    lostRent,
    total,
    holdingModelVersion: HOLDING_COST_MODEL_VERSION,
  };
}
