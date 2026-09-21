import { describe, expect, it } from "vitest";

import {
  resolveBooleanFact,
  resolveFeaturePresence,
  resolveTextFact,
  summarizeVerifyGroups,
  DEFAULT_PRE_PURCHASE_CHECKS,
  VERIFY_LABEL,
  ABSENT_LABEL,
  YES_LABEL,
} from "./missing-value";

describe("property missing-value presentation", () => {
  it("keeps true / false / null distinct", () => {
    expect(resolveBooleanFact(true)).toEqual({ status: "known", display: YES_LABEL });
    expect(resolveBooleanFact(false)).toEqual({ status: "absent", display: ABSENT_LABEL });
    expect(resolveBooleanFact(null)).toEqual({ status: "verify", display: VERIFY_LABEL });
    expect(resolveBooleanFact(undefined)).toEqual({ status: "verify", display: VERIFY_LABEL });
  });

  it("never returns Neuvedeno", () => {
    expect(resolveTextFact(null, "legal").display).toBe(VERIFY_LABEL);
    expect(resolveFeaturePresence("unset").display).toBe(VERIFY_LABEL);
    expect(resolveFeaturePresence("no").display).toBe(ABSENT_LABEL);
  });

  it("can hide optional unset features", () => {
    expect(resolveFeaturePresence("unset", { hideUnset: true }).status).toBe("hidden");
  });

  it("summarizes pre-purchase checks without inventing verified items", () => {
    const summary = summarizeVerifyGroups(DEFAULT_PRE_PURCHASE_CHECKS);
    expect(summary.verified).toBe(0);
    expect(summary.checkRequired).toBeGreaterThan(0);
    expect(summary.issues).toBe(0);
  });
});
