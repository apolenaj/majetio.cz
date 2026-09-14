/**
 * Renovation economics — uplift, creation, ROI, over-improvement, yields.
 */

import { Money, Percentage } from "@/domains/finance";
import {
  calculateNoi,
  calculateYields,
} from "@/domains/investment/engine/calculations/metrics";
import { calculateGrossIncome } from "@/domains/investment/engine/calculations/income";

import type { CostBand } from "../costs/bands";
import type {
  OverImprovementRisk,
  RenovationEconomics,
  ValueBand,
  YieldSnapshot,
} from "./types";

function subtractBands(a: ValueBand, b: ValueBand): ValueBand {
  return {
    lowCzk: a.lowCzk - b.highCzk,
    baseCzk: a.baseCzk - b.baseCzk,
    highCzk: a.highCzk - b.lowCzk,
  };
}

function sumBands(a: CostBand, b: CostBand): ValueBand {
  return {
    lowCzk: a.lowCzk + b.lowCzk,
    baseCzk: a.baseCzk + b.baseCzk,
    highCzk: a.highCzk + b.highCzk,
  };
}

function divideBand(
  numerator: ValueBand,
  denominator: number,
): ValueBand | null {
  if (denominator <= 0) {
    return null;
  }
  return {
    lowCzk: Math.round((numerator.lowCzk / denominator) * 1000) / 10,
    baseCzk: Math.round((numerator.baseCzk / denominator) * 1000) / 10,
    highCzk: Math.round((numerator.highCzk / denominator) * 1000) / 10,
  };
}

function detectOverImprovement(
  renovationCostBase: number,
  valueUpliftBase: number,
): OverImprovementRisk {
  if (valueUpliftBase <= 0) {
    return {
      detected: true,
      severity: "high",
      message:
        "Rekonstrukce nezvyšuje odhadovanou tržní hodnotu — riziko over-improvement.",
      renovationCostBaseCzk: renovationCostBase,
      valueUpliftBaseCzk: valueUpliftBase,
    };
  }

  if (renovationCostBase > valueUpliftBase) {
    const ratio = renovationCostBase / valueUpliftBase;
    return {
      detected: true,
      severity: ratio > 1.25 ? "high" : "moderate",
      message:
        "Investice do rekonstrukce převyšuje nárůst tržní hodnoty — riziko over-improvement.",
      renovationCostBaseCzk: renovationCostBase,
      valueUpliftBaseCzk: valueUpliftBase,
    };
  }

  return {
    detected: false,
    severity: "none",
    message: "Nárůst hodnoty pokrývá investici do rekonstrukce.",
    renovationCostBaseCzk: renovationCostBase,
    valueUpliftBaseCzk: valueUpliftBase,
  };
}

function computeYieldSnapshot(input: {
  monthlyRentCzk: number | null;
  annualOpexCzk: number;
  totalInvestedCapitalCzk: number;
  vacancyRatePp?: number;
}): YieldSnapshot {
  if (
    input.monthlyRentCzk == null ||
    input.monthlyRentCzk <= 0 ||
    input.totalInvestedCapitalCzk <= 0
  ) {
    return { grossYieldPct: null, netYieldPct: null };
  }

  const income = calculateGrossIncome({
    monthlyRent: Money.fromMajor(input.monthlyRentCzk, "CZK"),
    vacancyRate:
      input.vacancyRatePp != null
        ? Percentage.fromPercentPoints(input.vacancyRatePp)
        : Percentage.fromPercentPoints(5),
  });

  const opex = Money.fromMajor(input.annualOpexCzk, "CZK");
  const noi = calculateNoi({
    effectiveGrossIncome: income.effectiveGrossIncome.value,
    annualOperatingExpenses: opex,
  }).value;

  const tac = Money.fromMajor(input.totalInvestedCapitalCzk, "CZK");
  const yields = calculateYields({
    effectiveGrossIncome: income.effectiveGrossIncome.value,
    noi,
    totalAcquisitionCost: tac,
  });

  return {
    grossYieldPct: yields.grossYield.value.toPercentPointsNumber(),
    netYieldPct: yields.netYield.value.toPercentPointsNumber(),
  };
}

export function computeRenovationEconomics(input: {
  purchasePriceCzk: number;
  renovationCost: ValueBand;
  holdingCosts: ValueBand;
  valueBefore: ValueBand | null;
  valueAfter: ValueBand | null;
  monthlyRentBeforeCzk?: number | null;
  monthlyRentAfterCzk?: number | null;
  annualOpexCzk?: number | null;
  vacancyRatePp?: number;
}): RenovationEconomics {
  const purchaseBand: ValueBand = {
    lowCzk: input.purchasePriceCzk,
    baseCzk: input.purchasePriceCzk,
    highCzk: input.purchasePriceCzk,
  };

  const totalInvestedCapital = sumBands(
    sumBands(purchaseBand, input.renovationCost),
    input.holdingCosts,
  );

  const valueBefore = input.valueBefore ?? purchaseBand;
  const valueAfter = input.valueAfter ?? valueBefore;

  const valueUplift = subtractBands(valueAfter, valueBefore);
  const valueCreation = subtractBands(valueUplift, input.renovationCost);

  const roi = divideBand(valueCreation, totalInvestedCapital.baseCzk);

  const opex = input.annualOpexCzk ?? 0;

  const yieldBefore = computeYieldSnapshot({
    monthlyRentCzk: input.monthlyRentBeforeCzk ?? null,
    annualOpexCzk: opex,
    totalInvestedCapitalCzk: purchaseBand.baseCzk,
    vacancyRatePp: input.vacancyRatePp,
  });

  const yieldAfter = computeYieldSnapshot({
    monthlyRentCzk: input.monthlyRentAfterCzk ?? null,
    annualOpexCzk: opex,
    totalInvestedCapitalCzk: totalInvestedCapital.baseCzk,
    vacancyRatePp: input.vacancyRatePp,
  });

  const overImprovementRisk = detectOverImprovement(
    input.renovationCost.baseCzk,
    valueUplift.baseCzk,
  );

  return {
    totalInvestedCapital,
    renovationCost: input.renovationCost,
    holdingCosts: input.holdingCosts,
    purchasePriceCzk: input.purchasePriceCzk,
    valueUplift,
    valueCreation,
    roi,
    yieldBefore,
    yieldAfter,
    overImprovementRisk,
  };
}
