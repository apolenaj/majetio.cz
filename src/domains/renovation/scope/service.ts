import { inferScopeFromCondition } from "./infer";
import { applyUserScopeOverrides } from "./overrides";
import type {
  ScopeResolveInput,
  ScopeService,
  ScopeUserOverrideInput,
} from "./types";

export function createScopeService(): ScopeService {
  return {
    async resolve(input: ScopeResolveInput) {
      return inferScopeFromCondition({
        propertyId: input.propertyId,
        usableArea: input.usableArea,
        floorArea: input.floorArea,
        roomsCount: input.roomsCount,
        bathroomsCount: input.bathroomsCount,
        conditionAssessment: input.conditionAssessment,
        standardOverride: input.standardOverride,
      });
    },
    applyUserOverrides(input: ScopeUserOverrideInput) {
      return applyUserScopeOverrides(input);
    },
  };
}
