/**
 * Mock payment provider for local/dev — never use in production without flag.
 */

import { randomBytes } from "node:crypto";

import type {
  CreateCheckoutSessionInput,
  CreateCheckoutSessionResult,
  PaymentProvider,
  ProviderRefundInput,
} from "../types";
import { resolvePaymentsConfig } from "../config";

export function createMockPaymentProvider(): PaymentProvider {
  return {
    id: "mock",
    async createCheckoutSession(
      input: CreateCheckoutSessionInput,
    ): Promise<CreateCheckoutSessionResult> {
      const config = resolvePaymentsConfig();
      const providerPaymentId = `mock_pay_${randomBytes(8).toString("hex")}`;
      const checkoutUrl = `${config.publicBaseUrl}/checkout/mock-pay?paymentId=${encodeURIComponent(input.paymentId)}&providerPaymentId=${encodeURIComponent(providerPaymentId)}&orderId=${encodeURIComponent(input.orderId)}`;
      return { providerPaymentId, checkoutUrl };
    },
    async createRefund(input: ProviderRefundInput) {
      return {
        providerRefundId: `mock_ref_${randomBytes(6).toString("hex")}`,
      };
    },
  };
}
