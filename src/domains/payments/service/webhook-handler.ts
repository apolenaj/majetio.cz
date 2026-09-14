/**
 * Payment webhook processor — signature, idempotency, success/fail/cancel/refund/chargeback.
 */

import { z } from "zod";

import { prisma } from "@/lib/db";
import {
  resolvePaymentsConfig,
  verifyPaymentsWebhookSignature,
} from "@/integrations/payments";
import type { WebhookEventType } from "@/integrations/payments";
import { grantEntitlementForPaidOrder } from "@/domains/payments/service/entitlements";
import { applyRefundOrChargeback } from "@/domains/payments/service/refunds";
import { assertWebhookPaymentMatchesOrder } from "@/domains/payments/service/webhook-amount-guard";
import {
  orderStatusForEvent,
  paymentStatusForEvent,
} from "@/domains/commerce/status-map";

const webhookPayloadSchema = z.object({
  eventId: z.string().min(8).max(128),
  type: z.enum([
    "payment.succeeded",
    "payment.failed",
    "payment.cancelled",
    "payment.refunded",
    "payment.chargeback",
  ]),
  providerPaymentId: z.string().min(1).max(128),
  orderId: z.string().min(1).max(64).optional().nullable(),
  amountMinor: z.number().int().nonnegative().optional().nullable(),
  currency: z.string().min(3).max(3).optional().nullable(),
  reason: z.string().max(500).optional().nullable(),
});

export type PaymentWebhookResult =
  | { ok: true; duplicate: boolean; orderId: string | null }
  | { ok: false; status: number; error: string };

export async function processPaymentWebhook(input: {
  rawBody: string;
  headers: Headers;
  provider?: string;
}): Promise<PaymentWebhookResult> {
  const config = resolvePaymentsConfig();
  const secret = config.webhookSecret;
  const provider = input.provider ?? config.provider;

  if (!secret) {
    return { ok: false, status: 503, error: "Webhook secret not configured." };
  }

  const verification = verifyPaymentsWebhookSignature({
    secret,
    body: input.rawBody,
    signatureHeader: input.headers.get("x-majetio-payments-signature"),
    timestampHeader: input.headers.get("x-majetio-payments-timestamp"),
    toleranceSeconds: config.webhookToleranceSeconds,
  });

  if (!verification.ok) {
    // Replay / signature failure — audit row without processing
    if (verification.reason.includes("Timestamp outside")) {
      try {
        const peek = JSON.parse(input.rawBody) as { eventId?: string; type?: string };
        if (peek.eventId) {
          await prisma.paymentWebhookEvent.upsert({
            where: {
              provider_eventId: { provider, eventId: peek.eventId },
            },
            create: {
              provider,
              eventId: peek.eventId,
              eventType: peek.type ?? "unknown",
              payload: peek as object,
              signatureOk: false,
              replayRejected: true,
              providerTimestamp: Number(
                input.headers.get("x-majetio-payments-timestamp"),
              ) || null,
            },
            update: { replayRejected: true, signatureOk: false },
          });
        }
      } catch {
        /* ignore audit failures */
      }
    }
    return { ok: false, status: 401, error: verification.reason };
  }

  const providerTimestamp = Number(
    input.headers.get("x-majetio-payments-timestamp"),
  );

  let json: unknown;
  try {
    json = JSON.parse(input.rawBody);
  } catch {
    return { ok: false, status: 400, error: "Invalid JSON." };
  }

  const parsed = webhookPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return { ok: false, status: 400, error: "Payload validation failed." };
  }
  const payload = parsed.data;

  // Idempotent claim via unique (provider, eventId) — then atomic processedAt claim
  const eventRow = await prisma.paymentWebhookEvent.upsert({
    where: {
      provider_eventId: { provider, eventId: payload.eventId },
    },
    create: {
      provider,
      eventId: payload.eventId,
      eventType: payload.type,
      payload: payload as object,
      signatureOk: true,
      providerTimestamp: Number.isFinite(providerTimestamp)
        ? providerTimestamp
        : null,
    },
    update: {
      signatureOk: true,
    },
  });

  if (eventRow.processedAt) {
    return { ok: true, duplicate: true, orderId: payload.orderId ?? null };
  }

  // Atomic claim — only one concurrent worker proceeds past this point
  const claimed = await prisma.paymentWebhookEvent.updateMany({
    where: { id: eventRow.id, processedAt: null },
    data: {
      // Temporary claim marker: set processedAt now; clear on failure so retry can reclaim
      processedAt: new Date(),
      processError: "processing",
    },
  });
  if (claimed.count !== 1) {
    return { ok: true, duplicate: true, orderId: payload.orderId ?? null };
  }

  try {
    await dispatchWebhookEvent(payload.type, payload);
    await prisma.paymentWebhookEvent.update({
      where: { id: eventRow.id },
      data: { processError: null },
    });
    return { ok: true, duplicate: false, orderId: payload.orderId ?? null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Processing failed";
    await prisma.paymentWebhookEvent.update({
      where: { id: eventRow.id },
      data: { processedAt: null, processError: message },
    });
    return { ok: false, status: 500, error: message };
  }
}

