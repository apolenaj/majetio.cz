/**
 * Regulatory + transaction-cost domain (Prompt 17.4).
 */

export {
  CANONICAL_TENURE_TYPES,
  TENURE_ALIASES,
  tenureFromCzOwnershipType,
  isCanonicalTenureType,
  resolveTenureFromAlias,
  type CanonicalTenureType,
  type TenureAlias,
} from "@/domains/regulatory/ownership/tenure";

export {
  LEGAL_VERIFICATION_REQUIRED_NOTICE_EN,
  LEGAL_VERIFICATION_REQUIRED_NOTICE_CS,
  containsForbiddenCertainPurchaseClaim,
  assertNoCertainPurchaseClaim,
  foreignOwnershipDisclaimer,
  buildRegulatoryDisclaimerBundle,
  type RegulatoryDisclaimerBundle,
} from "@/domains/regulatory/disclaimer";

export {
  REGULATORY_RULE_KINDS,
  REGULATORY_RULE_STATUSES,
  isRuleActiveOn,
  type RegulatoryRule,
  type RegulatoryRuleKind,
  type RegulatoryRuleStatus,
  type ForeignOwnershipPayload,
  type LtvLimitPayload,
  type ShortTermRentalPayload,
} from "@/domains/regulatory/rules/types";

export {
  listRegulatoryRules,
  getRegulatoryRule,
  listActiveRegulatoryRules,
  listDemoRegulatoryRules,
  getForeignOwnershipOrientationalView,
  type ForeignOwnershipOrientationalView,
} from "@/domains/regulatory/rules/registry";

export {
  BUYER_RESIDENCY,
  BUYER_ENTITY,
  TRANSACTION_COST_LINE_KINDS,
  type BuyerResidency,
  type BuyerEntity,
  type BuyerProfile,
  type TransactionCostLineKind,
  type TransactionCostPack,
  type TransactionCostEstimateResult,
} from "@/domains/regulatory/transaction-costs/types";

export {
  getTransactionCostPack,
  listTransactionCostPacks,
  estimateTransactionCosts,
  transactionCostsToAcquisitionFeesMinor,
} from "@/domains/regulatory/transaction-costs/estimate";
