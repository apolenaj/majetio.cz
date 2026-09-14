/**
 * Security stubs / specs — rate limit, IDOR, MIME, webhook signatures.
 * These are Vitest contract tests (Jest-compatible). Full runtime IDOR with
 * two DB users is covered when E2E_USER_* fixtures exist; here we lock the
 * source + crypto contracts that must not regress before release.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  assertAllowedUploadMime,
  isAllowedUploadMime,
} from "@/lib/security/upload-mime";
import {
  signPaymentsWebhookBody,
  verifyPaymentsWebhookSignature,
} from "@/integrations/payments/security/webhook-signing";
import {
  signRequestBody,
  verifySignedRequest,
} from "@/integrations/hypotekajasne/security/request-signing";
import { assertOwnedRecord, OwnershipError } from "@/lib/security/validate";

const root = (...parts: string[]) => join(process.cwd(), ...parts);

describe("Security stub: auth rate limiting (login / reset)", () => {
  it("login credentials provider enforces rate limit + failure recording", () => {
    const src = readFileSync(root("src/lib/auth/index.ts"), "utf8");
    expect(src).toMatch(/assertNotRateLimited/);
    expect(src).toMatch(/recordAuthFailure/);
  });

  it("password reset request and confirm are rate-limited", () => {
    const src = readFileSync(root("src/lib/auth/actions.ts"), "utf8");
    expect(src).toMatch(/assertNotRateLimited\(\[ip,\s*"reset"\]/);
    expect(src).toMatch(/assertNotRateLimited\(\[ip,\s*"reset-confirm"/);
    expect(src).toMatch(/recordAuthFailure/);
  });

  it("password reset success deletes token (no reuse) and sessions", () => {
    const src = readFileSync(root("src/lib/auth/actions.ts"), "utf8");
    expect(src).toMatch(/verificationToken\.delete/);
    expect(src).toMatch(/session\.deleteMany/);
  });

  it("lockout threshold is documented in auth rate-limit module", () => {
    const src = readFileSync(root("src/lib/auth/rate-limit.ts"), "utf8");
    expect(src).toMatch(/MAX_FAILURES\s*=\s*8/);
    expect(src).toMatch(/auditAuthFailureBurst|failCount\s*>=\s*MAX_FAILURES/);
  });
});

describe("Security stub: IDOR — user A cannot touch user B", () => {
  it("assertOwnedRecord throws OwnershipError on foreign id", async () => {
    await expect(
      assertOwnedRecord({
        load: async () => null,
      }),
    ).rejects.toBeInstanceOf(OwnershipError);
  });

  it("favourites / scenarios / passport actions bind session userId", () => {
    const files = [
      "src/domains/favourites/server/actions.ts",
      "src/lib/financial-passport/actions.ts",
      "src/lib/account/settings-actions.ts",
    ];
    for (const file of files) {
      const src = readFileSync(root(file), "utf8");
      expect(src).toMatch(/auth\(\)|requireUser\(|requireUserId\(/);
      expect(src).not.toMatch(/z\.object\(\{[^}]*userId:\s*z\.string/);
    }
  });

  /**
   * Cross-user mutation scenario (spec):
   * Given session(userA) and resource owned by userB
   * When PATCH/DELETE with resource id of B
   * Then 404/403 and no write — ownership enforced in query (`userId: session.id`).
   */
  it("documents cross-user denial contract for account export", () => {
    const exportSrc = readFileSync(root("src/lib/account/export.ts"), "utf8");
    expect(exportSrc).toMatch(/auth\(/);
    expect(exportSrc).toMatch(/session\.user\.id/);
    expect(exportSrc).not.toMatch(
      /function buildAccountExport\([^)]*userId/,
    );
  });
});

describe("Security stub: upload MIME allowlist", () => {
  it("accepts images, PDF, CSV, JSON", () => {
    expect(isAllowedUploadMime("image/png")).toBe(true);
    expect(isAllowedUploadMime("application/pdf; charset=binary")).toBe(true);
    expect(assertAllowedUploadMime("text/csv").ok).toBe(true);
  });

  it("rejects HTML, JS, executables, and empty types", () => {
    expect(assertAllowedUploadMime("text/html")).toEqual({
      ok: false,
      reason: "blocked",
    });
    expect(assertAllowedUploadMime("application/javascript").ok).toBe(false);
    expect(assertAllowedUploadMime("application/x-msdownload").ok).toBe(false);
    expect(assertAllowedUploadMime(null)).toEqual({
      ok: false,
      reason: "missing",
    });
    expect(assertAllowedUploadMime("application/octet-stream")).toEqual({
      ok: false,
      reason: "unsupported",
    });
  });
});

describe("Security stub: webhook signature verification", () => {
  const paymentsSecret = "test-payments-webhook-secret";
  const hjSecret = "test-hj-webhook-secret-value-32chars!!";

  it("payments: valid signature accepted; tamper rejected", () => {
    const body = JSON.stringify({
      eventId: "evt_sec_1",
      type: "payment.succeeded",
    });
    const ts = Math.floor(Date.now() / 1000);
    const signature = signPaymentsWebhookBody({
      secret: paymentsSecret,
      timestampUnix: ts,
      body,
    });
    expect(
      verifyPaymentsWebhookSignature({
        secret: paymentsSecret,
        body,
        signatureHeader: signature,
        timestampHeader: String(ts),
        toleranceSeconds: 300,
      }).ok,
    ).toBe(true);

    expect(
      verifyPaymentsWebhookSignature({
        secret: paymentsSecret,
        body: body + " forged",
        signatureHeader: signature,
        timestampHeader: String(ts),
        toleranceSeconds: 300,
      }).ok,
    ).toBe(false);
  });

  it("hypotekajasne: valid signature accepted; missing signature rejected", () => {
    const body = JSON.stringify({ schemaVersion: "1", eventId: "e1" });
    const ts = Math.floor(Date.now() / 1000);
    const signature = signRequestBody({
      secret: hjSecret,
      body,
      timestampUnix: ts,
    });
    expect(
      verifySignedRequest({
        secret: hjSecret,
        body,
        signatureHeader: signature,
        timestampHeader: String(ts),
        toleranceSeconds: 300,
      }).ok,
    ).toBe(true);

    expect(
      verifySignedRequest({
        secret: hjSecret,
        body,
        signatureHeader: null,
        timestampHeader: String(ts),
        toleranceSeconds: 300,
      }).ok,
    ).toBe(false);
  });
});
