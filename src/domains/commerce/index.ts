/**
 * Commerce Data Layer public API.
 */

export {
  listActivePricingPlans,
  getActivePricingPlanByKey,
  ensureDefaultPricingPlans,
  toPublicPricingPlan,
  type PublicPricingPlan,
  type PricingPlanLimits,
  type ListPricingPlansInput,
} from "./catalog";

export {
  AE_LOCAL_PRICING_SEEDS,
  ES_LOCAL_PRICING_SEEDS,
  listLocalPricingSeedsForMarket,
  assertNotFxDerivedListPrice,
  type LocalPricingPlanSeed,
} from "./local-pricing";

export {
  assertSubscriptionUnchangedOnMarketSwitch,
  assertPricingPlanMarketMatch,
  SubscriptionMarketChangeError,
  type SubscriptionMarketLock,
} from "./subscription-market-lock";

export {
  resolvePromotionByCode,
  computePromotionDiscount,
  type ResolvedPromotion,
} from "./promotions";

export { buildCommerceLineQuote, type CommerceLineQuote } from "./quote";

export {
  assertCatalogProductCheckoutAllowed,
  isCatalogProductCheckoutAllowed,
  isCatalogProductPubliclyListed,
  getCatalogProductDef,
} from "./product-availability";

export {
  mapProviderStatusToEventType,
  paymentStatusForEvent,
  orderStatusForEvent,
  type ProviderPaymentEventType,
} from "./status-map";

export {
  buildPricingPageModel,
  type PricingCardViewModel,
} from "./pricing-page-model";

export {
  PURCHASE_CONSENT_COPY_CS,
  PURCHASE_TERMS_VERSION,
  recordPurchaseTermsAcceptance,
  assertNoMarketingBundledWithPurchase,
} from "./purchase-consent";

export {
  CONSUMER_WITHDRAWAL_STATUS,
  isConsumerWithdrawalEnabled,
  assertConsumerWithdrawalEnabled,
} from "./consumer-withdrawal";

export {
  AUTOMATED_INVOICE_STATUS,
  isAutomatedInvoiceEnabled,
  assertAutomatedInvoiceEnabled,
  generateTaxInvoice,
} from "./invoices";
