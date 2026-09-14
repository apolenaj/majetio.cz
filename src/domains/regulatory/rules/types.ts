/**
 * RegulatoryRule — versioned market rules (Prompt 17.4).
 */

export const REGULATORY_RULE_KINDS = [
  "FOREIGN_OWNERSHIP",
  "LTV_LIMIT",
  "SHORT_TERM_RENTAL",
  "TRANSACTION_COST",
  "TAX",
  "TENURE",
  "DISCLAIMER",
  "OTHER",
] as const;

export type RegulatoryRuleKind = (typeof REGULATORY_RULE_KINDS)[number];

export const REGULATORY_RULE_STATUSES = [
  "DRAFT",
  "REVIEWED",
  "ACTIVE",
  "SUPERSEDED",
  "RETIRED",
] as const;

export type RegulatoryRuleStatus = (typeof REGULATORY_RULE_STATUSES)[number];

export type RegulatoryRule = {
  /** Stable code within market, e.g. cz.foreign_ownership.eu */
  code: string;
  marketCode: string;
  kind: RegulatoryRuleKind;
  version: string;
  status: RegulatoryRuleStatus;
  /** ISO date (UTC) — inclusive. */
  validFrom: string;
  /** ISO date or null = open-ended. */
  validTo: string | null;
  /** When legal/ops last verified the pack. */
  verifiedAt: string | null;
  verifiedBy: string | null;
  titleEn: string;
  summaryEn: string;
  /**
   * Structured payload — never treat as permission to buy.
   * Always pair with legalVerificationRequired disclaimer.
   */
  payload: Record<string, unknown>;
  /** Forces UI to show legal verification notice when true. */
  requiresLegalVerificationNotice: boolean;
  /**
   * Demo / research packs must not be presented as production legal config.
   * Never hallucinate live rules into isDemo=false without counsel review.
   */
  isDemo: boolean;
};

export type ForeignOwnershipPayload = {
  foreignersMayOwn: "YES" | "RESTRICTED" | "NO" | "UNKNOWN";
  notesEn: string;
  /** Never assert certainty — always UNKNOWN unless counsel confirmed. */
  certainty: "ORIENTATIONAL";
};

export type LtvLimitPayload = {
  maxLtvPctPrimaryResidence: number | null;
  maxLtvPctInvestment: number | null;
  notesEn: string;
};

export type ShortTermRentalPayload = {
  permitted: "YES" | "RESTRICTED" | "NO" | "UNKNOWN";
  licenseRequired: boolean | null;
  notesEn: string;
};

export function isRuleActiveOn(
  rule: RegulatoryRule,
  asOfIsoDate: string,
  options?: { allowDemo?: boolean },
): boolean {
  if (rule.isDemo && !options?.allowDemo) return false;
  if (rule.status !== "ACTIVE") return false;
  if (rule.validFrom > asOfIsoDate) return false;
  if (rule.validTo != null && rule.validTo < asOfIsoDate) return false;
  return true;
}
