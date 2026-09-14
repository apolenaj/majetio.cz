/**
 * Refunds & chargebacks (storno) — reverse payment + revoke entitlements.
 */

import { prisma } from "@/lib/db";
import { revokeEntitlementsForOrder } from "@/domains/payments/service/entitlements";
import { getPaymentProvider } from "@/integrations/payments";

export async function applyRefundOrChargeback(input: {
  orderId: string;
  paymentId?: string | null;
  amountMinor: number;
  currency: string;
  kind: "refund" | "chargeback" | "storno";
  reason?: string | null;
  providerRefundId?: string | null;
  /** When true, also call provider refund API (manual storno). */
  callProvider?: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: { payments: true },
  });
  if (!order) return { ok: false, error: "Objednávka nenalezena." };

  const payment =
    (input.paymentId
      ? order.payments.find((p) => p.id === input.paymentId)
      : null) ??
    order.payments.find((p) => p.status === "SUCCEEDED") ??
    order.payments[0];

  let providerRefundId = input.providerRefundId ?? null;
  if (input.callProvider && payment?.providerPaymentId) {
    const provider = getPaymentProvider();
    if (provider.createRefund) {
      const ref = await provider.createRefund({
        providerPaymentId: payment.providerPaymentId,
        amountMinor: input.amountMinor,
        currency: input.currency,
        reason: input.reason ?? undefined,
      });
      providerRefundId = ref.providerRefundId;
    }
  }

  const full = input.amountMinor >= order.amountGrossMinor;
  const orderStatus =
    input.kind === "chargeback"
      ? "CHARGEBACK"
      : full
        ? "REFUNDED"
        : "PARTIALLY_REFUNDED";
  const paymentStatus =
    input.kind === "chargeback"
      ? "CHARGEBACK"
      : full
        ? "REFUNDED"
        : "PARTIALLY_REFUNDED";

  await prisma.$transaction(async (tx) => {
    await tx.paymentRefund.create({
      data: {
        orderId: order.id,
        paymentId: payment?.id ?? null,
        amountMinor: input.amountMinor,
        currency: input.currency,
        reason: input.reason ?? null,
        providerRefundId,
        kind: input.kind,
      },
    });
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: orderStatus,
        refundedAt: new Date(),
      },
    });
    if (payment) {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: paymentStatus,
          rawProviderStatus: input.kind,
        },
      });
    }
  });

  await revokeEntitlementsForOrder({
    orderId: order.id,
    reason: `${input.kind}: ${input.reason ?? "revoked"}`,
  });

  return { ok: true };
}

/** Owner-scoped storno after PAID (IDOR: order must belong to userId). */
export async function createManualRefund(input: {
  userId: string;
  orderId: string;
  amountMinor?: number;
  reason?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const order = await prisma.order.findFirst({
    where: { id: input.orderId, userId: input.userId },
  });
  if (!order) return { ok: false, error: "Objednávka nenalezena." };
  if (order.status !== "PAID" && order.status !== "PARTIALLY_REFUNDED") {
    return { ok: false, error: "Objednávku nelze refundovat v tomto stavu." };
  }
  return applyRefundOrChargeback({
    orderId: order.id,
    amountMinor: input.amountMinor ?? order.amountGrossMinor,
    currency: order.currency,
    kind: "storno",
    reason: input.reason ?? "Manual storno",
    callProvider: true,
  });
}

/**
 * Admin storno / refund (checklist 122 / 189) — role checked by caller.
 * Does not require order.userId === actor; still audits via reason.
 */
export async function createAdminRefund(input: {
  orderId: string;
  amountMinor?: number;
  reason: string;
  kind?: "refund" | "storno" | "chargeback";
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const reason = input.reason.trim();
  if (reason.length < 8) {
    return { ok: false, error: "Důvod storna musí mít alespoň 8 znaků." };
  }
  const order = await prisma.order.findUnique({ where: { id: input.orderId } });
  if (!order) return { ok: false, error: "Objednávka nenalezena." };
  if (
    order.status !== "PAID" &&
    order.status !== "PARTIALLY_REFUNDED" &&
    input.kind !== "chargeback"
  ) {
    return { ok: false, error: "Objednávku nelze refundovat v tomto stavu." };
  }
  return applyRefundOrChargeback({
    orderId: order.id,
    amountMinor: input.amountMinor ?? order.amountGrossMinor,
    currency: order.currency,
    kind: input.kind ?? "storno",
    reason,
    callProvider: true,
  });
}
