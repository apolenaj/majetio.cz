/**
 * Renovation Flip Engine — integrates purchase, CapEx, holding, ARV, exit.
 * Concept D resale value consumed separately from cost (C).
 */

import type { CostBand } from "../costs/bands";

export const FLIP_ENGINE_VERSION = "flip.v2026.07";

export type FlipCostBand = CostBand;

export type RenovationFlipInput = {
  purchasePriceCzk: number;
  /** Acquisition + fees as absolute or derived via rates in engine. */
  acquisitionCostsCzk?: number;
  feesCzk?: number;
  renovationCost: FlipCostBand;
  holdingCosts: FlipCostBand;
  /** Resale / ARV band after renovation. */
  resaleValue: FlipCostBand;
  holdMonths: number;
  sellingCostRatePct?: number;
  loanPrincipalCzk?: number | null;
  nominalInterestRatePp?: number;
  termYears?: number;
};

export type RenovationFlipMetrics = {
  grossProfit: FlipCostBand;
  profitBeforeTax: FlipCostBand;
  marginOnTotalCostPct: FlipCostBand;
  marginOnSalePct: FlipCostBand;
  annualizedReturnPct: FlipCostBand;
  irrPct: FlipCostBand | null;
  breakEvenSalePriceCzk: number;
  totalProjectCost: FlipCostBand;
  equityRequiredCzk: number;
  netSaleProceeds: FlipCostBand;
};

export type RenovationFlipResult = {
  metrics: RenovationFlipMetrics;
  holdMonths: number;
  flipEngineVersion: string;
};
