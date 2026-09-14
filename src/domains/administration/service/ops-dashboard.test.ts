/**
 * Ops KPI / attention queue shape tests (no DB required).
 */

import { describe, expect, it } from "vitest";

import { ATTENTION_SEVERITIES } from "@/domains/administration/service/attention-queue";

describe("Operations attention model", () => {
  it("defines severity ladder CRITICAL → INFO", () => {
    expect(ATTENTION_SEVERITIES).toEqual([
      "CRITICAL",
      "HIGH",
      "MEDIUM",
      "INFO",
    ]);
  });
});
