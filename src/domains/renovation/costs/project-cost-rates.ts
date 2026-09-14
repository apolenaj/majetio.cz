/**
 * DEMO DATA ONLY — project-cost rates (% of construction base).
 */

export const DEMO_PROJECT_COST_VERSION = "project-cost.v2026.07-demo";

export type ProjectCostRateBand = {
  low: number;
  base: number;
  high: number;
};

export type ProjectCostRateModel = {
  version: string;
  isDemo: boolean;
  architect: ProjectCostRateBand;
  permits: ProjectCostRateBand;
  supervision: ProjectCostRateBand;
  source: string;
};

export const DEMO_PROJECT_COST_RATES: ProjectCostRateModel = {
  version: DEMO_PROJECT_COST_VERSION,
  isDemo: true,
  architect: { low: 0.03, base: 0.05, high: 0.08 },
  permits: { low: 0.005, base: 0.01, high: 0.02 },
  supervision: { low: 0.02, base: 0.04, high: 0.06 },
  source: "majetio-demo-project-cost — NOT FOR PRODUCTION PRICING",
};

export function getProjectCostRates(version?: string): ProjectCostRateModel {
  if (version && version !== DEMO_PROJECT_COST_VERSION) {
    throw new Error(`Unknown project cost rate version: ${version}`);
  }
  return DEMO_PROJECT_COST_RATES;
}
