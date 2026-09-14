/**
 * Merge property snapshot + assumption overrides → engine input (or blocking gaps).
 */

import {
  type InvestmentCalculationInput,
  moneyMinorDtoSchema,
  type CalculationIntent,
  type ResultWarning,
} from "../engine";
import type { AssumptionSet } from "./assumptions";
import type { PropertyInvestmentSnapshot } from "./property-snapshot";
import type { CalculationIssue, MergedEngineInput } from "./types";

function pickMoney(
  override: AssumptionSet[keyof AssumptionSet],
  fallback: InvestmentCalculationInput["acquisition"]["purchasePrice"] | null,
): typeof fallback {
  if (override !== undefined) {
    return override as typeof fallback;
  }
  return fallback;
}

/**
 * Build InvestmentCalculationInput. Missing purchase price blocks the run
 * (cannot invent 0 Kč). Other gaps become warnings + partial metrics later.
 */
export function mergeSnapshotWithAssumptions(
  snapshot: PropertyInvestmentSnapshot,
  assumptions: AssumptionSet = {},
  options?: { intent?: CalculationIntent },
): MergedEngineInput {
  const warnings: string[] = [];
  const blockingReasons: string[] = [];
  const resultWarnings: ResultWarning[] = [];
  const issues: CalculationIssue[] = [];
  const intent = options?.intent ?? "rental_investment";

  const purchasePrice =
    assumptions.purchasePrice !== undefined
      ? assumptions.purchasePrice
      : snapshot.purchasePriceHint;

  if (purchasePrice == null) {
    blockingReasons.push(
      "Chybí kupní / nabídková cena — výpočet nelze spustit",
    );
    issues.push({
      category: "insufficient_data",
      code: "missing_purchase_price",
      message: "Chybí kupní / nabídková cena — výpočet nelze spustit",
      field: "purchasePrice",
    });
  }

  const rentMissing =
    assumptions.monthlyRent === undefined &&
    assumptions.annualRent === undefined;

  if (rentMissing && intent === "rental_investment") {
    warnings.push("Chybí údaj o nájmu — výnosové metriky nebudou k dispozici");
  } else if (
    assumptions.monthlyRent === null &&
    assumptions.annualRent === null &&
    intent === "rental_investment"
  ) {
    warnings.push("Nájem není k dispozici (null) — výnosové metriky nebudou k dispozici");
  }

  const hasOpex =
    assumptions.annualOperatingCosts != null ||
    assumptions.monthlyOperatingCosts != null;
  if (!hasOpex) {
    warnings.push(
      "Chybí údaj o provozních nákladech (opex) — NOI a čistý výnos budou omezené",
    );
  }

  if (assumptions.repairFundAnnual === undefined) {
    warnings.push("Chybí údaj o fondu oprav");
  } else if (assumptions.repairFundAnnual === null) {
    warnings.push("Fond oprav není zadán");
  }

  if (blockingReasons.length > 0 || purchasePrice == null) {
    return { input: null, warnings, blockingReasons, resultWarnings, issues };
  }
  const parsedPrice = moneyMinorDtoSchema.parse(purchasePrice);

  const input: InvestmentCalculationInput = {
    schemaVersion: "1.0.0",
    property: {
      propertyId: snapshot.propertyId,
      usableAreaSqm: snapshot.usableAreaSqm,
      currency: snapshot.currency,
    },
    acquisition: {
      purchasePrice: parsedPrice,
      acquisitionCosts: pickMoney(assumptions.acquisitionCosts, null),
      renovation: pickMoney(assumptions.renovation, null),
      initialFurnishing: pickMoney(assumptions.initialFurnishing, null),
      fees: pickMoney(assumptions.fees, null),
    },
    yieldBase: "total_acquisition_cost",
    incomeExpense: {
      monthlyRent:
        assumptions.monthlyRent !== undefined ? assumptions.monthlyRent : null,
      annualRent:
        assumptions.annualRent !== undefined ? assumptions.annualRent : null,
      monthlyOperatingCosts:
        assumptions.monthlyOperatingCosts !== undefined
          ? assumptions.monthlyOperatingCosts
          : null,
      annualOperatingCosts:
        assumptions.annualOperatingCosts !== undefined
          ? assumptions.annualOperatingCosts
          : null,
      vacancyRate:
        assumptions.vacancyRate !== undefined ? assumptions.vacancyRate : null,
    },
    financing: {
      loanAmount:
        assumptions.loanAmount !== undefined ? assumptions.loanAmount : null,
      nominalInterestRate:
        assumptions.nominalInterestRate !== undefined
          ? assumptions.nominalInterestRate
          : null,
      apr: assumptions.apr !== undefined ? assumptions.apr : null,
      termYears:
        assumptions.termYears !== undefined ? assumptions.termYears : null,
      monthlyDebtService: null,
    },
    market: {
      appreciationRate:
        assumptions.appreciationRate !== undefined
          ? assumptions.appreciationRate
          : null,
      rentGrowthRate:
        assumptions.rentGrowthRate !== undefined
          ? assumptions.rentGrowthRate
          : null,
    },
    horizon: {
      holdYears: assumptions.holdYears ?? 10,
    },
    askingPrice: snapshot.askingPrice,
  };

  return { input, warnings, blockingReasons, resultWarnings, issues };
}
