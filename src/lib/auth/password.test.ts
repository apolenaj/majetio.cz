import { describe, expect, it } from "vitest";

import { isPasswordStrongEnough } from "@/lib/auth/password";

describe("isPasswordStrongEnough", () => {
  it("accepts reasonable passwords", () => {
    expect(isPasswordStrongEnough("heslo1234")).toBe(true);
    expect(isPasswordStrongEnough("Abcdefg1")).toBe(true);
  });

  it("rejects weak passwords", () => {
    expect(isPasswordStrongEnough("short1")).toBe(false);
    expect(isPasswordStrongEnough("nodigits")).toBe(false);
    expect(isPasswordStrongEnough("12345678")).toBe(false);
  });
});
