import { estimateRenovationCosts, COST_MODEL_VERSION } from "./estimate";
import type {
  CostEstimateInput,
  CostsService,
  RenovationCostBand,
  RenovationCostEstimate,
} from "./types";

export function createCostsService(): CostsService {
  return {
    async estimate(input: CostEstimateInput): Promise<RenovationCostEstimate> {
      return estimateRenovationCosts(input);
    },
    async estimateLegacy(input: {
      scopeVersion: string;
      costModelVersion?: string;
      locationCostVersion?: string;
      propertyId: string;
    }): Promise<RenovationCostBand> {
      return {
        lowCzk: null,
        baseCzk: null,
        highCzk: null,
        contingencyCzk: null,
        costModelVersion: input.costModelVersion ?? COST_MODEL_VERSION,
        locationCostVersion:
          input.locationCostVersion ?? "location-cost.v2026.07-demo",
      };
    },
  };
}
