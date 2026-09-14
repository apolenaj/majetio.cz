/**
 * Domain types mirroring Prisma LegalDocument / ConsentRecord.
 * Safe to import in UI without pulling Prisma client.
 */

export type LegalDocumentType = "TERMS" | "PRIVACY" | "COOKIES" | "LEGAL_NOTICE";
export type LegalDocumentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type LegalDocumentRecord = {
  type: LegalDocumentType;
  version: string;
  status: LegalDocumentStatus;
  title: string;
  content: string;
  summary: string | null;
  locale: string;
  marketCode: string;
  publishedAt: string | null;
  effectiveFrom: string | null;
};

export type ConsentPurpose =
  | "COOKIE_NECESSARY"
  | "COOKIE_PREFERENCES"
  | "COOKIE_ANALYTICS"
  | "COOKIE_MARKETING"
  | "MARKETING_COMMUNICATION"
  | "PARTNER_DATA_SHARE"
  | "LEGAL_TERMS"
  | "LEGAL_PRIVACY";

export type ConsentRecordInput = {
  userId?: string | null;
  visitorId?: string | null;
  purpose: ConsentPurpose;
  /** Required when purpose === PARTNER_DATA_SHARE */
  recipient?: string | null;
  sharedScope?: string[] | Record<string, unknown> | null;
  version: string;
  granted: boolean;
  legalDocVersion?: string | null;
  metadata?: Record<string, unknown> | null;
};

/**
 * Rejects generic partner consent — recipient + purpose must be explicit.
 */
export function assertPartnerShareConsent(input: {
  purpose: ConsentPurpose;
  recipient?: string | null;
  sharedScope?: unknown;
}): { ok: true } | { ok: false; error: string } {
  if (input.purpose !== "PARTNER_DATA_SHARE") return { ok: true };
  const recipient = input.recipient?.trim() ?? "";
  if (!recipient || /partneři|partners?/i.test(recipient)) {
    return {
      ok: false,
      error:
        "PARTNER_DATA_SHARE vyžaduje přesného příjemce — ne obecný souhlas s partnery.",
    };
  }
  if (
    input.sharedScope == null ||
    (Array.isArray(input.sharedScope) && input.sharedScope.length === 0)
  ) {
    return {
      ok: false,
      error: "PARTNER_DATA_SHARE vyžaduje sharedScope (pole / kategorie dat).",
    };
  }
  return { ok: true };
}
