/**
 * Disabled PSP — used when PAYMENTS_PROVIDER=none (or mock banned in production).
 */

import type {
  CreateCheckoutSessionInput,
  CreateCheckoutSessionResult,
  PaymentProvider,
} from "../types";

export function createDisabledPaymentProvider(): PaymentProvider {
  return {
    id: "none",
    async createCheckoutSession(
      _input: CreateCheckoutSessionInput,
    ): Promise<CreateCheckoutSessionResult> {
      throw new Error(
        "Payment provider is not configured (PAYMENTS_PROVIDER=none).",
      );
    },
  };
}
