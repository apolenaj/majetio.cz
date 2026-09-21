/**
 * Single calculation path for case-study cards, detail pages, and tests.
 * Uses the investment engine (annual opex lines, Money). Public calculators
 * under src/lib/calculators share one NOI model with each other; case-study
 * fixtures stay on this engine so published numbers do not shift.
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
} from "@/domains/investment/engine/calculations";

import type {
  CaseStudyComputed,
  CaseStudyComputedScenario,
  CaseStudyDefinition,
  CaseStudyOpexAnnual,
  CaseStudyScenario,
  DecisionSummary,
  OpexLineComputed,
} from "./types";

function czk(amount: number): Money {
  return Money.fromMajor(amount, "CZK");
}

const OPEX_LABELS: Record<
  keyof CaseStudyOpexAnnual,
  { label: string; note: string }
> = {
  propertyManagementCzk: {
    label: "Správa",
    note: "Náklad vlastníka — správa nájmu / objektu.",
  },
  maintenanceCzk: {
    label: "Údržba",
    note: "Náklad vlastníka — běžná údržba (mimo jednorázovou rezervu při koupi).",
  },
  insuranceCzk: {
    label: "Pojištění",
    note: "Náklad vlastníka — pojištění nemovitosti.",
  },
  propertyTaxCzk: {
    label: "Daň z nemovitosti",
    note: "Náklad vlastníka.",
  },
  svjOwnerCostCzk: {
    label: "SVJ / společné náklady vlastníka",
    note: "Příspěvek vlastníka (fond oprav / provoz). Nejsou to zálohy nájemce za služby.",
  },
};

/**
 * Kupní cena při cílovém výnosu po neobsazenosti z celkových pořizovacích nákladů:
 * EGI / cíl − vedlejší − rekonstrukce − rezerva.
 * Předpoklad: ostatní pořizovací náklady jsou pevné (nezávislé na kupní ceně).
 */
export function purchasePriceAtTargetYieldOnTac(input: {
  annualEgiCzk: number;
  targetYieldAfterVacancyOnTacPct: number;
  closingCostsCzk: number;
  renovationCostCzk: number;
  reserveCzk: number;
}): number | null {
  if (
    input.targetYieldAfterVacancyOnTacPct <= 0 ||
    input.annualEgiCzk <= 0
  ) {
    return null;
  }
  const impliedTac =
    input.annualEgiCzk / (input.targetYieldAfterVacancyOnTacPct / 100);
  const purchase =
    impliedTac -
    input.closingCostsCzk -
    input.renovationCostCzk -
    input.reserveCzk;
  return purchase;
}

/** @deprecated Use purchasePriceAtTargetYieldOnTac */
export function purchasePriceAtTargetGrossYield(input: {
  annualEgiCzk: number;
  targetGrossYieldPct: number;
  closingCostsCzk?: number;
  renovationCostCzk?: number;
  reserveCzk?: number;
}): number | null {
  return purchasePriceAtTargetYieldOnTac({
    annualEgiCzk: input.annualEgiCzk,
    targetYieldAfterVacancyOnTacPct: input.targetGrossYieldPct,
    closingCostsCzk: input.closingCostsCzk ?? 0,
    renovationCostCzk: input.renovationCostCzk ?? 0,
    reserveCzk: input.reserveCzk ?? 0,
  });
}

function scaleOpex(
  opex: CaseStudyOpexAnnual,
  multiplier: number,
): CaseStudyOpexAnnual {
  return {
    propertyManagementCzk: opex.propertyManagementCzk * multiplier,
    maintenanceCzk: opex.maintenanceCzk * multiplier,
    insuranceCzk: opex.insuranceCzk * multiplier,
    propertyTaxCzk: opex.propertyTaxCzk * multiplier,
    svjOwnerCostCzk: opex.svjOwnerCostCzk * multiplier,
  };
}

function toOpexLines(opex: CaseStudyOpexAnnual): OpexLineComputed[] {
  const keys = Object.keys(OPEX_LABELS) as Array<keyof CaseStudyOpexAnnual>;
  return keys
    .map((key) => {
      const annualCzk = opex[key];
      if (annualCzk === 0) return null;
      return {
        key,
        label: OPEX_LABELS[key].label,
        annualCzk,
        note: OPEX_LABELS[key].note,
      };
    })
    .filter((line): line is OpexLineComputed => line != null);
}

