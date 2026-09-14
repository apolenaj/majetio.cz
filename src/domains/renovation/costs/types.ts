/**
 * Concept C — Costs (náklady / CapEx).
 * Estimates Kč from scope + location rates. Never computes ARV.
 */

import type { RenovationConditionAssessment } from "../condition/types";
import type { RenovationScope } from "../scope/types";

export const COST_CONFIDENCE_LEVELS = [
  "high",
  "medium",
  "low",
  "insufficient",
] as const;

export type CostConfidenceLevel = (typeof COST_CONFIDENCE_LEVELS)[number];

export type CostWarningCode =
  | "hidden_defects_risk"
  | "structure_unknown"
  | "missing_quantity"
  | "catalog_fallback"
  | "partial_condition_data"
  | "demo_catalog"
  | "unpriced_items";

export type CostWarning = {
  code: CostWarningCode;
  severity: "info" | "warning" | "critical";
  message: string;
};

export type PricedRenovationItem = {
  id: string;
  category: import("../scope/types").RenovationCategory;
  scope: string;
  quantity: number | null;
  unit: import("../scope/types").RenovationUnit | null;
  qualityLevel: import("../scope/types").QualityLevel;
  costLow: number | null;
  costBase: number | null;
  costHigh: number | null;
  confidence: number | null;
  source: import("../scope/types").RenovationItemSource;
  catalogEntryId: string | null;
  pricingNotes: string | null;
  costBucket: "construction" | "furnishing";
};

export type ProjectCostLine = {
  code: "architect" | "permits" | "supervision";
  label: string;
  band: import("./bands").CostBand;
};

export type RenovationCostEstimate = {
  /** Direct construction / trade works (excludes furnishing & project costs). */
  construction: import("./bands").CostBand;
  /** Nábytek a vybavení — not construction CapEx but part of total investment. */
  furnishing: import("./bands").CostBand;
  projectCosts: {
    lines: ProjectCostLine[];
    total: import("./bands").CostBand;
  };
  contingency: import("../contingency/types").ContingencyResult;
  /** construction + project costs (before contingency). */
  subtotalBeforeContingency: import("./bands").CostBand;
  /** construction + project + contingency + furnishing. */
  totalInvestment: import("./bands").CostBand;
  confidence: CostConfidenceLevel;
  confidenceScore: number | null;
  warnings: CostWarning[];
  pricedItems: PricedRenovationItem[];
  costModelVersion: string;
  locationCostVersion: string;
  catalogVersion: string;
  catalogIsDemo: boolean;
};

/** @deprecated Use RenovationCostEstimate — kept for transitional consumers. */
export type RenovationCostBand = {
  lowCzk: number | null;
  baseCzk: number | null;
  highCzk: number | null;
  contingencyCzk: number | null;
  costModelVersion: string;
  locationCostVersion: string;
};

export type CostEstimateInput = {
  scope: RenovationScope;
  conditionAssessment?: RenovationConditionAssessment | null;
  location?: {
    city?: string | null;
    region?: string | null;
    publicCity?: string | null;
    publicRegion?: string | null;
  };
  catalogVersion?: string;
  costModelVersion?: string;
  locationCostVersion?: string;
  projectCostVersion?: string;
  contingencyModelVersion?: string;
  /** Default quantity hints when scope items lack quantity. */
  propertyAreaSqm?: number | null;
};

export type CostsService = {
  estimate(input: CostEstimateInput): Promise<RenovationCostEstimate>;
  /** Legacy narrow API for scaffold compatibility. */
  estimateLegacy(input: {
    scopeVersion: string;
    costModelVersion?: string;
    locationCostVersion?: string;
    propertyId: string;
  }): Promise<RenovationCostBand>;
};
