import { clamp } from "./common";
import type { PropertyInvestmentInput, ScenarioId } from "./types";

export type ScenarioDelta = {
  id: ScenarioId;
  label: string;
  rentFactor: number;
  vacancyAddPp: number;
  opexFactor: number;
  rateAddPp: number;
  note: string;
};

/** Central, explicit scenario shifts — not hidden magic. */
export const SCENARIO_DELTAS: Record<ScenarioId, ScenarioDelta> = {
  adverse: {
    id: "adverse",
    label: "Nepříznivý",
    rentFactor: 0.92,
    vacancyAddPp: 3,
    opexFactor: 1.12,
    rateAddPp: 0.5,
    note: "Nájem −8 %, vacancy +3 p. b., náklady +12 %, sazba +0,5 p. b.",
  },
  base: {
    id: "base",
    label: "Základní",
    rentFactor: 1,
    vacancyAddPp: 0,
    opexFactor: 1,
    rateAddPp: 0,
    note: "Přesně zadané hodnoty.",
  },
  favorable: {
    id: "favorable",
    label: "Příznivý",
    rentFactor: 1.04,
    vacancyAddPp: -2,
    opexFactor: 0.95,
    rateAddPp: -0.25,
    note: "Nájem +4 %, vacancy −2 p. b., náklady −5 %, sazba −0,25 p. b.",
  },
};

export type ScenarioOverrides = Partial<
  Pick<
    PropertyInvestmentInput,
    "monthlyRent" | "vacancyRate" | "monthlyOperatingLump" | "annualInterestRate"
  >
>;

export function applyScenario(
  input: PropertyInvestmentInput,
  scenario: ScenarioId,
  custom?: ScenarioOverrides | null,
): PropertyInvestmentInput {
  const delta = SCENARIO_DELTAS[scenario];
  const next: PropertyInvestmentInput = {
    ...input,
    monthlyRent: input.monthlyRent * delta.rentFactor,
    vacancyRate: clamp(input.vacancyRate + delta.vacancyAddPp, 0, 100),
    monthlyOperatingLump: input.monthlyOperatingLump * delta.opexFactor,
    monthlyHOA: input.monthlyHOA * delta.opexFactor,
    maintenanceMonthly: input.maintenanceMonthly * delta.opexFactor,
    insuranceMonthly: input.insuranceMonthly * delta.opexFactor,
    managementMonthly: input.managementMonthly * delta.opexFactor,
    otherOperatingMonthly: input.otherOperatingMonthly * delta.opexFactor,
    annualPropertyTax: input.annualPropertyTax * delta.opexFactor,
    annualOtherCosts: input.annualOtherCosts * delta.opexFactor,
    annualInterestRate: Math.max(0, input.annualInterestRate + delta.rateAddPp),
  };
  if (!custom) return next;
  return { ...next, ...custom };
}
