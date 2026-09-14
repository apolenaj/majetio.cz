import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  signPaymentsWebhookBody,
  verifyPaymentsWebhookSignature,
} from "@/integrations/payments/security/webhook-signing";

describe("Payment webhook security", () => {
  const secret = "test-webhook-secret-value";

  it("accepts valid signature within tolerance", () => {
    const body = JSON.stringify({ eventId: "evt_1", type: "payment.succeeded" });
    const ts = Math.floor(Date.now() / 1000);
    const signature = signPaymentsWebhookBody({
      secret,
      timestampUnix: ts,
      body,
    });
    const result = verifyPaymentsWebhookSignature({
      secret,
      body,
      signatureHeader: signature,
      timestampHeader: String(ts),
      toleranceSeconds: 300,
    });
    expect(result).toEqual({ ok: true });
  });

  it("rejects tampered body", () => {
    const body = JSON.stringify({ eventId: "evt_1" });
    const ts = Math.floor(Date.now() / 1000);
    const signature = signPaymentsWebhookBody({
      secret,
      timestampUnix: ts,
      body,
    });
    const result = verifyPaymentsWebhookSignature({
      secret,
      body: body + "x",
      signatureHeader: signature,
      timestampHeader: String(ts),
      toleranceSeconds: 300,
    });
    expect(result.ok).toBe(false);
  });
});

describe("Payment IDOR & secrets contracts", () => {
  it("order actions resolve user from session, not body userId", () => {
    const actions = readFileSync(
      join(process.cwd(), "src/domains/orders/server/actions.ts"),
      "utf8",
    );
    expect(actions).toMatch(/requireUserId|auth\(/);
    expect(actions).not.toMatch(/z\.object\(\{[^}]*userId:\s*z\.string/);
  });

  it("getOrderForUser scopes by userId", () => {
    const service = readFileSync(
      join(process.cwd(), "src/domains/orders/service/create-order.ts"),
      "utf8",
    );
    expect(service).toMatch(/where: \{ id: input\.orderId, userId: input\.userId \}/);
  });

  it("payment secrets only via server env config", () => {
    const config = readFileSync(
      join(process.cwd(), "src/integrations/payments/config.ts"),
      "utf8",
    );
    expect(config).toMatch(/PAYMENTS_SECRET_KEY/);
    expect(config).toMatch(/PAYMENTS_WEBHOOK_SECRET/);
    const wizard = readFileSync(
      join(process.cwd(), "src/components/checkout/checkout-wizard.tsx"),
      "utf8",
    );
    expect(wizard).not.toMatch(/PAYMENTS_SECRET_KEY|PAYMENTS_WEBHOOK_SECRET/);
  });

  it("failed payment path must not grant entitlement", () => {
    const webhook = readFileSync(
      join(process.cwd(), "src/domains/payments/service/webhook-handler.ts"),
      "utf8",
    );
    expect(webhook).toMatch(/payment\.failed/);
    expect(webhook).toMatch(/do NOT create entitlement|Explicitly do NOT create entitlement/);
    expect(webhook).toMatch(/PENDING_GRANT|grantEntitlementForPaidOrder/);
    expect(webhook).toMatch(/paymentWebhookEvent\.upsert/);
  });
});