/**
 * Break-even purchase price: monthly cash flow = 0.
 * Assumptions: equity fixed; other acquisition costs fixed; loan = TAC − equity;
 * rent, vacancy, opex and rate from the given scenario.
 */
export function breakEvenPurchasePriceHoldingEquity(input: {
  annualNoiCzk: number;
  equityCzk: number;
  closingCostsCzk: number;
  renovationCostCzk: number;
  reserveCzk: number;
  interestRatePctPoints: number;
  termYears: number;
}): number | null {
  if (input.annualNoiCzk <= 0) return null;
  const monthlyTarget = input.annualNoiCzk / 12;
  const payment = calculateAnnuityPayment({
    principal: czk(1_000_000),
    nominalInterestRate: nominalInterestRateFromPercentPoints(
      input.interestRatePctPoints,
    ),
    termYears: input.termYears,
  });
  const paymentPerMillion = payment.monthlyDebtService.value.toMajorNumber();
  if (paymentPerMillion <= 0) return null;

  const loanPrincipalCzk = (monthlyTarget / paymentPerMillion) * 1_000_000;
  const other =
    input.closingCostsCzk + input.renovationCostCzk + input.reserveCzk;
  // loan = purchase + other − equity  →  purchase = loan − other + equity
  const purchase = loanPrincipalCzk - other + input.equityCzk;
  if (purchase <= 0) return null;
  return purchase;
}

function computeScenario(
  definition: CaseStudyDefinition,
  scenario: CaseStudyScenario,
  purchasePriceCzk: number,
  totalAcquisitionCostCzk: number,
  loanPrincipalCzk: number,
): CaseStudyComputedScenario {
  const scaledOpex = scaleOpex(definition.opexAnnual, scenario.opexMultiplier);
  const income = calculateGrossIncome({
    monthlyRent: czk(scenario.monthlyRentEffectiveCzk),
    vacancyRate: Percentage.fromPercentPoints(scenario.vacancyRatePct),
  });

  const opex = calculateAnnualOperatingExpenses(
    {
      propertyManagement: czk(scaledOpex.propertyManagementCzk),
      maintenance: czk(scaledOpex.maintenanceCzk),
      insurance: czk(scaledOpex.insuranceCzk),
      propertyTax: czk(scaledOpex.propertyTaxCzk),
      svjOwnerCost: czk(scaledOpex.svjOwnerCostCzk),
    },
    czk(totalAcquisitionCostCzk),
  );
  const noi = calculateNoi({
    effectiveGrossIncome: income.effectiveGrossIncome.value,
    annualOperatingExpenses: opex.annualOpex.value,
  });

  const annualContractRentCzk =
    income.potentialGrossIncome.value.toMajorNumber();
  const annualEgiCzk = income.effectiveGrossIncome.value.toMajorNumber();
  const annualNoiCzk = noi.value.toMajorNumber();
  const opexTotalCzk = opex.annualOpex.value.toMajorNumber();

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

  const monthlyCashFlowCzk = cashFlows.monthlyLeveraged.value.toMajorNumber();
  const annualCashFlowCzk = cashFlows.annualLeveraged.value.toMajorNumber();
  const annualDebtServiceCzk = monthlyDebtServiceCzk * 12;

  const grossRentalYieldOnPurchasePct =
    purchasePriceCzk > 0
      ? (annualContractRentCzk / purchasePriceCzk) * 100
      : 0;
  const yieldAfterVacancyOnTacPct =
    totalAcquisitionCostCzk > 0
      ? (annualEgiCzk / totalAcquisitionCostCzk) * 100
      : 0;
  const operatingYieldOnTacPct =
    totalAcquisitionCostCzk > 0
      ? (annualNoiCzk / totalAcquisitionCostCzk) * 100
      : 0;

  return {
    id: scenario.id,
    label: scenario.label,
    inputs: {
      monthlyContractRentCzk: scenario.monthlyRentEffectiveCzk,
      vacancyRatePct: scenario.vacancyRatePct,
      opexMultiplier: scenario.opexMultiplier,
      interestRatePctPoints: scenario.interestRatePctPoints,
    },
    grossRentalYieldOnPurchasePct,
    yieldAfterVacancyOnTacPct,
    operatingYieldOnTacPct,
    monthlyCashFlowCzk,
    annualCashFlowCzk,
    monthlyDebtServiceCzk,
    annualContractRentCzk,
    annualEgiCzk,
    annualNoiCzk,
    vacancyRatePct: scenario.vacancyRatePct,
    interestRatePctPoints: scenario.interestRatePctPoints,
    opexLines: toOpexLines(scaledOpex),
    opexTotalCzk,
    waterfall: {
      annualContractRentCzk,
      vacancyLossCzk: income.vacancyLoss.value.toMajorNumber(),
      effectiveGrossIncomeCzk: annualEgiCzk,
      opexTotalCzk,
      noiCzk: annualNoiCzk,
      annualDebtServiceCzk,
      annualCashFlowCzk,
      monthlyCashFlowCzk,
    },
  };
}

