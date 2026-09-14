/**
 * Reverse max purchase for rental targets (yield, cash flow, CoC, IRR).
 *
 * For scan-based targets (CF, CoC, IRR): as purchase price rises, affordability
 * falls — return the *highest* purchase that still meets the target (not the first/min).
 */

import {
  resolveAssumptionDefaults,
} from "@/config/investment-assumptions";
import { Money, Percentage, nominalInterestRateFromPercentPoints } from "@/domains/finance";
import { calculateNoi } from "@/domains/investment/engine/calculations/metrics";
import {
  calculateCashFlows,
  calculateCashOnCash,
  calculateEquityRequired,
} from "@/domains/investment/engine/calculations/cash-flow";
import { calculateLongTermRentalScenario } from "@/domains/investment/engine/scenarios/long-term-rental";
import { calculateAnnuityPayment } from "@/domains/investment/engine/calculations/financing";

import type { MaxOfferBandSet, MaxOfferCostContext } from "./types";

function roundCzk(n: number): number {
  return Math.max(0, Math.round(n));
}

function assumptionShares() {
  const { defaults } = resolveAssumptionDefaults();
  return {
    acqShare: defaults.acquisitionCostsShareOfPrice,
    feesShare: defaults.feesShareOfPrice,
    ratePp: defaults.interestRatePp,
    termYears: defaults.termYears,
    holdYears: defaults.holdYears,
    appreciationPp: defaults.appreciationPp,
    rentGrowthPp: defaults.rentGrowthPp,
    expenseInflationPp: defaults.expenseInflationPp,
  };
}

function resolveCostRates(c: MaxOfferCostContext) {
  const a = assumptionShares();
  return {
    acq:
      c.acquisitionCostRatePct != null
        ? c.acquisitionCostRatePct / 100
        : a.acqShare,
    fees: c.feesRatePct != null ? c.feesRatePct / 100 : a.feesShare,
    ltv: (c.loanLtvPct ?? 70) / 100,
    ratePp: c.nominalInterestRatePp ?? a.ratePp,
    termYears: c.termYears ?? a.termYears,
  };
}

function noiAnnual(egi: number, opex: number): number {
  const result = calculateNoi({
    effectiveGrossIncome: Money.fromMajor(egi, "CZK"),
    annualOperatingExpenses: Money.fromMajor(opex, "CZK"),
  });
  return result.value.toMajorNumber();
}

function annualDebtService(
  loan: number,
  ratePp: number,
  termYears: number,
): number {
  if (loan <= 0) {
    return 0;
  }
  return calculateAnnuityPayment({
    principal: Money.fromMajor(loan, "CZK"),
    nominalInterestRate: nominalInterestRateFromPercentPoints(ratePp),
    termYears,
  }).annualDebtService.value.toMajorNumber();
}

function maxFromNetYield(
  noi: number,
  targetNetYieldPct: number,
  reno: number,
  acqRate: number,
  feesRate: number,
): number {
  if (targetNetYieldPct <= 0) {
    return 0;
  }
  const tac = noi / (targetNetYieldPct / 100);
  const multiplier = 1 + acqRate + feesRate;
  return roundCzk((tac - reno) / multiplier);
}

/**
 * Highest purchase price whose leveraged monthly CF still meets the target.
 * CF falls as price (and loan) rises — scan ascending, keep last hit.
 */
function maxFromMonthlyCashFlow(input: {
  annualEgi: number;
  annualOpex: number;
  targetMonthlyCf: number;
  loanLtv: number;
  ratePp: number;
  termYears: number;
}): number {
  let best = 0;
  const noi = noiAnnual(input.annualEgi, input.annualOpex);

  for (let purchase = 500_000; purchase <= 50_000_000; purchase += 50_000) {
    const loan = purchase * input.loanLtv;
    const ads = annualDebtService(loan, input.ratePp, input.termYears);
    const monthlyCf = calculateCashFlows({
      noi: Money.fromMajor(noi, "CZK"),
      monthlyDebtService: Money.fromMajor(ads / 12, "CZK"),
    }).monthlyLeveraged.value.toMajorNumber();

    if (monthlyCf >= input.targetMonthlyCf) {
      best = purchase;
    } else if (best > 0) {
      break;
    }
  }
  return roundCzk(best);
}

