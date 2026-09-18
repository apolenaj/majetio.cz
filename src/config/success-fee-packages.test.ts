/**
 * Unit tests for success-fee package config (document defaults).
 */

import { describe, expect, it } from "vitest";

import {
  RENT_SUCCESS_FEE_PACKAGES,
  SALE_SUCCESS_FEE_RATES,
  SUCCESS_FEE_BILLING_ENABLED,
  formatRatePct,
} from "@/config/success-fee-packages";

describe("success-fee packages", () => {
  it("keeps billing disabled until open questions are settled", () => {
    expect(SUCCESS_FEE_BILLING_ENABLED).toBe(false);
  });

  it("matches document sale rates for private basic", () => {
    const row = SALE_SUCCESS_FEE_RATES.find(
      (r) => r.actor === "private" && r.tier === "basic",
    );
    expect(row?.ratePct).toBe(2);
  });

  it("matches document rent basic 10%", () => {
    expect(RENT_SUCCESS_FEE_PACKAGES.find((p) => p.tier === "basic")?.ratePct).toBe(
      10,
    );
  });

  it("formats company premium as range", () => {
    const row = SALE_SUCCESS_FEE_RATES.find(
      (r) => r.actor === "company" && r.tier === "premium",
    )!;
    expect(formatRatePct(row)).toBe("5–15 %");
  });
});
