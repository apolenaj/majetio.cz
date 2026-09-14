/**
 * Transactional vs marketing communication — Privacy-by-Default.
 *
 * Transactional messages (security, account, order, lead status) do NOT require
 * marketing consent. They must never embed Financial Passport amounts — only
 * deep links into the authenticated app.
 */

export type CommunicationKind = "transactional" | "marketing";

/** Templates that are always transactional (no marketing consent gate). */
export const TRANSACTIONAL_EMAIL_KINDS = [
  "password_reset",
  "email_change_confirm",
  "welcome",
  "mortgage_lead_status",
  "order_receipt",
  "security_alert",
] as const;

export type TransactionalEmailKind =
  (typeof TRANSACTIONAL_EMAIL_KINDS)[number];

export function requiresMarketingConsent(
  kind: CommunicationKind,
): boolean {
  return kind === "marketing";
}

/** Patterns that must never appear in transactional email bodies. */
export const FORBIDDEN_IN_TRANSACTIONAL_BODY = [
  /monthlyIncomeCzk/i,
  /availableEquityCzk/i,
  /monthlyLiabilitiesCzk/i,
  /passwordHash/i,
  /\b\d{1,3}(?:[ \u00a0]\d{3})+(?:[.,]\d{2})?\s*(?:Kč|CZK)\b/,
] as const;

export function assertTransactionalBodySafe(body: string): {
  ok: boolean;
  reason?: string;
} {
  for (const pattern of FORBIDDEN_IN_TRANSACTIONAL_BODY) {
    if (pattern.test(body)) {
      return { ok: false, reason: `Forbidden pattern: ${pattern}` };
    }
  }
  return { ok: true };
}

/**
 * Cookie / CMP gate for product analytics (client).
 * Transactional email send path ignores cookie analytics consent.
 */
export function canSendTransactionalEmail(_opts?: {
  marketingConsent?: boolean | null;
}): true {
  void _opts;
  return true;
}
