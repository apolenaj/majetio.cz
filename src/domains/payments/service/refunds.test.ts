import { beforeEach, describe, expect, it, vi } from "vitest";

const orderFindUnique = vi.fn();
const orderFindFirst = vi.fn();
const paymentRefundCreate = vi.fn();
const orderUpdate = vi.fn();
const paymentUpdate = vi.fn();
const revokeEntitlements = vi.fn();
const createRefundProvider = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    order: {
      findUnique: (...a: unknown[]) => orderFindUnique(...a),
      findFirst: (...a: unknown[]) => orderFindFirst(...a),
      update: (...a: unknown[]) => orderUpdate(...a),
    },
    paymentRefund: {
      create: (...a: unknown[]) => paymentRefundCreate(...a),
    },
    payment: {
      update: (...a: unknown[]) => paymentUpdate(...a),
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        paymentRefund: {
          create: (...a: unknown[]) => paymentRefundCreate(...a),
        },
        order: { update: (...a: unknown[]) => orderUpdate(...a) },
        payment: { update: (...a: unknown[]) => paymentUpdate(...a) },
      }),
  },
}));

vi.mock("@/domains/payments/service/entitlements", () => ({
  revokeEntitlementsForOrder: (...a: unknown[]) => revokeEntitlements(...a),
}));

vi.mock("@/integrations/payments", () => ({
  getPaymentProvider: () => ({
    createRefund: (...a: unknown[]) => createRefundProvider(...a),
  }),
}));

import {
  applyRefundOrChargeback,
  createManualRefund,
  createAdminRefund,
} from "./refunds";

describe("Refunds & storno (122 / 189)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    revokeEntitlements.mockResolvedValue({ ok: true });
    createRefundProvider.mockResolvedValue({
      providerRefundId: "ref_mock_1",
    });
    paymentRefundCreate.mockResolvedValue({ id: "pr_1" });
    orderUpdate.mockResolvedValue({});
    paymentUpdate.mockResolvedValue({});
  });

  it("full refund sets REFUNDED and revokes entitlements", async () => {
    orderFindUnique.mockResolvedValue({
      id: "ord_1",
      status: "PAID",
      amountGrossMinor: 499_000,
      currency: "CZK",
      payments: [
        {
          id: "pay_1",
          status: "SUCCEEDED",
          providerPaymentId: "prov_1",
        },
      ],
    });

    const result = await applyRefundOrChargeback({
      orderId: "ord_1",
      amountMinor: 499_000,
      currency: "CZK",
      kind: "refund",
      reason: "customer request",
    });

    expect(result).toEqual({ ok: true });
    expect(orderUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "REFUNDED" }),
      }),
    );
    expect(revokeEntitlements).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: "ord_1" }),
    );
  });

  it("chargeback sets CHARGEBACK status", async () => {
    orderFindUnique.mockResolvedValue({
      id: "ord_1",
      status: "PAID",
      amountGrossMinor: 100_000,
      currency: "CZK",
      payments: [{ id: "pay_1", status: "SUCCEEDED", providerPaymentId: "p" }],
    });

    await applyRefundOrChargeback({
      orderId: "ord_1",
      amountMinor: 100_000,
      currency: "CZK",
      kind: "chargeback",
    });

    expect(orderUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "CHARGEBACK" }),
      }),
    );
  });

  it("createManualRefund enforces owner IDOR", async () => {
    orderFindFirst.mockResolvedValue(null);
    const result = await createManualRefund({
      userId: "other",
      orderId: "ord_1",
    });
    expect(result.ok).toBe(false);
  });

  it("createAdminRefund requires reason length", async () => {
    const result = await createAdminRefund({
      orderId: "ord_1",
      reason: "short",
    });
    expect(result.ok).toBe(false);
  });

  it("partial refund → PARTIALLY_REFUNDED", async () => {
    orderFindUnique.mockResolvedValue({
      id: "ord_1",
      status: "PAID",
      amountGrossMinor: 499_000,
      currency: "CZK",
      payments: [{ id: "pay_1", status: "SUCCEEDED", providerPaymentId: "p" }],
    });

    await applyRefundOrChargeback({
      orderId: "ord_1",
      amountMinor: 100_000,
      currency: "CZK",
      kind: "storno",
    });

    expect(orderUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "PARTIALLY_REFUNDED" }),
      }),
    );
  });
});
