/**
 * Payments domain — checkout pricing, entitlements, webhooks, refunds.
 * See docs/PAYMENTS.md for Phase 2 monetization overview.
 */

export {
  applyPromoDiscount,
  buildPriceQuote,
  quoteFromOrderSnapshot,
  type PriceQuote,
  type PromoDefinition,
} from "./service/pricing";
export {
  grantEntitlementForPaidOrder,
  revokeEntitlementsForOrder,
  retryPendingEntitlementGrants,
  userHasActiveEntitlement,
} from "./service/entitlements";
export { processPaymentWebhook } from "./service/webhook-handler";
export {
  applyRefundOrChargeback,
  createManualRefund,
  createAdminRefund,
} from "./service/refunds";
