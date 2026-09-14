/**
 * Baseline (Majetio) estimates vs editable calculator inputs.
 */

import { resolveAssumptionDefaults } from "@/config/investment-assumptions";
import { buildInputsFromAssumptionConfig } from "../scenarios/apply-variant";
import type { InvestmentCalculatorInputs } from "./calculator-inputs";
import type { UiProvenanceSource } from "./strategy";

/** Fields that participate in override / reset (exclude mode). */
export const OVERRIDABLE_FIELDS = [
  "purchasePrice",
  "equity",
  "loanAmount",
  "interestRatePp",
  "termYears",
  "monthlyRent",
  "vacancyPp",
  "annualOpex",
  "acquisitionCosts",
  "renovation",
  "initialFurnishing",
  "fees",
  "repairFundAnnual",
  "appreciationPp",
  "rentGrowthPp",
  "expenseInflationPp",
  "sellingCostPp",
  "holdYears",
] as const satisfies ReadonlyArray<keyof InvestmentCalculatorInputs>;

export type OverridableField = (typeof OVERRIDABLE_FIELDS)[number];

export type AssumptionCategory =
  | "income"
  | "opex"
  | "financing"
  | "growth"
  | "exit"
  | "renovation";

export const ASSUMPTION_CATEGORY_LABELS: Record<AssumptionCategory, string> = {
  income: "Příjmy",
  opex: "Provozní náklady",
  financing: "Financování",
  growth: "Růst",
  exit: "Exit",
  renovation: "Rekonstrukce",
};

export const ASSUMPTION_FIELDS_BY_CATEGORY: Record<
  AssumptionCategory,
  readonly OverridableField[]
> = {
  income: ["monthlyRent", "vacancyPp"],
  opex: ["annualOpex", "repairFundAnnual", "fees"],
  financing: [
    "purchasePrice",
    "equity",
    "loanAmount",
    "interestRatePp",
    "termYears",
  ],
  growth: ["appreciationPp", "rentGrowthPp", "expenseInflationPp", "holdYears"],
  exit: ["sellingCostPp"],
  renovation: ["renovation", "initialFurnishing", "acquisitionCosts"],
};

export const FIELD_LABELS: Record<OverridableField, string> = {
  purchasePrice: "Kupní cena",
  equity: "Vlastní kapitál",
  loanAmount: "Výše úvěru",
  interestRatePp: "Nominální úrok",
  termYears: "Splatnost",
  monthlyRent: "Měsíční nájem",
  vacancyPp: "Neobsazenost",
  annualOpex: "Roční provozní náklady",
  acquisitionCosts: "Náklady na pořízení",
  renovation: "Rekonstrukce",
  initialFurnishing: "Vybavení",
  fees: "Poplatky",
  repairFundAnnual: "Fond oprav (ročně)",
  appreciationPp: "Růst hodnoty",
  rentGrowthPp: "Růst nájmu",
  expenseInflationPp: "Inflace nákladů",
  sellingCostPp: "Náklady prodeje",
  holdYears: "Horizont držby",
};

/** Demo listing anchors (not assumption magic numbers — price/rent from offer). */
const DEMO_PURCHASE_PRICE = 6_250_000;
const DEMO_MONTHLY_RENT = 24_000;

const fromConfig = buildInputsFromAssumptionConfig({
  purchasePrice: DEMO_PURCHASE_PRICE,
  monthlyRentHint: DEMO_MONTHLY_RENT,
  strategy: "long_term_rental",
});

/** Majetio baseline estimates shown as “Odhad Majetio” — values from assumption config. */
export const MAJETIO_BASELINE: Pick<
  InvestmentCalculatorInputs,
  OverridableField
> = {
  purchasePrice: DEMO_PURCHASE_PRICE,
  equity: fromConfig.equity,
  loanAmount: null,
  interestRatePp: fromConfig.interestRatePp,
  termYears: fromConfig.termYears,
  monthlyRent: DEMO_MONTHLY_RENT,
  vacancyPp: fromConfig.vacancyPp,
  annualOpex: fromConfig.annualOpex,
  acquisitionCosts: fromConfig.acquisitionCosts,
  renovation: null,
  initialFurnishing: null,
  fees: fromConfig.fees,
  repairFundAnnual: fromConfig.repairFundAnnual,
  appreciationPp: fromConfig.appreciationPp,
  rentGrowthPp: fromConfig.rentGrowthPp,
  expenseInflationPp: fromConfig.expenseInflationPp,
  sellingCostPp: fromConfig.sellingCostPp,
  holdYears: fromConfig.holdYears,
};

export const CURRENT_ASSUMPTION_CONFIG_VERSION =
  resolveAssumptionDefaults().versionKey;

/** Default provenance before user edits. */
export const BASELINE_PROVENANCE: Record<OverridableField, UiProvenanceSource> =
  {
    purchasePrice: "listing",
    equity: "default",
    loanAmount: "default",
    interestRatePp: "hypotekajasne",
    termYears: "default",
    monthlyRent: "majetio_estimate",
    vacancyPp: "majetio_estimate",
    annualOpex: "majetio_estimate",
    acquisitionCosts: "majetio_estimate",
    renovation: "default",
    initialFurnishing: "default",
    fees: "majetio_estimate",
    repairFundAnnual: "majetio_estimate",
    appreciationPp: "majetio_estimate",
    rentGrowthPp: "majetio_estimate",
    expenseInflationPp: "default",
    sellingCostPp: "default",
    holdYears: "default",
  };

export function isFieldModified(
  field: OverridableField,
  current: InvestmentCalculatorInputs,
  baseline: Pick<InvestmentCalculatorInputs, OverridableField> = MAJETIO_BASELINE,
): boolean {
  const a = current[field];
  const b = baseline[field];
  if (a == null && b == null) return false;
  if (a == null || b == null) return true;
  return a !== b;
}

export function listModifiedFields(
  current: InvestmentCalculatorInputs,
  baseline: Pick<InvestmentCalculatorInputs, OverridableField> = MAJETIO_BASELINE,
): OverridableField[] {
  return OVERRIDABLE_FIELDS.filter((f) => isFieldModified(f, current, baseline));
}

export function resetInputsToBaseline(
  current: InvestmentCalculatorInputs,
  baseline: Pick<InvestmentCalculatorInputs, OverridableField> = MAJETIO_BASELINE,
): InvestmentCalculatorInputs {
  return {
    ...current,
    ...baseline,
  };
}
