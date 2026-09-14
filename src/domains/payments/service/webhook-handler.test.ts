import { beforeEach, describe, expect, it, vi } from "vitest";

const webhookFindUnique = vi.fn();
const webhookUpsert = vi.fn();
const webhookUpdate = vi.fn();
const webhookUpdateMany = vi.fn();
const paymentFindFirst = vi.fn();
const paymentUpdate = vi.fn();
const orderUpdate = vi.fn();
const txPaymentUpdate = vi.fn();
const txOrderUpdate = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    paymentWebhookEvent: {
      findUnique: (...a: unknown[]) => webhookFindUnique(...a),
      upsert: (...a: unknown[]) => webhookUpsert(...a),
      update: (...a: unknown[]) => webhookUpdate(...a),
      updateMany: (...a: unknown[]) => webhookUpdateMany(...a),
      create: vi.fn(),
    },
    payment: {
      findFirst: (...a: unknown[]) => paymentFindFirst(...a),
      update: (...a: unknown[]) => paymentUpdate(...a),
    },
    order: {
      update: (...a: unknown[]) => orderUpdate(...a),
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        payment: { update: (...a: unknown[]) => txPaymentUpdate(...a) },
        order: { update: (...a: unknown[]) => txOrderUpdate(...a) },
      }),
  },
}));

const verifySig = vi.fn();
vi.mock("@/integrations/payments", () => ({
  resolvePaymentsConfig: () => ({
    provider: "mock",
    webhookSecret: "test-secret",
    webhookToleranceSeconds: 300,
    secretKey: "server-only",
  }),
  verifyPaymentsWebhookSignature: (...a: unknown[]) => verifySig(...a),
}));

const grantEntitlement = vi.fn();
vi.mock("@/domains/payments/service/entitlements", () => ({
  grantEntitlementForPaidOrder: (...a: unknown[]) => grantEntitlement(...a),
}));

const applyRefund = vi.fn();
vi.mock("@/domains/payments/service/refunds", () => ({
  applyRefundOrChargeback: (...a: unknown[]) => applyRefund(...a),
}));

vi.mock("@/domains/revenue/commerce-recognition", () => ({
  recognizeCommerceRevenueForPaidOrder: vi.fn().mockResolvedValue({ ok: true }),
}));

import { processPaymentWebhook } from "./webhook-handler";
import {
  signPaymentsWebhookBody,
} from "@/integrations/payments/security/webhook-signing";

function signedHeaders(body: string, secret = "test-secret") {
  const ts = Math.floor(Date.now() / 1000);
  const signature = signPaymentsWebhookBody({
    secret,
    timestampUnix: ts,
    body,
  });
  return new Headers({
    "x-majetio-payments-signature": signature,
    "x-majetio-payments-timestamp": String(ts),
  });
}

