/**
 * Concept D — After Repair Value (hodnota po rekonstrukci).
 * Market value post-works. Must not equal cost + purchase or invent margin.
 */

import type { PropertyCondition } from "../condition/types";
import type { CostBand } from "../costs/bands";
import type { RenovationScope } from "../scope/types";
import type {
  ComparableCandidate,
  ValuationSubject,
} from "@/domains/valuation/service/types";

export const ARV_MODEL_VERSION = "arv.v2026.07";

export type ValueBand = CostBand;

export type ArvConfidenceLevel =
  | "high"
  | "medium"
  | "low"
  | "insufficient";

/** Post-renovation property state for valuation & rent modelling. */
export type PostRenovationPropertyScenario = {
  conditionAfter: PropertyCondition;
  expectedRentAfter: ValueBand | null;
  expectedValueAfter: ValueBand;
  improvements: string[];
};

export type ArvEstimate = {
  arvLowCzk: number | null;
  arvBaseCzk: number | null;
  arvHighCzk: number | null;
  arvModelVersion: string;
  confidence: number | null;
  confidenceLevel: ArvConfidenceLevel;
  valuationStatus: string;
  postRenovation: PostRenovationPropertyScenario;
  /** Value before renovation (same valuation engine). */
  valueBefore: ValueBand | null;
};

export type OverImprovementRisk = {
  detected: boolean;
  severity: "none" | "moderate" | "high";
  message: string;
  renovationCostBaseCzk: number;
  valueUpliftBaseCzk: number;
};

export type YieldSnapshot = {
  grossYieldPct: number | null;
  netYieldPct: number | null;
};

export type RenovationEconomics = {
  totalInvestedCapital: ValueBand;
  renovationCost: ValueBand;
  holdingCosts: ValueBand;
  purchasePriceCzk: number;
  valueUplift: ValueBand;
  valueCreation: ValueBand;
  roi: ValueBand | null;
  yieldBefore: YieldSnapshot;
  yieldAfter: YieldSnapshot;
  overImprovementRisk: OverImprovementRisk;
};

export type ArvEstimateInput = {
  subject: ValuationSubject;
  candidates: ComparableCandidate[];
  scope: RenovationScope;
  conditionBefore: PropertyCondition;
  /** Monthly rent before renovation (for uplift model). */
  monthlyRentBeforeCzk?: number | null;
  /** Annual opex for net yield (CZK major). */
  annualOpexCzk?: number | null;
};

export type FullRenovationOutcomeInput = ArvEstimateInput & {
  purchasePriceCzk: number;
  renovationCost: ValueBand;
  holdingCosts: ValueBand;
};

export type ArvService = {
  estimate(input: ArvEstimateInput): Promise<ArvEstimate>;
};

export type RenovationOutcome = {
  arv: ArvEstimate;
  economics: RenovationEconomics;
};