async function dispatchWebhookEvent(
  type: WebhookEventType,
  payload: z.infer<typeof webhookPayloadSchema>,
) {
  const payment = await prisma.payment.findFirst({
    where: {
      OR: [
        { providerPaymentId: payload.providerPaymentId },
        ...(payload.orderId ? [{ orderId: payload.orderId }] : []),
      ],
    },
    include: { order: true },
  });
  if (!payment) {
    throw new Error("Payment not found for webhook.");
  }

  const order = payment.order;

  switch (type) {
    case "payment.succeeded": {
      if (payment.status === "SUCCEEDED" && order.status === "PAID") {
        return; // idempotent no-op
      }
      assertWebhookPaymentMatchesOrder({
        payloadAmountMinor: payload.amountMinor,
        payloadCurrency: payload.currency,
        orderAmountGrossMinor: order.amountGrossMinor,
        orderCurrency: order.currency,
        paymentAmountGrossMinor: payment.amountGrossMinor,
        paymentCurrency: payment.currency,
      });
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: paymentStatusForEvent(type),
            rawProviderStatus: type,
            failureCode: null,
            failureMessage: null,
          },
        });
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: orderStatusForEvent(type),
            paidAt: new Date(),
          },
        });
      });
      // Grant outside payment status update — failure → PENDING_GRANT, not unpaid
      // 177–179: entitlements only after webhook confirmed PAID
      await grantEntitlementForPaidOrder({
        userId: order.userId,
        orderId: order.id,
        productKey: order.productKey,
        analysisId: order.analysisId,
        propertyId: order.propertyId,
        organizationId: order.organizationId,
      });
      // Phase 6 — canonical ledger (idempotent; ≠ GMV metric)
      const { recognizeCommerceRevenueForPaidOrder } = await import(
        "@/domains/revenue/commerce-recognition"
      );
      await recognizeCommerceRevenueForPaidOrder({
        orderId: order.id,
        userId: order.userId,
        productKey: order.productKey,
        amountGrossMinor: order.amountGrossMinor,
        organizationId: order.organizationId,
        currency: order.currency,
      });
      return;
    }
    case "payment.failed": {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: paymentStatusForEvent(type),
          rawProviderStatus: type,
          failureCode: "provider_failed",
          failureMessage: payload.reason ?? "Payment failed",
        },
      });
      await prisma.order.update({
        where: { id: order.id },
        data: { status: orderStatusForEvent(type) },
      });
      // Explicitly do NOT create entitlement
      return;
    }
    case "payment.cancelled": {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: paymentStatusForEvent(type),
          rawProviderStatus: type,
          failureMessage: payload.reason ?? "Cancelled",
        },
      });
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: orderStatusForEvent(type),
          cancelledAt: new Date(),
        },
      });
      return;
    }
    case "payment.refunded":
    case "payment.chargeback": {
      await applyRefundOrChargeback({
        orderId: order.id,
        paymentId: payment.id,
        amountMinor: payload.amountMinor ?? payment.amountGrossMinor,
        currency: payload.currency ?? payment.currency,
        kind: type === "payment.chargeback" ? "chargeback" : "refund",
        reason: payload.reason ?? type,
        providerRefundId: payload.eventId,
      });
      return;
    }
    default:
      throw new Error(`Unhandled webhook type: ${type}`);
  }
}
