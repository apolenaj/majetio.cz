import { describe, expect, it } from "vitest";

import {
  TypedRate,
  appreciationRateFromPercentPoints,
  aprFromPercentPoints,
  assertRateKind,
  nominalInterestRateFromPercentPoints,
  nominalInterestRateFromRatio,
} from "./rates";

describe("typed rates", () => {
  it("keeps distinct kinds for nominal interest, APR, appreciation", () => {
    const nominal = nominalInterestRateFromPercentPoints(5.25);
    const apr = aprFromPercentPoints(5.49);
    const appr = appreciationRateFromPercentPoints(3);

    expect(nominal.kind).toBe("nominal_interest");
    expect(apr.kind).toBe("apr");
    expect(appr.kind).toBe("appreciation");

    expect(nominal.toRatio().toString()).toBe("0.0525");
    expect(apr.toDisplayPercentPoints()).toBe(5.49);
  });

  it("builds nominal from ratio", () => {
    const r = nominalInterestRateFromRatio(0.05);
    expect(r.toPercentPoints().toString()).toBe("5");
  });

  it("treats null percent points as missing rate; 0 as zero", () => {
    expect(
      TypedRate.fromPercentPointsOrNull("nominal_interest", null),
    ).toBeNull();
    expect(
      TypedRate.fromPercentPointsOrNull("nominal_interest", 0)?.isZero(),
    ).toBe(true);
  });

  it("assertRateKind validates boundary strings", () => {
    expect(assertRateKind("apr")).toBe("apr");
    expect(() => assertRateKind("discount")).toThrow(/Unknown rate kind/);
  });
});