function buildDecision(
  definition: CaseStudyDefinition,
  base: CaseStudyComputedScenario,
): DecisionSummary {
  const monthlyTopUpCzk =
    base.monthlyCashFlowCzk < 0 ? -base.monthlyCashFlowCzk : 0;
  // Prefer 12 × rounded-display monthly top-up only when documenting UI;
  // decision math keeps unrounded annual cash flow.
  const annualTopUpCzk =
    base.annualCashFlowCzk < 0 ? -base.annualCashFlowCzk : 0;

  const breakEvenPurchasePriceCzk = breakEvenPurchasePriceHoldingEquity({
    annualNoiCzk: base.annualNoiCzk,
    equityCzk: definition.equityCzk,
    closingCostsCzk: definition.closingCostsCzk,
    renovationCostCzk: definition.renovationCostCzk,
    reserveCzk: definition.reserveCzk,
    interestRatePctPoints: base.interestRatePctPoints,
    termYears: definition.loanTermYears,
  });

  const coversOpsAndDebt = base.monthlyCashFlowCzk >= 0;

  const mostSensitiveAssumptions = [
    "Výše smluvního nájemného a skutečná neobsazenost",
    "Úroková sazba a výše úvěru při pevném vlastním kapitálu",
    "Provozní náklady vlastníka (správa, údržba, SVJ)",
  ];

  const pathToTarget =
    definition.targetYieldAfterVacancyOnTacPct != null
      ? `Cílový výnos po neobsazenosti ${definition.targetYieldAfterVacancyOnTacPct} % z celkových pořizovacích nákladů by při pevném EGI a pevných ostatních nákladech vyžadoval nižší kupní cenu (viz výpočet níže). Růst ceny nemovitosti model nepředpokládá.`
      : "Cílový výnos není ve studii zadaný — upravte kupní cenu, nájem nebo úvěr podle vlastního cíle.";

  const narrative = coversOpsAndDebt
    ? `Při zadaných předpokladech nájem po provozních nákladech pokryje i modelovou splátku. Měsíční cash flow je ${base.monthlyCashFlowCzk.toFixed(2)} Kč (před zdaněním). Záporné cash flow by znamenalo doplatek z vlastních zdrojů — nejde automaticky o ztrátu celé investice ani o to, že se nesplácí jistina.`
    : `Při zadaných předpokladech nájem po provozních nákladech nepokryje modelovou splátku. Měsíční doplatek je přibližně ${monthlyTopUpCzk.toFixed(2)} Kč (ročně ${annualTopUpCzk.toFixed(2)} Kč) před zdaněním. Jde o provozní cash flow po splátce — ne o celkovou ztrátu investice. Část splátky splácí jistinu úvěru; model nepředpokládá růst ceny nemovitosti.`;

  return {
    coversOpsAndDebt,
    monthlyTopUpCzk,
    annualTopUpCzk,
    monthlyCashFlowCzk: base.monthlyCashFlowCzk,
    annualCashFlowCzk: base.annualCashFlowCzk,
    principalAmortizationNote:
      "Anuitní splátka obsahuje úrok i jistinu. Záporné cash flow ≠ ztráta jistiny; jistina se stále umořuje ze splátky.",
    mostSensitiveAssumptions,
    mustVerify: definition.missingDocuments,
    pathToTarget,
    breakEvenPurchasePriceCzk,
    breakEvenAssumptions:
      "Nulové měsíční cash flow při pevném vlastním kapitálu, pevných vedlejších nákladech / rekonstrukci / rezervě, pevném nájmu, neobsazenosti, opex a sazbě ze základního scénáře. Mění se kupní cena a tím i výše úvěru (úvěr = pořizovací náklady − vlastní kapitál).",
    narrative,
  };
}

