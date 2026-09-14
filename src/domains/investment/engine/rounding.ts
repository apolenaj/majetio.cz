/**
 * Investment engine rounding façade — delegates to central finance policy.
 */

export {
  ROUNDING_POLICY,
  DECIMAL_CONFIG,
  roundInternal,
  roundMoneyMajorForDisplay,
  roundPercentPointsForDisplay,
  roundRatePercentPointsForDisplay,
  toDecimal,
} from "@/domains/finance";

import { type Money, type Percentage, ROUNDING_POLICY } from "@/domains/finance";

import type { MoneyMinorDto } from "./money";
import { moneyToDto } from "./money";
import type { PercentageRatioDto } from "./percentage";
import { percentageToDto } from "./percentage";

/** Snap Money to currency minor units before leaving the engine toward UI. */
export function roundMoneyForUi(money: Money): Money {
  return money.roundForDisplay();
}

export function roundMoneyDtoForUi(money: Money): MoneyMinorDto {
  return moneyToDto(roundMoneyForUi(money));
}

/** Percent points for UI labels (1 dp by policy). */
export function percentPointsForUi(percentage: Percentage): number {
  return percentage.toPercentPointsNumber();
}

export function percentageDtoForUi(
  percentage: Percentage,
): PercentageRatioDto {
  // Keep ratio canonical; UI may format via percentPointsForUi
  return percentageToDto(percentage);
}

export function describeRoundingPolicy(): {
  internalDecimalPlaces: number;
  moneyDisplay: string;
  percentDisplayDecimalPlaces: number;
  rateDisplayDecimalPlaces: number;
} {
  return {
    internalDecimalPlaces: ROUNDING_POLICY.internal.decimalPlaces,
    moneyDisplay: "currency minor units, ROUND_HALF_UP",
    percentDisplayDecimalPlaces: ROUNDING_POLICY.percentDisplay.decimalPlaces,
    rateDisplayDecimalPlaces: ROUNDING_POLICY.rateDisplay.decimalPlaces,
  };
}
