/**
 * Money — currency-tagged immutable amount (Prompt 11A Phase 1).
 * Backed by decimal.js — never use IEEE floats for CZK/EUR arithmetic.
 */

import { Decimal } from "decimal.js";

import {
  assertCurrencyCode,
  currencyMinorDigits,
  currencyScaleFactor,
  type CurrencyCode,
} from "./currency";
import {
  roundInternal,
  roundMoneyMajorForDisplay,
  toDecimal,
} from "./rounding";

export type MoneyMajorInput = Decimal.Value;

export class CurrencyMismatchError extends Error {
  constructor(left: CurrencyCode, right: CurrencyCode) {
    super(`Currency mismatch: ${left} vs ${right}`);
    this.name = "CurrencyMismatchError";
  }
}

/**
 * Immutable monetary value.
 * Prefer `Money | null` for missing amounts — do not encode missing as zero.
 */
export class Money {
  private constructor(
    private readonly amount: Decimal,
    readonly currency: CurrencyCode,
  ) {}

  /** Major units (e.g. 1_000_000 = 1 000 000 Kč). */
  static fromMajor(
    amount: MoneyMajorInput,
    currency: string | CurrencyCode,
  ): Money {
    const code = assertCurrencyCode(currency);
    return new Money(toDecimal(amount, "money major"), code);
  }

  /** Minor units (haléře / cents). */
  static fromMinor(
    minor: number | bigint | string,
    currency: string | CurrencyCode,
  ): Money {
    const code = assertCurrencyCode(currency);
    const scale = currencyScaleFactor(code);
    const major = toDecimal(minor.toString(), "money minor").div(scale);
    return new Money(major, code);
  }

  static zero(currency: string | CurrencyCode): Money {
    return Money.fromMajor(0, currency);
  }

  /**
   * Parse optional major amount.
   * `null` / `undefined` → `null` (missing). Numeric 0 → zero Money.
   */
  static fromMajorOrNull(
    amount: MoneyMajorInput | null | undefined,
    currency: string | CurrencyCode,
  ): Money | null {
    if (amount == null) return null;
    return Money.fromMajor(amount, currency);
  }

  get major(): Decimal {
    return this.amount;
  }

  /** Exact major as string (no float drift). */
  toMajorString(): string {
    return this.amount.toString();
  }

  /**
   * Major as number — only after display rounding; avoid for further math.
   */
  toMajorNumber(): number {
    return this.roundForDisplay().amount.toNumber();
  }

  toMinorInteger(): bigint {
    const digits = currencyMinorDigits(this.currency);
    const minor = this.roundForDisplay().amount.mul(10 ** digits);
    return BigInt(minor.toFixed(0));
  }

  isZero(): boolean {
    return this.amount.isZero();
  }

  isPositive(): boolean {
    return this.amount.gt(0);
  }

  isNegative(): boolean {
    return this.amount.lt(0);
  }

  equals(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount.eq(other.amount);
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(roundInternal(this.amount.plus(other.amount)), this.currency);
  }

  sub(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(roundInternal(this.amount.minus(other.amount)), this.currency);
  }

  /** Multiply by dimensionless scalar (e.g. quantity, ratio). */
  mul(scalar: Decimal.Value): Money {
    return new Money(
      roundInternal(this.amount.mul(toDecimal(scalar, "scalar"))),
      this.currency,
    );
  }

  /** Allocate by ratio 0–1 (e.g. Percentage.toRatio()). */
  mulRatio(ratio: Decimal.Value): Money {
    return this.mul(ratio);
  }

  neg(): Money {
    return new Money(this.amount.neg(), this.currency);
  }

  /** Snap to currency minor units (display / persistence boundary). */
  roundForDisplay(): Money {
    return new Money(
      roundMoneyMajorForDisplay(this.amount, this.currency),
      this.currency,
    );
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchError(this.currency, other.currency);
    }
  }
}

export function isMissingMoney(value: Money | null | undefined): value is null | undefined {
  return value == null;
}

export function isZeroMoney(value: Money | null | undefined): boolean {
  return value != null && value.isZero();
}
