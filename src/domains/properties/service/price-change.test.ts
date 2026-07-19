import { describe, expect, it } from "vitest";

import { derivePriceDecrease } from "./price-change";

describe("derivePriceDecrease", () => {
  it("returns null when history is empty", () => {
    expect(derivePriceDecrease([], 6_490_000)).toBeNull();
  });

  it("summarizes DECREASED vs previous point", () => {
    const result = derivePriceDecrease(
      [
        {
          amount: 6_790_000,
          currency: "CZK",
          changeType: "INITIAL",
          observedAt: "2026-05-01T00:00:00.000Z",
        },
        {
          amount: 6_490_000,
          currency: "CZK",
          changeType: "DECREASED",
          observedAt: "2026-07-01T00:00:00.000Z",
        },
      ],
      6_490_000,
    );
    expect(result).not.toBeNull();
    expect(result!.previousAmount).toBe(6_790_000);
    expect(result!.deltaAmount).toBe(-300_000);
    expect(result!.deltaPercent).toBeCloseTo(-4.4, 1);
  });

  it("does not invent a decrease from a single INITIAL point", () => {
    expect(
      derivePriceDecrease(
        [
          {
            amount: 5_000_000,
            currency: "CZK",
            changeType: "INITIAL",
            observedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        5_000_000,
      ),
    ).toBeNull();
  });
});
