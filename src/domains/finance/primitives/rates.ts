/**
 * Typed rate kinds — do not mix nominal interest, APR, and appreciation (11A).
 * Each wraps Percentage (ratio internally) with a distinct nominal type.
 */

import { type Decimal } from "decimal.js";

import { Percentage } from "./percentage";
import { roundRatePercentPointsForDisplay } from "./rounding";

export const RATE_KINDS = [
  "nominal_interest",
  "apr",
  "appreciation",
] as const;

export type RateKind = (typeof RATE_KINDS)[number];

type RateBrand<K extends RateKind> = {
  readonly kind: K;
};

/**
 * Base rate: ratio via Percentage, branded by kind so TypeScript
 * rejects passing APR where nominalInterestRate is required.
 */
export class TypedRate<K extends RateKind> {
  private constructor(
    readonly kind: K,
    private readonly percentage: Percentage,
  ) {}

  static create<K extends RateKind>(
    kind: K,
    percentage: Percentage,
  ): TypedRate<K> & RateBrand<K> {
    return new TypedRate(kind, percentage) as TypedRate<K> & RateBrand<K>;
  }

  static fromPercentPoints<K extends RateKind>(
    kind: K,
    points: Decimal.Value,
  ): TypedRate<K> & RateBrand<K> {
    return TypedRate.create(kind, Percentage.fromPercentPoints(points));
  }

  static fromRatio<K extends RateKind>(
    kind: K,
    ratio: Decimal.Value,
  ): TypedRate<K> & RateBrand<K> {
    return TypedRate.create(kind, Percentage.fromRatio(ratio));
  }

  static fromPercentPointsOrNull<K extends RateKind>(
    kind: K,
    points: Decimal.Value | null | undefined,
  ): (TypedRate<K> & RateBrand<K>) | null {
    if (points == null) return null;
    return TypedRate.fromPercentPoints(kind, points);
  }

  /** Underlying percentage (ratio semantics). */
  asPercentage(): Percentage {
    return this.percentage;
  }

  toRatio(): Decimal {
    return this.percentage.toRatio();
  }

  toPercentPoints(): Decimal {
    return this.percentage.toPercentPoints();
  }

  /** Display percent points (2 dp for rates). */
  toDisplayPercentPoints(): number {
    return roundRatePercentPointsForDisplay(this.toPercentPoints()).toNumber();
  }

  isZero(): boolean {
    return this.percentage.isZero();
  }

  equals(other: TypedRate<K>): boolean {
    return this.kind === other.kind && this.percentage.equals(other.percentage);
  }
}

/** Contractual / nominal interest rate (sazba úroku). */
export type NominalInterestRate = TypedRate<"nominal_interest"> &
  RateBrand<"nominal_interest">;

/** Annual percentage rate / RPSN-style (APR). */
export type AprRate = TypedRate<"apr"> & RateBrand<"apr">;

/** Asset / market appreciation rate. */
export type AppreciationRate = TypedRate<"appreciation"> &
  RateBrand<"appreciation">;

export function nominalInterestRateFromPercentPoints(
  points: Decimal.Value,
): NominalInterestRate {
  return TypedRate.fromPercentPoints("nominal_interest", points);
}

export function nominalInterestRateFromRatio(
  ratio: Decimal.Value,
): NominalInterestRate {
  return TypedRate.fromRatio("nominal_interest", ratio);
}

export function aprFromPercentPoints(points: Decimal.Value): AprRate {
  return TypedRate.fromPercentPoints("apr", points);
}

export function aprFromRatio(ratio: Decimal.Value): AprRate {
  return TypedRate.fromRatio("apr", ratio);
}

export function appreciationRateFromPercentPoints(
  points: Decimal.Value,
): AppreciationRate {
  return TypedRate.fromPercentPoints("appreciation", points);
}

export function appreciationRateFromRatio(
  ratio: Decimal.Value,
): AppreciationRate {
  return TypedRate.fromRatio("appreciation", ratio);
}

/** Validate kind string at boundaries (API later). */
export function assertRateKind(value: string): RateKind {
  if (!(RATE_KINDS as readonly string[]).includes(value)) {
    throw new Error(`Unknown rate kind: ${value}`);
  }
  return value as RateKind;
}
