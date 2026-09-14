import { describe, expect, it } from "vitest";

import {
  TRUST_FORBIDDEN_CERTAINTY_PHRASES,
  isStaleTimestamp,
  toConfidenceLevel,
  dataSourceKindLabel,
} from "@/components/trust";

describe("Trust by Design helpers", () => {
  it("maps valuation confidence enums", () => {
    expect(toConfidenceLevel("HIGH")).toBe("high");
    expect(toConfidenceLevel("INSUFFICIENT")).toBe("insufficient");
    expect(toConfidenceLevel(null)).toBe("insufficient");
  });

  it("labels all data source kinds without false certainty", () => {
    expect(dataSourceKindLabel("majetio_estimate")).toBe("Odhad Majetio");
    expect(dataSourceKindLabel("source_record")).toBe("Zdrojový údaj");
    for (const phrase of TRUST_FORBIDDEN_CERTAINTY_PHRASES) {
      expect(dataSourceKindLabel("majetio_estimate")).not.toContain(phrase);
    }
  });

  it("detects stale timestamps past threshold", () => {
    const now = new Date("2026-07-22T12:00:00.000Z");
    expect(
      isStaleTimestamp("2026-07-20T12:00:00.000Z", 30, now),
    ).toBe(false);
    expect(
      isStaleTimestamp("2026-05-01T12:00:00.000Z", 30, now),
    ).toBe(true);
    expect(isStaleTimestamp(null, 30, now)).toBe(true);
  });
});
