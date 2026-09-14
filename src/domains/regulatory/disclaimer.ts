/**
 * Legal disclaimer guardrails (Prompt 17.4).
 * Majetio must NEVER claim a buyer can "definitely" purchase —
 * foreign ownership / eligibility always requires legal verification.
 */

export const LEGAL_VERIFICATION_REQUIRED_NOTICE_EN =
  "Majetio does not confirm that you can buy this property. Eligibility (including foreign ownership, freehold/leasehold, and financing) requires independent legal verification.";

export const LEGAL_VERIFICATION_REQUIRED_NOTICE_CS =
  "Majetio nepotvrzuje, že tuto nemovitost můžete koupit. Oprávnění (včetně cizineckého vlastnictví, formy vlastnictví a financování) vyžaduje nezávislé právní ověření.";

/** Phrases that must not appear in product copy about purchase eligibility. */
const FORBIDDEN_CERTAIN_PURCHASE_PATTERNS: readonly RegExp[] = [
  /\bdefinitely\s+can\s+buy\b/i,
  /\bguaranteed\s+(to\s+)?(buy|purchase|own)\b/i,
  /\byou\s+can\s+definitely\s+buy\b/i,
  /\burčitě\s+můžete\s+koupit\b/i,
  /\bjistotou\s+koupíte\b/i,
  /\bguaranteed\s+eligibility\b/i,
];

export function containsForbiddenCertainPurchaseClaim(text: string): boolean {
  return FORBIDDEN_CERTAIN_PURCHASE_PATTERNS.some((re) => re.test(text));
}

/**
 * Throws if copy asserts certain purchase eligibility.
 * Use in content lint / admin preview — not for user-generated notes.
 */
export function assertNoCertainPurchaseClaim(
  text: string,
  context = "copy",
): void {
  if (containsForbiddenCertainPurchaseClaim(text)) {
    throw new Error(
      `Forbidden certain-purchase claim in ${context}. Use legal verification notice instead.`,
    );
  }
}

export function foreignOwnershipDisclaimer(input: {
  marketCode: string;
  locale?: string;
}): string {
  const cs = (input.locale ?? "en").startsWith("cs");
  if (input.marketCode.toUpperCase() === "AE") {
    return cs
      ? "Pravidla freehold/leasehold a cizineckého vlastnictví se liší podle emirátu. Výsledek vždy ověřte u právního zástupce."
      : "Freehold/leasehold and foreign-ownership rules vary by emirate. Always verify with qualified counsel before committing.";
  }
  return cs
    ? LEGAL_VERIFICATION_REQUIRED_NOTICE_CS
    : LEGAL_VERIFICATION_REQUIRED_NOTICE_EN;
}

export type RegulatoryDisclaimerBundle = {
  legalVerificationRequired: string;
  notLegalAdvice: string;
  estimatesOnly: string;
};

export function buildRegulatoryDisclaimerBundle(locale = "en"): RegulatoryDisclaimerBundle {
  const cs = locale.startsWith("cs");
  return {
    legalVerificationRequired: cs
      ? LEGAL_VERIFICATION_REQUIRED_NOTICE_CS
      : LEGAL_VERIFICATION_REQUIRED_NOTICE_EN,
    notLegalAdvice: cs
      ? "Toto není právní ani daňové poradenství."
      : "This is not legal or tax advice.",
    estimatesOnly: cs
      ? "Odhadní údaje — ověřte aktuální sazby a limity u kvalifikovaného poradce."
      : "Estimates only — verify current rates and limits with a qualified adviser.",
  };
}
