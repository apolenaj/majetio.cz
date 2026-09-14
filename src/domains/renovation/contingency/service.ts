import { calculateContingency } from "./calculate";
import type {
  ContingencyEstimateInput,
  ContingencyResult,
  ContingencyService,
} from "./types";

export function createContingencyService(): ContingencyService {
  return {
    async estimate(input: ContingencyEstimateInput): Promise<ContingencyResult> {
      return calculateContingency(input);
    },
  };
}
