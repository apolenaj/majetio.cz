/**
 * Map provider webhook / API statuses → Majetio PaymentStatus / OrderStatus.
 */

import type { OrderStatus, PaymentStatus } from "@prisma/client";

export type ProviderPaymentEventType =
  | "payment.succeeded"
  | "payment.failed"
  | "payment.cancelled"
  | "payment.refunded"
  | "payment.chargeback";

/** Stripe-like and mock provider raw status → canonical event type. */
export function mapProviderStatusToEventType(
  raw: string,
): ProviderPaymentEventType | null {
  const s = raw.trim().toLowerCase().replace(/\s+/g, "_");
  const map: Record<string, ProviderPaymentEventType> = {
    succeeded: "payment.succeeded",
    success: "payment.succeeded",
    paid: "payment.succeeded",
    complete: "payment.succeeded",
    completed: "payment.succeeded",
    "payment_intent.succeeded": "payment.succeeded",
    "checkout.session.completed": "payment.succeeded",
    failed: "payment.failed",
    "payment_intent.payment_failed": "payment.failed",
    declined: "payment.failed",
    cancelled: "payment.cancelled",
    canceled: "payment.cancelled",
    "payment_intent.canceled": "payment.cancelled",
    refunded: "payment.refunded",
    "charge.refunded": "payment.refunded",
    chargeback: "payment.chargeback",
    "charge.dispute.created": "payment.chargeback",
  };
  return map[s] ?? null;
}

export function paymentStatusForEvent(
  type: ProviderPaymentEventType,
  partial = false,
): PaymentStatus {
  switch (type) {
    case "payment.succeeded":
      return "SUCCEEDED";
    case "payment.failed":
      return "FAILED";
    case "payment.cancelled":
      return "CANCELLED";
    case "payment.refunded":
      return partial ? "PARTIALLY_REFUNDED" : "REFUNDED";
    case "payment.chargeback":
      return "CHARGEBACK";
    default:
      return "PENDING";
  }
}

export function orderStatusForEvent(
  type: ProviderPaymentEventType,
  partial = false,
): OrderStatus {
  switch (type) {
    case "payment.succeeded":
      return "PAID";
    case "payment.failed":
      return "AWAITING_PAYMENT";
    case "payment.cancelled":
      return "CANCELLED";
    case "payment.refunded":
      return partial ? "PARTIALLY_REFUNDED" : "REFUNDED";
    case "payment.chargeback":
      return "CHARGEBACK";
    default:
      return "PENDING";
  }
}
