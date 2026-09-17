/**
 * Single calculation path for case-study cards, detail pages, and tests.
 * Uses the investment engine pure functions — no fabricated market averages.
 */

import {
  Money,
  Percentage,
  nominalInterestRateFromPercentPoints,
} from "@/domains/finance";
import {
  calculateAnnualOperatingExpenses,
  calculateAnnuityPayment,
  calculateCashFlows,
  calculateGrossIncome,
  calculateNoi,
  calculateYields,
} from "@/domains/investment/engine/calculations";

import type {
  CaseStudyComputed,
  CaseStudyComputedScenario,
  CaseStudyDefinition,
  CaseStudyScenario,
} from "./types";

function czk(amount: number): Money {
  return Money.fromMajor(amount, "CZK");
}

function computeScenario(
  definition: CaseStudyDefinition,
  scenario: CaseStudyScenario,
  totalAcquisitionCostCzk: number,
  loanPrincipalCzk: number,
): CaseStudyComputedScenario {
  const tac = czk(totalAcquisitionCostCzk);
  const income = calculateGrossIncome({
    monthlyRent: czk(scenario.monthlyRentEffectiveCzk),
    vacancyRate: Percentage.fromPercentPoints(scenario.vacancyRatePct),
  });

  const opexLines = {
    propertyManagement: czk(
      definition.opexAnnual.propertyManagementCzk * scenario.opexMultiplier,
    ),
    maintenance: czk(
      definition.opexAnnual.maintenanceCzk * scenario.opexMultiplier,
    ),
    insurance: czk(definition.opexAnnual.insuranceCzk * scenario.opexMultiplier),
    propertyTax: czk(
      definition.opexAnnual.propertyTaxCzk * scenario.opexMultiplier,
    ),
    svjOwnerCost: czk(
      definition.opexAnnual.svjOwnerCostCzk * scenario.opexMultiplier,
    ),
  };
  const opex = calculateAnnualOperatingExpenses(opexLines, tac);
  const noi = calculateNoi({
    effectiveGrossIncome: income.effectiveGrossIncome.value,
    annualOperatingExpenses: opex.annualOpex.value,
  });
  const yields = calculateYields({
    effectiveGrossIncome: income.effectiveGrossIncome.value,
    noi: noi.value,
    totalAcquisitionCost: tac,
  });

  let monthlyDebtServiceCzk = 0;
  if (loanPrincipalCzk > 0) {
    const payment = calculateAnnuityPayment({
      principal: czk(loanPrincipalCzk),
      nominalInterestRate: nominalInterestRateFromPercentPoints(
        scenario.interestRatePctPoints,
      ),
      termYears: definition.loanTermYears,
    });
    monthlyDebtServiceCzk = payment.monthlyDebtService.value.toMajorNumber();
  }

  const cashFlows = calculateCashFlows({
    noi: noi.value,
    monthlyDebtService:
      loanPrincipalCzk > 0 ? czk(monthlyDebtServiceCzk) : null,
  });

  return {
    id: scenario.id,
    label: scenario.label,
    grossYieldPct: yields.grossYield.value.toPercentPointsNumber(),
    operatingYieldPct: yields.netYield.value.toPercentPointsNumber(),
    monthlyCashFlowCzk: cashFlows.monthlyLeveraged.value.toMajorNumber(),
    monthlyDebtServiceCzk,
    annualEgiCzk: income.effectiveGrossIncome.value.toMajorNumber(),
    annualNoiCzk: noi.value.toMajorNumber(),
    vacancyRatePct: scenario.vacancyRatePct,
    interestRatePctPoints: scenario.interestRatePctPoints,
  };
}

/**
 * Price (purchase only) at which base-case EGI / purchasePrice = target yield.
 * Closing/renovation/reserve are excluded on purpose — this is a yield-target
 * illustration, not an appraisal.
 */
export function purchasePriceAtTargetGrossYield(input: {
  annualEgiCzk: number;
  targetGrossYieldPct: number;
}): number | null {
  if (input.targetGrossYieldPct <= 0 || input.annualEgiCzk <= 0) return null;
  return Math.round(
    (input.annualEgiCzk / (input.targetGrossYieldPct / 100)) * 100,
  ) / 100;
}

export function computeCaseStudy(
  definition: CaseStudyDefinition,
): CaseStudyComputed {
  const totalAcquisitionCostCzk =
    definition.purchasePriceCzk +
    definition.closingCostsCzk +
    definition.renovationCostCzk +
    definition.reserveCzk;

  const loanPrincipalCzk = Math.max(
    0,
    totalAcquisitionCostCzk - definition.equityCzk,
  );

  const scenarios = definition.scenarios.map((scenario) =>
    computeScenario(
      definition,
      scenario,
      totalAcquisitionCostCzk,
      loanPrincipalCzk,
    ),
  );

  const base =
    scenarios.find((s) => s.id === "base") ??
    (() => {
      throw new Error(`Case study ${definition.slug} missing base scenario`);
    })();

  const priceAtTargetGrossYieldCzk =
    definition.targetGrossYieldPct != null
      ? purchasePriceAtTargetGrossYield({
          annualEgiCzk: base.annualEgiCzk,
          targetGrossYieldPct: definition.targetGrossYieldPct,
        })
      : null;

  return {
    definition,
    totalAcquisitionCostCzk,
    loanPrincipalCzk,
    equityRequiredCzk: definition.equityCzk,
    base,
    scenarios,
    metricNotes: {
      grossYield:
        "Hrubý výnos = efektivní hrubý příjem (EGI, po neobsazenosti) / celkové pořizovací náklady (kupní cena + vedlejší náklady + rekonstrukce + rezerva).",
      operatingYield:
        "Provozní výnos = NOI (EGI − provozní náklady vlastníka) / celkové pořizovací náklady. Před financováním.",
      cashFlow:
        "Cash flow = NOI − splátky úvěru, přepočteno na měsíc. Nezahrnuje daň z příjmu.",
      tax: "Všechny metriky jsou před zdaněním.",
    },
    priceAtTargetGrossYieldCzk,
  };
}
