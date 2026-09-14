/**
 * Map UI strategy / scenario type → engine calculation intent (Part 2/C).
 */

import {
  calculationIntentSchema,
  type CalculationIntent,
} from "../engine/validation";

import type { AnalysisScenarioTypeCode } from "./types";

export type StrategyIntentInput =
  | "long_term_rental"
  | "owner_occupier"
  | "flip"
  | (string & {});

/** Calculator strategy → intent for rent N/A vs insufficient. */
export function intentFromStrategy(
  strategy: StrategyIntentInput | null | undefined,
): CalculationIntent {
  if (strategy === "owner_occupier") return "own_use";
  if (strategy === "flip") return "flip";
  return "rental_investment";
}

export function intentFromScenarioType(
  scenarioType: AnalysisScenarioTypeCode,
): CalculationIntent {
  switch (scenarioType) {
    case "CASH_PURCHASE":
      return "own_use";
    case "FLIP":
      return "flip";
    case "LONG_TERM_RENTAL":
    case "SHORT_TERM_RENTAL":
    case "RENOVATION_RENT":
    case "BASE_METRICS":
    default:
      return "rental_investment";
  }
}

export function parseCalculationIntent(raw: unknown): CalculationIntent {
  const parsed = calculationIntentSchema.safeParse(raw);
  return parsed.success ? parsed.data : "rental_investment";
}
