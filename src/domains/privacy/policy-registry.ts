/**
 * PrivacyPolicyRegistry — versioned consents per market (Prompt 17.5).
 * Do not collect data that is not necessary (e.g. tax residence without reason).
 */

export const PRIVACY_DOCUMENT_KINDS = [
  "PRIVACY_POLICY",
  "TERMS_OF_USE",
  "COOKIE_POLICY",
  "MARKETING_CONSENT",
  "PARTNER_HANDOFF",
] as const;

export type PrivacyDocumentKind = (typeof PRIVACY_DOCUMENT_KINDS)[number];

export type PrivacyPolicyEntry = {
  marketCode: string;
  kind: PrivacyDocumentKind;
  version: string;
  locale: string;
  titleEn: string;
  documentUrl: string;
  effectiveFrom: string;
  /** When users must re-consent if previously granted older version. */
  requiresReconsentFromVersion: string | null;
  /** Jurisdiction note (GDPR, PDPL, …). */
  jurisdictionEn: string;
  isCurrent: boolean;
};

/**
 * Data minimization — fields that must NOT be collected without explicit product need.
 */
export const FORBIDDEN_PASSPORT_FIELDS_WITHOUT_JUSTIFICATION = [
  "taxResidenceCountry",
  "nationalIdNumber",
  "passportNumber",
  "fullBankAccountIban",
  "exactEmployerPayroll",
] as const;

export type ForbiddenPassportField =
  (typeof FORBIDDEN_PASSPORT_FIELDS_WITHOUT_JUSTIFICATION)[number];

export const PRIVACY_POLICY_REGISTRY: readonly PrivacyPolicyEntry[] = [
  {
    marketCode: "CZ",
    kind: "PRIVACY_POLICY",
    version: "2026-07-01",
    locale: "cs-CZ",
    titleEn: "Privacy policy (CZ)",
    documentUrl: "/ochrana-soukromi",
    effectiveFrom: "2026-07-01",
    requiresReconsentFromVersion: null,
    jurisdictionEn: "GDPR / Czech law",
    isCurrent: true,
  },
  {
    marketCode: "CZ",
    kind: "TERMS_OF_USE",
    version: "2026-07-01",
    locale: "cs-CZ",
    titleEn: "Terms of use (CZ)",
    documentUrl: "/podminky",
    effectiveFrom: "2026-07-01",
    requiresReconsentFromVersion: null,
    jurisdictionEn: "Czech law",
    isCurrent: true,
  },
  {
    marketCode: "CZ",
    kind: "MARKETING_CONSENT",
    version: "2026-07-01",
    locale: "cs-CZ",
    titleEn: "Marketing consent (CZ)",
    documentUrl: "/ochrana-soukromi#marketing",
    effectiveFrom: "2026-07-01",
    requiresReconsentFromVersion: null,
    jurisdictionEn: "GDPR",
    isCurrent: true,
  },
  {
    marketCode: "*",
    kind: "PRIVACY_POLICY",
    version: "com.2026.07-draft",
    locale: "en-GB",
    titleEn: "Privacy policy (international draft)",
    documentUrl: "/privacy",
    effectiveFrom: "2026-07-01",
    requiresReconsentFromVersion: null,
    jurisdictionEn: "Market-specific — not LIVE until counsel review",
    isCurrent: false,
  },
  {
    marketCode: "AE",
    kind: "PRIVACY_POLICY",
    version: "ae.privacy.research",
    locale: "en-AE",
    titleEn: "Privacy policy (UAE research)",
    documentUrl: "/markets/ae/privacy",
    effectiveFrom: "2026-07-01",
    requiresReconsentFromVersion: null,
    jurisdictionEn: "UAE PDPL research — not production",
    isCurrent: false,
  },
] as const;

export function listPrivacyPolicies(marketCode: string): PrivacyPolicyEntry[] {
  const code = marketCode.toUpperCase();
  return PRIVACY_POLICY_REGISTRY.filter(
    (p) => p.marketCode === code || p.marketCode === "*",
  );
}

export function getCurrentPrivacyPolicy(input: {
  marketCode: string;
  kind: PrivacyDocumentKind;
  locale?: string;
}): PrivacyPolicyEntry | null {
  const entries = listPrivacyPolicies(input.marketCode).filter(
    (p) => p.kind === input.kind && p.isCurrent,
  );
  if (input.locale) {
    const exact = entries.find((p) => p.locale === input.locale);
    if (exact) return exact;
  }
  return entries[0] ?? null;
}

export function requiresReconsent(input: {
  marketCode: string;
  kind: PrivacyDocumentKind;
  grantedVersion: string;
}): boolean {
  const current = getCurrentPrivacyPolicy({
    marketCode: input.marketCode,
    kind: input.kind,
  });
  if (!current) return false;
  if (current.version === input.grantedVersion) return false;
  if (current.requiresReconsentFromVersion == null) {
    return current.version !== input.grantedVersion;
  }
  return true;
}

export function isForbiddenPassportFieldWithoutJustification(
  field: string,
): field is ForbiddenPassportField {
  return (
    FORBIDDEN_PASSPORT_FIELDS_WITHOUT_JUSTIFICATION as readonly string[]
  ).includes(field);
}

/**
 * Assert product code does not persist minimized-away fields.
 */
export function assertPassportFieldAllowed(
  field: string,
  justification?: string,
): void {
  if (!isForbiddenPassportFieldWithoutJustification(field)) return;
  if (!justification?.trim()) {
    throw new Error(
      `Forbidden to collect ${field} without documented product justification (data minimization).`,
    );
  }
}
