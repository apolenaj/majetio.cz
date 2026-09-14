/**
 * Prompt 20.7 — Security / privacy / admin RBAC regression contracts.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  assertAllowedUploadMime,
  assertSafeUploadMeta,
  MAX_UPLOAD_BYTES,
} from "@/lib/security/upload-mime";
import { assertSafeOutboundUrl, isPrivateOrLocalHostname } from "@/lib/security/ssrf";
import {
  signPaymentsWebhookBody,
  verifyPaymentsWebhookSignature,
} from "@/integrations/payments/security/webhook-signing";
import {
  roleHasPermission,
  isAdminZoneRole,
} from "@/domains/administration/rbac/roles";

const root = (...parts: string[]) => join(process.cwd(), ...parts);

describe("Prompt 20.7 — session revoke on password change", () => {
  it("JWT callback binds credentials fingerprint and revokes on mismatch", () => {
    const src = readFileSync(root("src/lib/auth/index.ts"), "utf8");
    expect(src).toMatch(/credentialsFingerprint/);
    expect(src).toMatch(/token\.cfp/);
    expect(src).toMatch(/token\.cfp !== liveFp/);
  });

  it("password change and reset delete DB sessions", () => {
    const settings = readFileSync(
      root("src/lib/account/settings-actions.ts"),
      "utf8",
    );
    const reset = readFileSync(root("src/lib/auth/actions.ts"), "utf8");
    expect(settings).toMatch(/session\.deleteMany/);
    expect(reset).toMatch(/session\.deleteMany/);
    expect(reset).toMatch(/verificationToken\.delete/);
  });
});

describe("Prompt 20.7 — upload MIME on KYC registration", () => {
  it("rejects HTML / oversized / mismatched extension", () => {
    expect(assertAllowedUploadMime("text/html").ok).toBe(false);
    expect(
      assertSafeUploadMeta({
        contentType: "application/pdf",
        fileName: "doc.exe",
      }).ok,
    ).toBe(false);
    expect(
      assertSafeUploadMeta({
        contentType: "application/pdf",
        fileName: "doc.pdf",
        sizeBytes: MAX_UPLOAD_BYTES + 1,
      }),
    ).toEqual({ ok: false, reason: "too_large" });
    expect(
      assertSafeUploadMeta({
        contentType: "image/png",
        fileName: "kyc.png",
        sizeBytes: 1024,
      }).ok,
    ).toBe(true);
  });

  it("org-ops registers only after MIME guard", () => {
    const src = readFileSync(
      root("src/domains/organizations/admin/org-ops.ts"),
      "utf8",
    );
    expect(src).toMatch(/assertSafeUploadMeta/);
  });
});

describe("Prompt 20.7 — webhook IP rate limits", () => {
  it("payments and hypotekajasne webhook routes call assertWebhookIpRateLimit", () => {
    const payments = readFileSync(
      root("src/app/api/payments/webhook/route.ts"),
      "utf8",
    );
    const hj = readFileSync(
      root("src/app/api/integrations/hypotekajasne/webhook/route.ts"),
      "utf8",
    );
    expect(payments).toMatch(/assertWebhookIpRateLimit/);
    expect(hj).toMatch(/assertWebhookIpRateLimit/);
  });

  it("forged payment signature is rejected", () => {
    const secret = "test-payments-webhook-secret";
    const body = JSON.stringify({ eventId: "e", type: "payment.succeeded" });
    const ts = Math.floor(Date.now() / 1000);
    const signature = signPaymentsWebhookBody({
      secret,
      timestampUnix: ts,
      body,
    });
    expect(
      verifyPaymentsWebhookSignature({
        secret,
        body: body + "x",
        signatureHeader: signature,
        timestampHeader: String(ts),
        toleranceSeconds: 300,
      }).ok,
    ).toBe(false);
  });
});

describe("Prompt 20.7 — public search rate limit wired", () => {
  it("discovery and hledat enforce public search guard", () => {
    const discovery = readFileSync(
      root("src/app/(discovery)/nemovitosti/page.tsx"),
      "utf8",
    );
    const hledat = readFileSync(
      root("src/app/(public)/hledat/page.tsx"),
      "utf8",
    );
    expect(discovery).toMatch(/enforcePublicSearchRateLimit/);
    expect(hledat).toMatch(/enforcePublicSearchRateLimit/);
  });
});

describe("Prompt 20.7 — SSRF + XSS sanitize still hard", () => {
  it("blocks private hosts", () => {
    expect(isPrivateOrLocalHostname("192.168.1.1")).toBe(true);
    expect(assertSafeOutboundUrl("https://localhost/x").ok).toBe(false);
  });

  it("safeFetch resolves DNS before connect", () => {
    const src = readFileSync(root("src/lib/security/ssrf-fetch.ts"), "utf8");
    expect(src).toMatch(/node:dns\/promises/);
    expect(src).toMatch(/SSRF_BLOCKED:blocked/);
  });
});

describe("Prompt 20.7 — Admin RBAC lower role cannot escalate", () => {
  it("USER is outside admin zone; reviewer cannot refund", () => {
    expect(isAdminZoneRole("USER")).toBe(false);
    expect(roleHasPermission("USER", "property.moderate")).toBe(false);
    expect(roleHasPermission("PROPERTY_REVIEWER", "payments.refund")).toBe(
      false,
    );
    expect(roleHasPermission("PROPERTY_REVIEWER", "users.impersonate")).toBe(
      false,
    );
  });
});
