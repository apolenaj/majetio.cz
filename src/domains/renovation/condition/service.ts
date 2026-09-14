import { assessCondition } from "./assess";
import type {
  ConditionPropertyInput,
  ConditionService,
  RenovationConditionAssessment,
} from "./types";

export function createConditionService(): ConditionService {
  return {
    async assess(
      input: ConditionPropertyInput,
    ): Promise<RenovationConditionAssessment> {
      return assessCondition(input);
    },
  };
}
