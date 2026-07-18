import { describe, expect, it } from "vitest";

import { buildLoginUrl, getSafeCallbackUrl } from "@/lib/auth/callback-url";

describe("getSafeCallbackUrl", () => {
  it("returns fallback for empty", () => {
    expect(getSafeCallbackUrl(undefined)).toBe("/ucet");
    expect(getSafeCallbackUrl("")).toBe("/ucet");
  });

  it("allows relative paths", () => {
    expect(getSafeCallbackUrl("/ucet/oblibene")).toBe("/ucet/oblibene");
    expect(getSafeCallbackUrl("/admin?tab=1")).toBe("/admin?tab=1");
  });

  it("blocks open redirects", () => {
    expect(getSafeCallbackUrl("https://evil.test")).toBe("/ucet");
    expect(getSafeCallbackUrl("//evil.test")).toBe("/ucet");
    expect(getSafeCallbackUrl("/\\evil")).toBe("/ucet");
    expect(getSafeCallbackUrl("ucet")).toBe("/ucet");
    expect(getSafeCallbackUrl("/ucet@evil.test")).toBe("/ucet");
  });
});

describe("buildLoginUrl", () => {
  it("encodes safe callback", () => {
    expect(buildLoginUrl("/ucet/analyzy")).toBe(
      "/prihlaseni?callbackUrl=%2Fucet%2Fanalyzy",
    );
  });
});
