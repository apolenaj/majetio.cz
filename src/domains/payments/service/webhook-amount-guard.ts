/**
 * Webhook amount / currency integrity — defense in depth after signature verify.
 */

export function assertWebhookPaymentMatchesOrder(input: {
  payloadAmountMinor?: number | null;
  payloadCurrency?: string | null;
  orderAmountGrossMinor: number;
  orderCurrency: string;
  paymentAmountGrossMinor: number;
  paymentCurrency: string;
}): void {
  if (input.paymentAmountGrossMinor !== input.orderAmountGrossMinor) {
    throw new Error("Payment amount does not match order.");
  }
  if (
    input.paymentCurrency.toUpperCase() !== input.orderCurrency.toUpperCase()
  ) {
    throw new Error("Payment currency does not match order.");
  }
  if (
    input.payloadAmountMinor != null &&
    input.payloadAmountMinor !== input.orderAmountGrossMinor
  ) {
    throw new Error("Webhook amount does not match order.");
  }
  if (
    input.payloadCurrency != null &&
    input.payloadCurrency.toUpperCase() !== input.orderCurrency.toUpperCase()
  ) {
    throw new Error("Webhook currency does not match order.");
  }
}
