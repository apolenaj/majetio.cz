import { describe, expect, it } from "vitest";

import {
  buildContentSecurityPolicy,
  createRequestNonce,
} from "@/lib/security/headers";
import { assertSafeOutboundUrl, isPrivateOrLocalHostname } from "@/lib/security/ssrf";
import {
  sanitizePlainText,
  sanitizeRichHtml,
} from "@/lib/security/sanitize";
import { redactFields, redactErrorForClient } from "@/lib/security/logger";
import { pickDto, strictObject } from "@/lib/security/validate";
import { z } from "zod";

describe("security headers / CSP", () => {
  it("embeds nonce and frame-ancestors none", () => {
    const nonce = createRequestNonce();
    const csp = buildContentSecurityPolicy(nonce);
    expect(csp).toContain(`'nonce-${nonce}'`);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain("unsafe-eval");
  });
});

describe("SSRF", () => {
  it("blocks localhost and metadata", () => {
    expect(isPrivateOrLocalHostname("localhost")).toBe(true);
    expect(isPrivateOrLocalHostname("127.0.0.1")).toBe(true);
    expect(isPrivateOrLocalHostname("169.254.169.254")).toBe(true);
    expect(isPrivateOrLocalHostname("10.0.0.5")).toBe(true);
    expect(assertSafeOutboundUrl("https://169.254.169.254/latest").ok).toBe(
      false,
    );
  });

  it("requires allowlist when provided", () => {
    const blocked = assertSafeOutboundUrl("https://evil.example/x", {
      allowlistSuffixes: ["sreality.cz"],
    });
    expect(blocked.ok).toBe(false);
    const ok = assertSafeOutboundUrl("https://www.sreality.cz/detail/1", {
      allowlistSuffixes: ["sreality.cz"],
    });
    expect(ok.ok).toBe(true);
  });
});

describe("sanitize", () => {
  it("strips scripts from plain text", () => {
    expect(sanitizePlainText('<script>alert(1)</script>hi')).toBe("hi");
  });

  it("allowlists rich html tags only", () => {
    const html = sanitizeRichHtml(
      '<p>ok</p><script>x</script><a href="javascript:alert(1)">x</a><a href="https://majetio.cz">y</a>',
    );
    expect(html).not.toContain("script");
    expect(html).not.toContain("javascript:");
    expect(html).toContain('href="https://majetio.cz"');
  });
});

describe("logger redaction", () => {
  it("redacts password, token, and financial passport fields", () => {
    const cleaned = redactFields({
      password: "secret",
      token: "abc",
      monthlyIncomeCzk: 80000,
      ok: true,
    });
    expect(cleaned.password).toBe("[redacted]");
    expect(cleaned.token).toBe("[redacted]");
    expect(cleaned.monthlyIncomeCzk).toBe("[redacted]");
    expect(cleaned.ok).toBe(true);
  });

  it("hides production error details", () => {
    const prev = process.env.NODE_ENV;
    Reflect.set(process.env, "NODE_ENV", "production");
    try {
      expect(redactErrorForClient(new Error("SELECT * FROM User")).message).toBe(
        "Internal server error",
      );
    } finally {
      Reflect.set(process.env, "NODE_ENV", prev);
    }
  });
});

describe("validate / mass-assignment", () => {
  it("strictObject rejects unknown keys", () => {
    const schema = strictObject({ name: z.string() });
    expect(schema.safeParse({ name: "a", role: "ADMIN" }).success).toBe(false);
  });

  it("pickDto only returns allowlisted keys", () => {
    const dto = pickDto(
      { id: "1", passwordHash: "x", email: "a@b.c" },
      ["id", "email"] as const,
    );
    expect(dto).toEqual({ id: "1", email: "a@b.c" });
    expect(dto).not.toHaveProperty("passwordHash");
  });
});
