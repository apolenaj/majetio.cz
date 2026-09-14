import { describe, expect, it } from "vitest";

import {
  buildSignedRequestHeaders,
  signRequestBody,
  verifySignedRequest,
} from "@/integrations/hypotekajasne/security/request-signing";
import { assertNoPiiInUrl } from "@/integrations/hypotekajasne/config";
import { isRetryableHttpStatus } from "@/integrations/hypotekajasne/security/api-errors";
import {
  computeNextRetryAt,
  shouldMoveToDeadLetter,
} from "@/domains/leads/service/submission-retry";

describe("HypotekaJasne request signing", () => {
  const secret = "test-signing-secret";
  const body = JSON.stringify({ correlationId: "ml_test", email: "a@b.cz" });

  it("signs and verifies request body", () => {
    const now = 1_700_000_000;
    const headers = buildSignedRequestHeaders({ secret, body, now: now * 1000 });
    const result = verifySignedRequest({
      secret,
      body,
      signatureHeader: headers["x-majetio-signature"],
      timestampHeader: headers["x-majetio-timestamp"],
      now: now * 1000,
    });
    expect(result.ok).toBe(true);
  });

  it("rejects replayed timestamps outside tolerance", () => {
    const timestampUnix = 1_700_000_000;
    const signature = signRequestBody({ secret, timestampUnix, body });
    const result = verifySignedRequest({
      secret,
      body,
      signatureHeader: signature,
      timestampHeader: String(timestampUnix),
      toleranceSeconds: 60,
      now: (timestampUnix + 120) * 1000,
    });
    expect(result.ok).toBe(false);
  });

  it("blocks PII in URL query strings", () => {
    expect(() =>
      assertNoPiiInUrl("https://api.example/leads?email=user@test.cz"),
    ).toThrow();
  });

  it("classifies retryable HTTP statuses", () => {
    expect(isRetryableHttpStatus(503)).toBe(true);
    expect(isRetryableHttpStatus(429)).toBe(true);
    expect(isRetryableHttpStatus(400)).toBe(false);
  });

  it("computes exponential retry schedule", () => {
    const first = computeNextRetryAt({ attemptNumber: 1 });
    const last = computeNextRetryAt({ attemptNumber: 5 });
    expect(first).not.toBeNull();
    expect(last).toBeNull();
    expect(shouldMoveToDeadLetter(5)).toBe(true);
  });
});
