import { describe, expect, it } from "vitest";

import { Money } from "./money";
import {
  Percentage,
  isMissingPercentage,
  isZeroPercentage,
} from "./percentage";

describe("Percentage", () => {
  it("stores 5.4% as ratio 0.054", () => {
    const p = Percentage.fromPercentPoints(5.4);
    expect(p.toRatio().toString()).toBe("0.054");
    expect(p.toPercentPoints().toString()).toBe("5.4");
  });

  it("adds and subtracts in ratio space", () => {
    const a = Percentage.fromPercentPoints(5);
    const b = Percentage.fromPercentPoints(1.5);
    expect(a.add(b).toPercentPoints().toString()).toBe("6.5");
    expect(a.sub(b).toPercentPoints().toString()).toBe("3.5");
  });

  it("applies percentage of money", () => {
    const yieldPct = Percentage.fromPercentPoints(5.4);
    const price = Money.fromMajor(2_000_000, "CZK");
    expect(yieldPct.of(price).roundForDisplay().toMajorString()).toBe("108000");
  });

  it("distinguishes null vs zero", () => {
    expect(Percentage.fromPercentPointsOrNull(null)).toBeNull();
    expect(isMissingPercentage(null)).toBe(true);

    const zero = Percentage.fromPercentPointsOrNull(0);
    expect(zero).not.toBeNull();
    expect(isZeroPercentage(zero)).toBe(true);
    expect(Percentage.zero().equals(zero!)).toBe(true);
  });

  it("rounds percent points for display", () => {
    const p = Percentage.fromRatio("0.05444");
    expect(p.roundForDisplay().toString()).toBe("5.4");
  });
});