export function computeCaseStudy(
  definition: CaseStudyDefinition,
): CaseStudyComputed {
  const otherAcquisitionCostsCzk =
    definition.closingCostsCzk +
    definition.renovationCostCzk +
    definition.reserveCzk;

  const totalAcquisitionCostCzk =
    definition.purchasePriceCzk + otherAcquisitionCostsCzk;

  const loanPrincipalCzk = Math.max(
    0,
    totalAcquisitionCostCzk - definition.equityCzk,
  );

  const scenarios = definition.scenarios.map((scenario) =>
    computeScenario(
      definition,
      scenario,
      definition.purchasePriceCzk,
      totalAcquisitionCostCzk,
      loanPrincipalCzk,
    ),
  );

  const base =
    scenarios.find((s) => s.id === "base") ??
    (() => {
      throw new Error(`Case study ${definition.slug} missing base scenario`);
    })();

  const targetPct = definition.targetYieldAfterVacancyOnTacPct ?? null;
  const priceAtTargetYieldOnTacCzk =
    targetPct != null
      ? purchasePriceAtTargetYieldOnTac({
          annualEgiCzk: base.annualEgiCzk,
          targetYieldAfterVacancyOnTacPct: targetPct,
          closingCostsCzk: definition.closingCostsCzk,
          renovationCostCzk: definition.renovationCostCzk,
          reserveCzk: definition.reserveCzk,
        })
      : null;

  const annualContractRent = definition.baseMonthlyRentCzk * 12;
  const impliedMgmtPct =
    annualContractRent > 0
      ? (definition.opexAnnual.propertyManagementCzk / annualContractRent) *
        100
      : null;
  const declared = definition.managementFeePctOfContractRent ?? null;
  const matchesDeclared =
    declared != null && impliedMgmtPct != null
      ? Math.abs(declared - impliedMgmtPct) < 0.05
      : null;

  return {
    definition,
    totalAcquisitionCostCzk,
    otherAcquisitionCostsCzk,
    loanPrincipalCzk,
    equityRequiredCzk: definition.equityCzk,
    financing: {
      loanPrincipalCzk,
      equityCzk: definition.equityCzk,
      interestRatePctPoints: base.interestRatePctPoints,
      termYears: definition.loanTermYears,
      repaymentMethod:
        "Anuita (konstantní měsíční splátka z nominální sazby, před zdaněním)",
      monthlyDebtServiceCzk: base.monthlyDebtServiceCzk,
    },
    reserveTreatment:
      "Rezerva je jednorázová částka při koupi a vstupuje do celkových pořizovacích nákladů. Neodečítá se znovu v ročních provozních nákladech.",
    managementFeeCheck: {
      declaredPct: declared,
      impliedPctOfContractRent: impliedMgmtPct,
      matchesDeclared,
    },
    base,
    scenarios,
    metricNotes: {
      grossRentalYieldOnPurchase:
        "Hrubý nájemní výnos z kupní ceny = smluvní nájemné za rok ÷ kupní cena (před neobsazeností a provozem).",
      yieldAfterVacancyOnTac:
        "Výnos po neobsazenosti z celkových pořizovacích nákladů = efektivní hrubý příjem (po neobsazenosti) ÷ (kupní cena + vedlejší náklady + rekonstrukce + rezerva).",
      operatingYieldOnTac:
        "Provozní výnos = provozní výsledek po nákladech vlastníka a před financováním ÷ celkové pořizovací náklady.",
      cashFlow:
        "Měsíční cash flow = provozní výsledek / 12 − anuitní splátka. Před zdaněním.",
      tax: "Všechny metriky jsou před zdaněním.",
    },
    priceAtTargetYieldOnTacCzk,
    targetYieldLabel:
      targetPct != null
        ? `Cílový výnos po neobsazenosti ${targetPct} % z celkových pořizovacích nákladů`
        : null,
    decision: buildDecision(definition, base),
  };
}
