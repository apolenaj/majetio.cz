export {
  SCENARIO_KINDS,
  type ScenarioKind,
  type ScenarioGrowthAssumptions,
  type ScenarioLoanAssumptions,
  type ScenarioReturnsBundle,
  type ScenarioBaseResult,
  type LongTermRentalScenarioResult,
  type CashPurchaseScenarioResult,
  type ShortTermRentalScenarioResult,
  type FlipScenarioResult,
  type RenovationRentScenarioResult,
  type AnyScenarioResult,
} from "./types";

export {
  calculateLongTermRentalScenario,
  type LongTermRentalScenarioInput,
} from "./long-term-rental";

export {
  calculateCashPurchaseScenario,
  type CashPurchaseScenarioInput,
} from "./cash-purchase";

export {
  calculateSeasonalGrossIncome,
  calculateShortTermRentalScenario,
  type SeasonalMonthInput,
  type ShortTermRentalScenarioInput,
} from "./short-term-rental";

export {
  calculateFlipScenario,
  type FlipScenarioInput,
} from "./flip";

export {
  calculateRenovationRentScenario,
  type RenovationRentScenarioInput,
} from "./renovation-rent";
