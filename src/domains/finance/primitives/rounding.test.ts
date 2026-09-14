import { describe, expect, it } from "vitest";

import {
  ROUNDING_POLICY,
  roundInternal,
  roundMoneyMajorForDisplay,
  roundPercentPointsForDisplay,
  roundRatePercentPointsForDisplay,
} from "./rounding";

describe("rounding policy", () => {
  it("keeps high internal precision with half-even", () => {
    expect(ROUNDING_POLICY.internal.decimalPlaces).toBe(10);
    expect(ROUNDING_POLICY.internal.mode).toBeDefined();
    // Intermediate value retains more precision than money display (2 dp)
    const internal = roundInternal("1.2345678912");
    expect(internal.toString()).toBe("1.2345678912");
    expect(roundMoneyMajorForDisplay(internal, "CZK").toString()).toBe("1.23");
  });

  it("rounds money display to 2 dp half-up (CZK)", () => {
    expect(roundMoneyMajorForDisplay("10.005", "CZK").toString()).toBe("10.01");
    expect(roundMoneyMajorForDisplay("10.004", "CZK").toString()).toBe("10");
  });

  it("rounds percent display to 1 dp and rates to 2 dp", () => {
    expect(roundPercentPointsForDisplay("5.44").toString()).toBe("5.4");
    expect(roundPercentPointsForDisplay("5.45").toString()).toBe("5.5");
    expect(roundRatePercentPointsForDisplay("5.255").toString()).toBe("5.26");
  });
});
