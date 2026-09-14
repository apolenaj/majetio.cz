/**
 * Explicit consent recipients — never "our partners" (Rules 199, 222–224).
 * Lead data sharing requires a named legal subject.
 */

export type ConsentRecipient = {
  /** Stable code, e.g. hypotekajasne */
  code: string;
  /** Display name shown in UI checkbox (must be concrete). */
  displayName: string;
  legalName: string;
  url: string | null;
  /** Markets where this recipient may receive data. */
  marketCodes: readonly string[];
  purposeEn: string;
  purposeLocal?: string;
};

export const CONSENT_RECIPIENTS: readonly ConsentRecipient[] = [
  {
    code: "hypotekajasne",
    displayName: "HypotekaJasne",
    legalName: "HypotekaJasne",
    url: "https://hypotekajasne.cz",
    marketCodes: ["CZ"],
    purposeEn:
      "Assessment of mortgage / financing options and possible contact by an adviser.",
    purposeLocal:
      "Posouzení možností hypotečního / úvěrového financování a případný kontakt ze strany poradce.",
  },
] as const;

export class ConsentRecipientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConsentRecipientError";
  }
}

const FORBIDDEN_GENERIC_LABELS = [
  "our partners",
  "partners",
  "partneři",
  "další partneři",
  "third parties",
  "třetí strany",
] as const;

export function isGenericPartnerLabel(label: string): boolean {
  const n = label.trim().toLowerCase();
  return FORBIDDEN_GENERIC_LABELS.some(
    (g) => n === g || n.includes(` ${g}`) || n.startsWith(g),
  );
}

export function getConsentRecipient(code: string): ConsentRecipient | null {
  return CONSENT_RECIPIENTS.find((r) => r.code === code) ?? null;
}

export function resolveConsentRecipientForMarket(input: {
  recipientCode: string;
  marketCode: string;
}): ConsentRecipient {
  const recipient = getConsentRecipient(input.recipientCode);
  if (!recipient) {
    throw new ConsentRecipientError(
      `Unknown consent recipient: ${input.recipientCode}`,
    );
  }
  if (isGenericPartnerLabel(recipient.displayName)) {
    throw new ConsentRecipientError(
      "Consent recipient must be a named subject — generic partner labels are forbidden.",
    );
  }
  const market = input.marketCode.toUpperCase();
  if (!recipient.marketCodes.includes(market)) {
    throw new ConsentRecipientError(
      `Recipient ${recipient.code} is not allowed for market ${market}.`,
    );
  }
  return recipient;
}

/**
 * Metadata persisted on Consent.metadata for lead handoff.
 * Always includes explicit recipient identity.
 */
export function buildLeadShareConsentMetadata(input: {
  recipientCode: string;
  marketCode: string;
  fieldKeys: string[];
  correlationId?: string;
}): {
  recipientCode: string;
  recipientDisplayName: string;
  recipientLegalName: string;
  marketCode: string;
  fieldKeys: string[];
  correlationId?: string;
  /** Explicit anti-pattern flag for auditors. */
  genericPartnersForbidden: true;
} {
  const recipient = resolveConsentRecipientForMarket({
    recipientCode: input.recipientCode,
    marketCode: input.marketCode,
  });
  return {
    recipientCode: recipient.code,
    recipientDisplayName: recipient.displayName,
    recipientLegalName: recipient.legalName,
    marketCode: input.marketCode.toUpperCase(),
    fieldKeys: [...input.fieldKeys],
    correlationId: input.correlationId,
    genericPartnersForbidden: true,
  };
}

/** UI copy helper — never returns "our partners". */
export function consentRecipientCheckboxLabel(
  recipient: ConsentRecipient,
  locale = "cs",
): string {
  if (locale.startsWith("cs")) {
    return `Souhlasím s předáním vybraných údajů subjektu ${recipient.displayName}`;
  }
  return `I agree to share selected data with ${recipient.displayName}`;
}
