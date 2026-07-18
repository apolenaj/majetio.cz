import { PropertyType } from "@prisma/client";

import {
  CZECH_REGIONS,
  FINANCING_OPTIONS,
  INVESTMENT_STRATEGY_OPTIONS,
  ONBOARDING_GOALS,
  PROPERTY_TYPE_OPTIONS,
  type FinancingModeId,
  type OnboardingGoalId,
} from "@/lib/onboarding/types";

export {
  CZECH_REGIONS,
  FINANCING_OPTIONS,
  INVESTMENT_STRATEGY_OPTIONS,
  ONBOARDING_GOALS,
  PROPERTY_TYPE_OPTIONS,
};
export type { FinancingModeId, OnboardingGoalId };

export const RISK_TOLERANCE_OPTIONS = [
  {
    id: "CONSERVATIVE",
    label: "Konzervativní",
    description: "Preferujete stabilitu a nižší riziko před maximálním výnosem.",
  },
  {
    id: "BALANCED",
    label: "Vyvážený",
    description: "Vyvážený poměr rizika a očekávaného výnosu.",
  },
  {
    id: "DYNAMIC",
    label: "Dynamický",
    description: "Jste ochotni přijmout vyšší volatilitu za potenciálně vyšší výnos.",
  },
] as const;

export type RiskToleranceId = (typeof RISK_TOLERANCE_OPTIONS)[number]["id"];

export const DISPOSITION_OPTIONS = [
  "1+kk",
  "1+1",
  "2+kk",
  "2+1",
  "3+kk",
  "3+1",
  "4+kk",
  "4+1",
  "5 a více",
] as const;

export type PassportTimestamps = {
  profile: string | null;
  financial: string | null;
  property: string | null;
  investment: string | null;
};

export type PassportState = {
  goal: OnboardingGoalId | null;
  maxPriceCzk: number | null;
  availableEquityCzk: number | null;
  equityPercent: number | null;
  financingMode: FinancingModeId | null;
  monthlyIncomeCzk: number | null;
  monthlyLiabilitiesCzk: number | null;
  riskTolerance: RiskToleranceId | null;
  strategies: string[];
  targetGrossYieldPct: number | null;
  targetCashFlowMonthlyCzk: number | null;
  preferredCity: string;
  regions: string[];
  propertyTypes: PropertyType[];
  dispositions: string[];
  minAreaSqm: number | null;
  maxAreaSqm: number | null;
  timestamps: PassportTimestamps;
};

export type PassportCompletionLevel =
  | "empty"
  | "basic"
  | "extended"
  | "ready";

export type PassportProgress = {
  level: PassportCompletionLevel;
  label: string;
  description: string;
  percent: number;
  filledSections: number;
  totalSections: number;
  sections: {
    id: string;
    letter: string;
    title: string;
    filled: boolean;
  }[];
};

export type PassportRecommendation = {
  id: string;
  tone: "info" | "warning";
  title: string;
  body: string;
  /** Always true for rule-based hints — never a hard decision. */
  indicative: true;
};

export function emptyPassportState(): PassportState {
  return {
    goal: null,
    maxPriceCzk: null,
    availableEquityCzk: null,
    equityPercent: null,
    financingMode: null,
    monthlyIncomeCzk: null,
    monthlyLiabilitiesCzk: null,
    riskTolerance: null,
    strategies: [],
    targetGrossYieldPct: null,
    targetCashFlowMonthlyCzk: null,
    preferredCity: "",
    regions: [],
    propertyTypes: [],
    dispositions: [],
    minAreaSqm: null,
    maxAreaSqm: null,
    timestamps: {
      profile: null,
      financial: null,
      property: null,
      investment: null,
    },
  };
}

export function latestPassportTimestamp(timestamps: PassportTimestamps): string | null {
  const values = [
    timestamps.profile,
    timestamps.financial,
    timestamps.property,
    timestamps.investment,
  ]
    .filter((v): v is string => Boolean(v))
    .map((v) => new Date(v).getTime())
    .filter((t) => Number.isFinite(t));
  if (values.length === 0) return null;
  return new Date(Math.max(...values)).toISOString();
}

export function goalLabel(goal: OnboardingGoalId | null): string {
  return ONBOARDING_GOALS.find((g) => g.id === goal)?.label ?? "—";
}

export function riskLabel(risk: RiskToleranceId | null): string {
  return RISK_TOLERANCE_OPTIONS.find((r) => r.id === risk)?.label ?? "—";
}

export function financingLabel(mode: FinancingModeId | null): string {
  return FINANCING_OPTIONS.find((f) => f.id === mode)?.label ?? "—";
}