/**
 * Highest purchase whose leveraged CoC (annual CF / equity) meets the target.
 * CoC uses leveraged cash flow — never raw NOI / equity.
 */
function maxFromCashOnCash(input: {
  annualEgi: number;
  annualOpex: number;
  targetCashOnCashPct: number;
  reno: number;
  acqRate: number;
  feesRate: number;
  loanLtv: number;
  ratePp: number;
  termYears: number;
}): number {
  let best = 0;
  const noiMoney = Money.fromMajor(
    noiAnnual(input.annualEgi, input.annualOpex),
    "CZK",
  );

  for (let purchase = 500_000; purchase <= 30_000_000; purchase += 100_000) {
    const tac = purchase * (1 + input.acqRate + input.feesRate) + input.reno;
    const loan = purchase * input.loanLtv;
    const equity = calculateEquityRequired({
      totalAcquisitionCost: Money.fromMajor(tac, "CZK"),
      loanPrincipal: Money.fromMajor(loan, "CZK"),
    }).value;
    if (equity.isZero() || equity.isNegative()) {
      continue;
    }

    const ads = annualDebtService(loan, input.ratePp, input.termYears);
    const annualCf = calculateCashFlows({
      noi: noiMoney,
      monthlyDebtService: Money.fromMajor(ads / 12, "CZK"),
    }).annualLeveraged.value;

    const coc = calculateCashOnCash({
      annualLeveragedCashFlow: annualCf,
      equityRequired: equity,
    });
    const cocPp = coc.value?.toPercentPointsNumber() ?? null;
    if (cocPp != null && cocPp >= input.targetCashOnCashPct) {
      best = purchase;
    } else if (best > 0) {
      break;
    }
  }
  return roundCzk(best);
}

function maxFromIrr(input: {
  annualEgi: number;
  annualOpex: number;
  targetIrrPct: number;
  reno: number;
  acqRate: number;
  feesRate: number;
  loanLtv: number;
  ratePp: number;
  termYears: number;
  holdYears: number;
}): number {
  const a = assumptionShares();
  let best = 0;
  for (let purchase = 500_000; purchase <= 50_000_000; purchase += 100_000) {
    const acq = purchase * input.acqRate;
    const fees = purchase * input.feesRate;
    const tac = purchase + acq + fees + input.reno;
    const loan = purchase * input.loanLtv;

    const scenario = calculateLongTermRentalScenario({
      holdYears: input.holdYears,
      totalAcquisitionCost: Money.fromMajor(tac, "CZK"),
      baseEgi: Money.fromMajor(input.annualEgi, "CZK"),
      baseOpex: Money.fromMajor(input.annualOpex, "CZK"),
      loan: {
        principal: Money.fromMajor(loan, "CZK"),
        nominalInterestRate: nominalInterestRateFromPercentPoints(input.ratePp),
        termYears: input.termYears,
      },
      growth: {
        appreciationRate: Percentage.fromPercentPoints(a.appreciationPp),
        rentGrowthRate: Percentage.fromPercentPoints(a.rentGrowthPp),
        expenseInflationRate: Percentage.fromPercentPoints(a.expenseInflationPp),
      },
    });

    const irr = scenario.returns.irr.value?.toPercentPointsNumber() ?? null;
    if (irr != null && irr >= input.targetIrrPct) {
      best = purchase;
    } else if (best > 0) {
      break;
    }
  }
  return roundCzk(best);
}

