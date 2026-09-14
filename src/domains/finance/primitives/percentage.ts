/**
 * Percentage — internal representation is a ratio (Prompt 11A Phase 1).
 * Example: 5.4 % → ratio 0.054 (never store “5.4” as the engine value).
 */

import { Decimal } from "decimal.js";

import { Money } from "./money";
import {
  roundInternal,
  roundPercentPointsForDisplay,
  toDecimal,
} from "./rounding";

export class Percentage {
  private constructor(private readonly ratio: Decimal) {}

  /** From human percent points (5.4 → 0.054). */
  static fromPercentPoints(points: Decimal.Value): Percentage {
    const p = toDecimal(points, "percent points");
    return new Percentage(roundInternal(p.div(100)));
  }

  /** From ratio already in 0–1 (or beyond for growth factors). */
  static fromRatio(ratio: Decimal.Value): Percentage {
    return new Percentage(roundInternal(toDecimal(ratio, "ratio")));
  }

  static zero(): Percentage {
    return Percentage.fromRatio(0);
  }

  /**
   * Optional percent points → Percentage | null.
   * `null`/`undefined` = missing; `0` = zero rate.
   */
  static fromPercentPointsOrNull(
    points: Decimal.Value | null | undefined,
  ): Percentage | null {
    if (points == null) return null;
    return Percentage.fromPercentPoints(points);
  }

  toRatio(): Decimal {
    return this.ratio;
  }

  toRatioNumber(): number {
    return this.ratio.toNumber();
  }

  /** Percent points (5.4 for 5.4 %). */
  toPercentPoints(): Decimal {
    return this.ratio.mul(100);
  }

  toPercentPointsNumber(): number {
    return roundPercentPointsForDisplay(this.toPercentPoints()).toNumber();
  }

  isZero(): boolean {
    return this.ratio.isZero();
  }

  equals(other: Percentage): boolean {
    return this.ratio.eq(other.ratio);
  }

  add(other: Percentage): Percentage {
    return new Percentage(roundInternal(this.ratio.plus(other.ratio)));
  }

  sub(other: Percentage): Percentage {
    return new Percentage(roundInternal(this.ratio.minus(other.ratio)));
  }

  /** Apply this percentage to a Money amount (e.g. 5.4 % of price). */
  of(money: Money): Money {
    return money.mulRatio(this.ratio);
  }

  /** Display-rounded percent points as Decimal. */
  roundForDisplay(): Decimal {
    return roundPercentPointsForDisplay(this.toPercentPoints());
  }
}

export function isMissingPercentage(
  value: Percentage | null | undefined,
): value is null | undefined {
  return value == null;
}

export function isZeroPercentage(value: Percentage | null | undefined): boolean {
  return value != null && value.isZero();
}