describe("processPaymentWebhook — runtime (121/131/176)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifySig.mockReturnValue({ ok: true });
    webhookUpsert.mockResolvedValue({
      id: "evt_row",
      processedAt: null,
    });
    webhookUpdate.mockResolvedValue({});
    webhookUpdateMany.mockResolvedValue({ count: 1 });
    grantEntitlement.mockResolvedValue({
      ok: true,
      entitlementId: "ent_1",
      status: "ACTIVE",
    });
    applyRefund.mockResolvedValue({ ok: true });
  });

  it("rejects invalid signature (170)", async () => {
    verifySig.mockReturnValue({ ok: false, reason: "bad sig" });
    const body = JSON.stringify({
      eventId: "evt_bad_sig_12345",
      type: "payment.succeeded",
      providerPaymentId: "pay_1",
      orderId: "ord_1",
    });
    const result = await processPaymentWebhook({
      rawBody: body,
      headers: new Headers(),
    });
    expect(result).toEqual({
      ok: false,
      status: 401,
      error: "bad sig",
    });
    expect(grantEntitlement).not.toHaveBeenCalled();
  });

  it("returns duplicate when event already processed", async () => {
    webhookUpsert.mockResolvedValue({
      id: "evt_row",
      processedAt: new Date(),
    });
    const body = JSON.stringify({
      eventId: "evt_dup_abcdefgh",
      type: "payment.succeeded",
      providerPaymentId: "pay_1",
      orderId: "ord_1",
    });
    const result = await processPaymentWebhook({
      rawBody: body,
      headers: signedHeaders(body),
    });
    expect(result).toEqual({
      ok: true,
      duplicate: true,
      orderId: "ord_1",
    });
    expect(grantEntitlement).not.toHaveBeenCalled();
  });

  it("on success marks PAID and grants entitlement", async () => {
    paymentFindFirst.mockResolvedValue({
      id: "pay_1",
      status: "PENDING",
      amountGrossMinor: 499_000,
      currency: "CZK",
      order: {
        id: "ord_1",
        userId: "user_1",
        status: "AWAITING_PAYMENT",
        productKey: "full_analysis",
        analysisId: null,
        propertyId: null,
        organizationId: null,
        amountGrossMinor: 499_000,
        currency: "CZK",
      },
    });

    const body = JSON.stringify({
      eventId: "evt_ok_abcdefgh",
      type: "payment.succeeded",
      providerPaymentId: "pay_1",
      orderId: "ord_1",
      amountMinor: 499_000,
      currency: "CZK",
    });
    const result = await processPaymentWebhook({
      rawBody: body,
      headers: signedHeaders(body),
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.duplicate).toBe(false);
    expect(grantEntitlement).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: "ord_1",
        userId: "user_1",
        productKey: "full_analysis",
      }),
    );
  });

  it("rejects succeed when webhook amount mismatches order", async () => {
    paymentFindFirst.mockResolvedValue({
      id: "pay_1",
      status: "PENDING",
      amountGrossMinor: 499_000,
      currency: "CZK",
      order: {
        id: "ord_1",
        userId: "user_1",
        status: "AWAITING_PAYMENT",
        productKey: "full_analysis",
        analysisId: null,
        propertyId: null,
        organizationId: null,
        amountGrossMinor: 499_000,
        currency: "CZK",
      },
    });

    const body = JSON.stringify({
      eventId: "evt_amt_mismatch_01",
      type: "payment.succeeded",
      providerPaymentId: "pay_1",
      orderId: "ord_1",
      amountMinor: 1,
      currency: "CZK",
    });
    const result = await processPaymentWebhook({
      rawBody: body,
      headers: signedHeaders(body),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/amount/i);
    }
    expect(grantEntitlement).not.toHaveBeenCalled();
  });

  it("on fail does NOT grant entitlement (195)", async () => {
    paymentFindFirst.mockResolvedValue({
      id: "pay_1",
      status: "PENDING",
      amountGrossMinor: 499_000,
      currency: "CZK",
      order: {
        id: "ord_1",
        userId: "user_1",
        status: "AWAITING_PAYMENT",
        productKey: "full_analysis",
        analysisId: null,
        propertyId: null,
        organizationId: null,
        amountGrossMinor: 499_000,
      },
    });

    const body = JSON.stringify({
      eventId: "evt_fail_abcdefg",
      type: "payment.failed",
      providerPaymentId: "pay_1",
      orderId: "ord_1",
      reason: "card declined",
    });
    const result = await processPaymentWebhook({
      rawBody: body,
      headers: signedHeaders(body),
    });
    expect(result.ok).toBe(true);
    expect(grantEntitlement).not.toHaveBeenCalled();
    expect(paymentUpdate).toHaveBeenCalled();
    expect(orderUpdate).toHaveBeenCalled();
  });

  it("on cancelled does NOT grant entitlement", async () => {
    paymentFindFirst.mockResolvedValue({
      id: "pay_1",
      status: "PENDING",
      amountGrossMinor: 100,
      currency: "CZK",
      order: {
        id: "ord_1",
        userId: "user_1",
        status: "AWAITING_PAYMENT",
        productKey: "full_analysis",
        analysisId: null,
        propertyId: null,
        organizationId: null,
        amountGrossMinor: 100,
      },
    });
    const body = JSON.stringify({
      eventId: "evt_cancel_abcdef",
      type: "payment.cancelled",
      providerPaymentId: "pay_1",
      orderId: "ord_1",
    });
    await processPaymentWebhook({
      rawBody: body,
      headers: signedHeaders(body),
    });
    expect(grantEntitlement).not.toHaveBeenCalled();
  });

  it("routes refund and chargeback to applyRefundOrChargeback (122/189)", async () => {
    paymentFindFirst.mockResolvedValue({
      id: "pay_1",
      status: "SUCCEEDED",
      amountGrossMinor: 499_000,
      currency: "CZK",
      order: {
        id: "ord_1",
        userId: "user_1",
        status: "PAID",
        productKey: "full_analysis",
        analysisId: null,
        propertyId: null,
        organizationId: null,
        amountGrossMinor: 499_000,
      },
    });

    for (const type of ["payment.refunded", "payment.chargeback"] as const) {
      applyRefund.mockClear();
      const body = JSON.stringify({
        eventId: `evt_${type}_abcdef`,
        type,
        providerPaymentId: "pay_1",
        orderId: "ord_1",
        amountMinor: 499_000,
        currency: "CZK",
      });
      webhookUpsert.mockResolvedValue({
        id: `evt_${type}`,
        processedAt: null,
      });
      const result = await processPaymentWebhook({
        rawBody: body,
        headers: signedHeaders(body),
      });
      expect(result.ok).toBe(true);
      expect(applyRefund).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: "ord_1",
          kind: type === "payment.chargeback" ? "chargeback" : "refund",
        }),
      );
      expect(grantEntitlement).not.toHaveBeenCalled();
    }
  });
});
