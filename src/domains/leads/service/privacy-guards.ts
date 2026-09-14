/**
 * Privacy guards for mortgage lead logging and analytics (Prompt 13/10).
 * Never log income, liabilities, loan amounts, or other PII/finance values.
 */

import type { Prisma } from "@prisma/client";

const SENSITIVE_META_KEYS = new Set([
  "email",
  "phone",
  "contactName",
  "purchasePriceCzk",
  "availableEquityCzk",
  "monthlyIncomeCzk",
  "monthlyLiabilitiesCzk",
  "requestedLoanCzk",
  "estimatedLoanAmountCzk",
  "estimatedCommissionCzk",
  "sharedFields",
  "sharedFieldLabels",
  "lastPartnerPayload",
  "sensitive",
]);

export type SafeMortgageLeadAuditMeta = {
  correlationId?: string;
  externalLeadId?: string;
  leadId?: string;
  consentId?: string;
  isMock?: boolean;
  source?: string;
  type?: string;
  version?: string;
  consentTextVersion?: string;
  fieldCount?: number;
  workflowStatus?: string;
  linkedCount?: number;
  retentionAction?: string;
};

export function sanitizeMortgageLeadAuditMeta(
  meta: Record<string, unknown>,
): SafeMortgageLeadAuditMeta {
  const safe: SafeMortgageLeadAuditMeta = {};

  if (typeof meta.correlationId === "string") safe.correlationId = meta.correlationId;
  if (typeof meta.externalLeadId === "string") safe.externalLeadId = meta.externalLeadId;
  if (typeof meta.leadId === "string") safe.leadId = meta.leadId;
  if (typeof meta.consentId === "string") safe.consentId = meta.consentId;
  if (typeof meta.isMock === "boolean") safe.isMock = meta.isMock;
  if (typeof meta.source === "string") safe.source = meta.source;
  if (typeof meta.type === "string") safe.type = meta.type;
  if (typeof meta.version === "string") safe.version = meta.version;
  if (typeof meta.consentTextVersion === "string") {
    safe.consentTextVersion = meta.consentTextVersion;
  }
  if (typeof meta.workflowStatus === "string") safe.workflowStatus = meta.workflowStatus;
  if (typeof meta.retentionAction === "string") safe.retentionAction = meta.retentionAction;
  if (typeof meta.linkedCount === "number") safe.linkedCount = meta.linkedCount;

  if (Array.isArray(meta.sharedFields)) {
    safe.fieldCount = meta.sharedFields.length;
  } else if (typeof meta.fieldCount === "number") {
    safe.fieldCount = meta.fieldCount;
  }

  return safe;
}

export function toAuditJson(meta: SafeMortgageLeadAuditMeta): Prisma.InputJsonValue {
  return meta as Prisma.InputJsonValue;
}

export function sanitizeLeadActivityMeta(
  meta: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (SENSITIVE_META_KEYS.has(key)) continue;
    out[key] = value;
  }
  return out;
}

/** Strip financial values from objects before debug logging. */
export function redactMortgageLeadForLogs<T extends Record<string, unknown>>(
  record: T,
): Omit<
  T,
  | "email"
  | "phone"
  | "monthlyIncomeCzk"
  | "monthlyLiabilitiesCzk"
  | "purchasePriceCzk"
  | "availableEquityCzk"
> {
  const {
    email: _e,
    phone: _p,
    monthlyIncomeCzk: _i,
    monthlyLiabilitiesCzk: _l,
    purchasePriceCzk: _pp,
    availableEquityCzk: _eq,
    ...safe
  } = record;
  return safe;
}
