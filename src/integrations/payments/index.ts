import { resolvePaymentsConfig, isPaymentsMockAllowed } from "./config";
import { createDisabledPaymentProvider } from "./providers/disabled-provider";
import { createMockPaymentProvider } from "./providers/mock-provider";
import type { PaymentProvider } from "./types";

export function getPaymentProvider(): PaymentProvider {
  const config = resolvePaymentsConfig();
  if (config.provider === "mock" && isPaymentsMockAllowed()) {
    return createMockPaymentProvider();
  }
  return createDisabledPaymentProvider();
}

export {
  resolvePaymentsConfig,
  isPaymentsMockAllowed,
  type PaymentsRuntimeConfig,
} from "./config";
export {
  verifyPaymentsWebhookSignature,
  signPaymentsWebhookBody,
  PAYMENTS_SIGNATURE_HEADER,
  PAYMENTS_TIMESTAMP_HEADER,
  PAYMENTS_EVENT_ID_HEADER,
} from "./security/webhook-signing";
export type {
  PaymentProvider,
  NormalizedWebhookEvent,
  WebhookEventType,
} from "./types";
