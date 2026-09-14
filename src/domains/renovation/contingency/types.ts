/**
 * Contingency — dynamic reserve on CapEx (Concept C support).
 * Never used as ARV padding.
 */

import type { CostBand } from "../costs/bands";
import type { CostWarning } from "../costs/types";

export const CONTINGENCY_MODEL_VERSION = "contingency.v2026.07";

export type ContingencyRiskFactor = {
  code: string;
  label: string;
  rateDelta: number;
};

export type ContingencyResult = {
  band: CostBand;
  /** Effective rate applied to construction base (base scenario). */
  rateRatio: number;
  riskFactors: ContingencyRiskFactor[];
  warnings: CostWarning[];
  contingencyModelVersion: string;
  modelIsDemo: boolean;
};

export type ContingencyEstimate = {
  amountCzk: number | null;
  rateRatio: number | null;
  contingencyModelVersion: string;
};

export type ContingencyService = {
  estimate(input: ContingencyEstimateInput): Promise<ContingencyResult>;
};

export type ContingencyEstimateInput = {
  constructionBase: CostBand;
  subtotalBeforeContingency?: CostBand;
  conditionAssessment?: import("../condition/types").RenovationConditionAssessment | null;
  scope?: import("../scope/types").RenovationScope;
  modelVersion?: string;
};
