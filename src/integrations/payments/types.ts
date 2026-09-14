/**
 * Payment provider adapter interface.
 */

export type CreateCheckoutSessionInput = {
  orderId: string;
  paymentId: string;
  amountGrossMinor: number;
  currency: string;
  productKey: string;
  productName: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
};

export type CreateCheckoutSessionResult = {
  providerPaymentId: string;
  checkoutUrl: string;
};

export type ProviderRefundInput = {
  providerPaymentId: string;
  amountMinor: number;
  currency: string;
  reason?: string;
};

export type PaymentProvider = {
  id: string;
  createCheckoutSession(
    input: CreateCheckoutSessionInput,
  ): Promise<CreateCheckoutSessionResult>;
  createRefund?(
    input: ProviderRefundInput,
  ): Promise<{ providerRefundId: string }>;
};

export type WebhookEventType =
  | "payment.succeeded"
  | "payment.failed"
  | "payment.cancelled"
  | "payment.refunded"
  | "payment.chargeback";

export type NormalizedWebhookEvent = {
  eventId: string;
  type: WebhookEventType;
  providerPaymentId: string;
  orderId?: string | null;
  amountMinor?: number | null;
  currency?: string | null;
  reason?: string | null;
  raw: unknown;
};
