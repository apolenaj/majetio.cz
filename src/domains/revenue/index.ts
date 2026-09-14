/**
 * Revenue attribution & B2B lead monetization.
 */

export {
  decideLeadAttribution,
  type AttributionTouchpoint,
  type AttributionDecision,
} from "./attribution";

export {
  recordRevenueEvent,
  reverseRevenueEvent,
  markRevenueDisputed,
  type RecordRevenueInput,
  type RecordRevenueResult,
} from "./ledger";

export {
  getOrgLeadBillingSettings,
  setOrgLeadBillingMode,
  chargePayPerLead,
  createSuccessFeePotential,
  submitSuccessFeeForVerification,
  verifySuccessFee,
  markSuccessFeeInvoiced,
  type OrgLeadBillingSettings,
} from "./billing";

export {
  createLeadAttribution,
  resolveAttributionReview,
} from "./attribution-service";

export {
  openLeadDispute,
  submitDisputeEvidence,
  resolveLeadDispute,
  isLeadBillable,
} from "./disputes";

export {
  revenueAttributionConfig,
  computeSuccessFeeAmountMinor,
  revenueIdempotencyKey,
  DEFAULT_ATTRIBUTION_WINDOW_DAYS,
  DEFAULT_PAY_PER_LEAD_PRICE_MINOR,
  DEFAULT_SUCCESS_FEE_BPS,
} from "@/config/revenue-attribution";

export {
  QUALIFIED_LEAD_BILLING_CONDITIONS,
  describeLeadBillingConditionsCs,
  shouldChargePayPerLeadOnAccept,
} from "./lead-billing-conditions";

export {
  TRANSACTION_SUCCESS_FEE_MODEL,
  getTransactionSuccessFeePublicSurface,
  assertTransactionSuccessFeeForCheckout,
  isTransactionSuccessFeeHiddenByDefault,
} from "./success-fee-model";

export {
  getMonetizationDashboardMetrics,
  mapProductKeyToRevenueSource,
  normalizeToMonthlyMinor,
  computeActiveSubscriptionMrrMinor,
  type MonetizationDashboardMetrics,
} from "./metrics";

export {
  estimateCustomerLtvMinor,
  estimateCacMinor,
  ltvToCacRatio,
  resolveCacInputs,
  assertLtvDoesNotUseGmv,
  LTV_CAC_GUARDRAILS,
} from "./ltv-cac";

export {
  assertNoForcedDoubleAttribution,
  commerceRevenueIdempotencyParts,
} from "./double-attribution";

export { recognizeCommerceRevenueForPaidOrder } from "./commerce-recognition";

export {
  writeMonetizationAuditLog,
  listMonetizationAuditLogs,
  MONETIZATION_AUDIT_ACTIONS,
} from "./monetization-audit";

export {
  reconcilePaymentsEntitlementsAndRevenue,
  type ReconciliationReport,
} from "./reconciliation";
