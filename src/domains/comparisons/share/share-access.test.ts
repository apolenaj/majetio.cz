import { describe, expect, it } from "vitest";

import {
  classifySecretShareAccess,
  secretShareAccessErrorCs,
} from "./share-access";

describe("Secret share token access (valid / invalid / expired / revoked)", () => {
  it("rejects short or empty tokens", () => {
    expect(
      classifySecretShareAccess({ tokenOk: false, found: false }),
    ).toBe("invalid");
    expect(secretShareAccessErrorCs("invalid")).toMatch(/Neplatný/);
  });

  it("rejects missing hash match", () => {
    expect(
      classifySecretShareAccess({ tokenOk: true, found: false }),
    ).toBe("invalid");
  });

  it("rejects revoked shares", () => {
    expect(
      classifySecretShareAccess({
        tokenOk: true,
        found: true,
        revokedAt: new Date("2026-07-01"),
        expiresAt: new Date("2026-12-01"),
      }),
    ).toBe("revoked");
    expect(secretShareAccessErrorCs("revoked")).toMatch(/zneplatněn/);
  });

  it("rejects expired shares", () => {
    expect(
      classifySecretShareAccess({
        tokenOk: true,
        found: true,
        revokedAt: null,
        expiresAt: new Date("2026-01-01"),
        now: new Date("2026-07-20"),
      }),
    ).toBe("expired");
    expect(secretShareAccessErrorCs("expired")).toMatch(/vypršela/);
  });

  it("accepts valid non-expired non-revoked share", () => {
    expect(
      classifySecretShareAccess({
        tokenOk: true,
        found: true,
        revokedAt: null,
        expiresAt: new Date("2026-12-01"),
        now: new Date("2026-07-20"),
      }),
    ).toBe("ok");
  });
});