export function maxPurchaseRental(input: {
  costs: MaxOfferCostContext;
  targetNetYieldPct?: number;
  targetMonthlyCashFlowCzk?: number;
  targetCashOnCashPct?: number;
  targetIrrPct?: number;
  holdYears?: number;
  scenario: "conservative" | "base" | "optimistic";
}): { purchase: number; bindingTarget: string } {
  const c = input.costs;
  const rates = resolveCostRates(c);
  const a = assumptionShares();
  const holdYears = input.holdYears ?? a.holdYears;

  let reno: number;
  let egi = c.annualEgiCzk ?? 0;
  let opex = c.annualOpexCzk ?? 0;

  switch (input.scenario) {
    case "conservative":
      reno = c.renovationCost.highCzk;
      egi = Math.round(egi * 0.92);
      opex = Math.round(opex * 1.08);
      break;
    case "optimistic":
      reno = c.renovationCost.lowCzk;
      egi = Math.round(egi * 1.05);
      break;
    default:
      reno = c.renovationCost.baseCzk;
  }

  const candidates: { purchase: number; label: string }[] = [];

  if (input.targetNetYieldPct != null) {
    const noi = noiAnnual(egi, opex);
    candidates.push({
      purchase: maxFromNetYield(
        noi,
        input.targetNetYieldPct,
        reno,
        rates.acq,
        rates.fees,
      ),
      label: `target net yield ${input.targetNetYieldPct}%`,
    });
  }

  if (input.targetMonthlyCashFlowCzk != null) {
    candidates.push({
      purchase: maxFromMonthlyCashFlow({
        annualEgi: egi,
        annualOpex: opex,
        targetMonthlyCf: input.targetMonthlyCashFlowCzk,
        loanLtv: rates.ltv,
        ratePp: rates.ratePp,
        termYears: rates.termYears,
      }),
      label: `target cash flow ${input.targetMonthlyCashFlowCzk} Kč/m`,
    });
  }

  if (input.targetCashOnCashPct != null && egi > 0) {
    candidates.push({
      purchase: maxFromCashOnCash({
        annualEgi: egi,
        annualOpex: opex,
        targetCashOnCashPct: input.targetCashOnCashPct,
        reno,
        acqRate: rates.acq,
        feesRate: rates.fees,
        loanLtv: rates.ltv,
        ratePp: rates.ratePp,
        termYears: rates.termYears,
      }),
      label: `target CoC ${input.targetCashOnCashPct}%`,
    });
  }

  if (input.targetIrrPct != null) {
    candidates.push({
      purchase: maxFromIrr({
        annualEgi: egi,
        annualOpex: opex,
        targetIrrPct: input.targetIrrPct,
        reno,
        acqRate: rates.acq,
        feesRate: rates.fees,
        loanLtv: rates.ltv,
        ratePp: rates.ratePp,
        termYears: rates.termYears,
        holdYears,
      }),
      label: `target IRR ${input.targetIrrPct}%`,
    });
  }

  if (candidates.length === 0) {
    return { purchase: 0, bindingTarget: "none" };
  }

  const binding = candidates.reduce((min, cand) =>
    cand.purchase < min.purchase ? cand : min,
  );

  return { purchase: binding.purchase, bindingTarget: binding.label };
}

export function maxPurchaseRentalBands(input: {
  costs: MaxOfferCostContext;
  targetNetYieldPct?: number;
  targetMonthlyCashFlowCzk?: number;
  targetCashOnCashPct?: number;
  targetIrrPct?: number;
  holdYears?: number;
}): { bands: MaxOfferBandSet; bindingTarget: string } {
  const conservative = maxPurchaseRental({
    ...input,
    scenario: "conservative",
  });
  const base = maxPurchaseRental({ ...input, scenario: "base" });
  const optimistic = maxPurchaseRental({
    ...input,
    scenario: "optimistic",
  });

  return {
    bands: {
      conservative: conservative.purchase,
      base: base.purchase,
      optimistic: optimistic.purchase,
    },
    bindingTarget: conservative.bindingTarget,
  };
}
