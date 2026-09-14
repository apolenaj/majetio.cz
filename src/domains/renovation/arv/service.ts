import { estimateArv, computeRenovationOutcome } from "./pipeline";
import type { ArvEstimateInput, ArvService, FullRenovationOutcomeInput } from "./types";

export function createArvService(): ArvService {
  return {
    async estimate(input: ArvEstimateInput) {
      return estimateArv(input);
    },
  };
}

export { computeRenovationOutcome, estimateArv };
