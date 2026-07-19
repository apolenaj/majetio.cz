import { describe, expect, it } from "vitest";

import { resolveDaysOnMarket, daysBetweenIso } from "./market-timing";

describe("market-timing", () => {
  it("prefers explicit override days", () => {
    expect(
      resolveDaysOnMarket({
        publishedAt: "2026-01-01T00:00:00.000Z",
        overrideDays: 20,
      }),
    ).toBe(20);
  });

  it("returns null when no publish date and no override", () => {
    expect(
      resolveDaysOnMarket({ publishedAt: null, overrideDays: null }),
    ).toBeNull();
  });

  it("computes days from ISO", () => {
    const days = daysBetweenIso("2026-07-01T00:00:00.000Z", new Date("2026-07-19T00:00:00.000Z"));
    expect(days).toBe(18);
  });
});
