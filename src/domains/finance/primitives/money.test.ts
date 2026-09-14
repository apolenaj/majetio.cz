import { describe, expect, it } from "vitest";

import {
  CurrencyMismatchError,
  Money,
  isMissingMoney,
  isZeroMoney,
} from "./money";

describe("Money", () => {
  it("adds and subtracts same-currency amounts without float drift", () => {
    const a = Money.fromMajor("0.1", "CZK");
    const b = Money.fromMajor("0.2", "CZK");
    expect(a.add(b).toMajorString()).toBe("0.3");
    expect(b.sub(a).toMajorString()).toBe("0.1");
  });

  it("rejects currency mismatch", () => {
    const czk = Money.fromMajor(100, "CZK");
    const eur = Money.fromMajor(100, "EUR");
    expect(() => czk.add(eur)).toThrow(CurrencyMismatchError);
  });

  it("distinguishes null (missing) from zero", () => {
    expect(Money.fromMajorOrNull(null, "CZK")).toBeNull();
    expect(Money.fromMajorOrNull(undefined, "CZK")).toBeNull();
    expect(isMissingMoney(null)).toBe(true);

    const zero = Money.fromMajorOrNull(0, "CZK");
    expect(zero).not.toBeNull();
    expect(isZeroMoney(zero)).toBe(true);
    expect(isMissingMoney(zero)).toBe(false);
    expect(Money.zero("CZK").equals(zero!)).toBe(true);
  });

  it("rounds half-up to minor units for display", () => {
    const m = Money.fromMajor("10.005", "CZK");
    expect(m.roundForDisplay().toMajorString()).toBe("10.01");
    expect(m.toMinorInteger()).toBe(BigInt(1001));
  });

  it("supports minor-unit construction", () => {
    expect(Money.fromMinor(6_490_000_00, "CZK").toMajorString()).toBe("6490000");
  });

  it("multiplies by ratio", () => {
    const price = Money.fromMajor(1_000_000, "CZK");
    expect(price.mulRatio("0.054").roundForDisplay().toMajorString()).toBe(
      "54000",
    );
  });
});
