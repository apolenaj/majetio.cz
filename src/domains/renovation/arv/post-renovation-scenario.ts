/**
 * Post-renovation scenario — condition, rent, value, improvements.
 */

import type { PropertyCondition } from "../condition/types";
import type { RenovationScope, RenovationStandard } from "../scope/types";
import type { PostRenovationPropertyScenario, ValueBand } from "./types";

const CONDITION_RANK: Record<PropertyCondition, number> = {
  NEW: 6,
  EXCELLENT: 5,
  GOOD: 4,
  AVERAGE: 3,
  NEEDS_RENOVATION: 2,
  SHELL: 1,
  UNKNOWN: 3,
};

/** Target condition after renovation by scope standard. */
const CONDITION_AFTER_BY_STANDARD: Record<RenovationStandard, PropertyCondition> =
  {
    cosmetic: "GOOD",
    light: "GOOD",
    medium: "GOOD",
    full: "EXCELLENT",
    premium: "EXCELLENT",
    custom: "GOOD",
  };

/** DEMO — monthly rent uplift per condition rank step (+4 % / rank). */
const RENT_UPLIFT_PER_RANK = 0.04;

function maxCondition(
  before: PropertyCondition,
  afterStandard: PropertyCondition,
): PropertyCondition {
  const beforeRank = CONDITION_RANK[before];
  const afterRank = CONDITION_RANK[afterStandard];
  if (afterRank <= beforeRank) {
    return before;
  }
  return afterStandard;
}

function improvementsFromScope(scope: RenovationScope): string[] {
  return scope.items.map((item) => item.scope);
}

function estimateRentAfter(
  monthlyRentBefore: number | null | undefined,
  conditionBefore: PropertyCondition,
  conditionAfter: PropertyCondition,
): ValueBand | null {
  if (monthlyRentBefore == null || monthlyRentBefore <= 0) {
    return null;
  }

  const rankDelta =
    CONDITION_RANK[conditionAfter] - CONDITION_RANK[conditionBefore];
  const upliftRatio = 1 + Math.max(0, rankDelta) * RENT_UPLIFT_PER_RANK;
  const base = Math.round(monthlyRentBefore * upliftRatio);

  return {
    lowCzk: Math.round(base * 0.95),
    baseCzk: base,
    highCzk: Math.round(base * 1.08),
  };
}

export function buildPostRenovationScenario(input: {
  scope: RenovationScope;
  conditionBefore: PropertyCondition;
  valueAfter: ValueBand;
  monthlyRentBeforeCzk?: number | null;
}): PostRenovationPropertyScenario {
  const target = CONDITION_AFTER_BY_STANDARD[input.scope.standard];
  const conditionAfter = maxCondition(input.conditionBefore, target);

  return {
    conditionAfter,
    expectedRentAfter: estimateRentAfter(
      input.monthlyRentBeforeCzk,
      input.conditionBefore,
      conditionAfter,
    ),
    expectedValueAfter: input.valueAfter,
    improvements: improvementsFromScope(input.scope),
  };
}

export function conditionAfterForScope(
  scope: RenovationScope,
  conditionBefore: PropertyCondition,
): PropertyCondition {
  return maxCondition(
    conditionBefore,
    CONDITION_AFTER_BY_STANDARD[scope.standard],
  );
}
