import { describe, expect, it } from "vitest";

import { AUTH_MESSAGES } from "@/lib/auth/constants";
import { isPasswordStrongEnough } from "@/lib/auth/password";

describe("registration validation contract", () => {
  it("accepts strong passwords", () => {
    expect(isPasswordStrongEnough("ValidPass1")).toBe(true);
    expect(isPasswordStrongEnough("abc12345")).toBe(true);
  });

  it("rejects short / letter-only / digit-only passwords", () => {
    expect(isPasswordStrongEnough("Ab1")).toBe(false);
    expect(isPasswordStrongEnough("password")).toBe(false);
    expect(isPasswordStrongEnough("12345678")).toBe(false);
  });

  it("exposes clear duplicate-email copy", () => {
    expect(AUTH_MESSAGES.emailTaken).toMatch(/už existuje/i);
  });

  it("exposes consent requirement copy", () => {
    expect(AUTH_MESSAGES.consentRequired).toMatch(/obchodními podmínkami/i);
  });
});
