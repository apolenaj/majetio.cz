/**
 * Centralized marketplace buyer qualification rules.
 *
 * ALLOW-LIST only — never use protected / discriminatory attributes
 * (age, gender, race, ethnicity, nationality, religion, marital status,
 * disability, family status, sexual orientation, genetics, biometrics, …).
 */

export const QUALIFICATION_RULE_VERSION = "marketplace-qualify.v1" as const;

/** Attributes that MUST NEVER appear in qualification inputs or scoring. */
export const FORBIDDEN_QUALIFICATION_ATTRIBUTES = [
  "age",
  "dateOfBirth",
  "gender",
  "sex",
  "race",
  "ethnicity",
  "nationality",
  "citizenship",
  "religion",
  "maritalStatus",
  "familyStatus",
  "disability",
  "health",
  "sexualOrientation",
  "pregnancy",
  "politicalViews",
  "geneticData",
  "biometricData",
  "photoForBiometrics",
] as const;

export type ForbiddenQualificationAttribute =
  (typeof FORBIDDEN_QUALIFICATION_ATTRIBUTES)[number];

export const TIMELINE_BANDS = ["0_3m", "3_6m", "6_12m", "12m_plus"] as const;
export type TimelineBand = (typeof TIMELINE_BANDS)[number];

export const TIMELINE_BAND_LABELS_CS: Record<TimelineBand, string> = {
  "0_3m": "Do 3 měsíců",
  "3_6m": "3–6 měsíců",
  "6_12m": "6–12 měsíců",
  "12m_plus": "12+ měsíců",
};

export const FINANCING_STANCE_LABELS_CS = {
  UNKNOWN: "Neuvedeno",
  CASH: "Hotovost / vlastní prostředky",
  MORTGAGE_PREAPPROVED: "Hypotéka — předschváleno",
  MORTGAGE_EXPLORING: "Hypotéka — řeší financování",
  MIXED: "Kombinace hotovost + úvěr",
} as const;

export type QualificationInput = {
  contactVerification:
    | "UNVERIFIED"
    | "EMAIL_VERIFIED"
    | "PHONE_VERIFIED"
    | "EMAIL_AND_PHONE_VERIFIED";
  /** Buyer declared or derived budget band (CZK). */
  budgetBandMinCzk?: number | null;
  budgetBandMaxCzk?: number | null;
  financingStance:
    | "UNKNOWN"
    | "CASH"
    | "MORTGAGE_PREAPPROVED"
    | "MORTGAGE_EXPLORING"
    | "MIXED";
  timelineBand?: string | null;
};

export type QualificationCheck = {
  id: "verified_contact" | "known_budget" | "financing_stance";
  labelCs: string;
  passed: boolean;
  explanationCs: string;
};

export type QualificationResult = {
  qualified: boolean;
  ruleVersion: typeof QUALIFICATION_RULE_VERSION;
  checks: QualificationCheck[];
  contactVerified: boolean;
  budgetKnown: boolean;
  financingKnown: boolean;
  /** Human copy for badge tooltip — what we verified, no purchase guarantee. */
  badgeExplanationCs: string;
  disclaimerCs: string;
};

function isContactVerified(
  level: QualificationInput["contactVerification"],
): boolean {
  return (
    level === "EMAIL_VERIFIED" ||
    level === "PHONE_VERIFIED" ||
    level === "EMAIL_AND_PHONE_VERIFIED"
  );
}

function isBudgetKnown(input: QualificationInput): boolean {
  const min = input.budgetBandMinCzk;
  const max = input.budgetBandMaxCzk;
  if (min != null && min > 0) return true;
  if (max != null && max > 0) return true;
  return false;
}

function isFinancingKnown(
  stance: QualificationInput["financingStance"],
): boolean {
  return stance !== "UNKNOWN";
}

/**
 * Strip any forbidden keys from an arbitrary payload (defense in depth).
 */
export function stripForbiddenQualificationAttrs<T extends Record<string, unknown>>(
  payload: T,
): Partial<T> {
  const forbidden = new Set<string>(FORBIDDEN_QUALIFICATION_ATTRIBUTES);
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (forbidden.has(key)) continue;
    out[key] = value;
  }
  return out as Partial<T>;
}

/**
 * Evaluate centralized qualification rules.
 * All three gates must pass — no soft scoring on protected traits.
 */
export function evaluateBuyerQualification(
  input: QualificationInput,
): QualificationResult {
  const contactVerified = isContactVerified(input.contactVerification);
  const budgetKnown = isBudgetKnown(input);
  const financingKnown = isFinancingKnown(input.financingStance);

  const checks: QualificationCheck[] = [
    {
      id: "verified_contact",
      labelCs: "Ověřený kontakt",
      passed: contactVerified,
      explanationCs: contactVerified
        ? "E-mail nebo telefon je ověřený v účtu Majetio."
        : "Chybí ověřený e-mail nebo telefon.",
    },
    {
      id: "known_budget",
      labelCs: "Známý rozpočet",
      passed: budgetKnown,
      explanationCs: budgetKnown
        ? "Kupující uvedl rozpočtové pásmo (ne přesný výpis účtu)."
        : "Rozpočtové pásmo není vyplněné.",
    },
    {
      id: "financing_stance",
      labelCs: "Stav financování",
      passed: financingKnown,
      explanationCs: financingKnown
        ? "Kupující uvedl způsob financování (hotovost / hypotéka / kombinace)."
        : "Stav financování není uveden.",
    },
  ];

  const qualified = checks.every((c) => c.passed);

  return {
    qualified,
    ruleVersion: QUALIFICATION_RULE_VERSION,
    checks,
    contactVerified,
    budgetKnown,
    financingKnown,
    badgeExplanationCs: qualified
      ? "Systém ověřil kontakt, známý rozpočet a stav financování. Nejde o garanci koupě ani o bankovní schválení."
      : "Zájemce zatím nesplňuje všechna kritéria kvalifikace (kontakt, rozpočet, financování).",
    disclaimerCs:
      "„Kvalifikovaný zájemce“ znamená splnění produktových kritérií Majetio — není to garance nákupu, úvěruschopnosti ani výsledku prohlídky.",
  };
}

export function roundBudgetToBand(czk: number): {
  budgetBandMinCzk: number;
  budgetBandMaxCzk: number;
} {
  const step = 500_000;
  const min = Math.floor(czk / step) * step;
  const max = min + step;
  return { budgetBandMinCzk: min, budgetBandMaxCzk: max };
}

export function formatBudgetBandCs(
  minCzk: number | null | undefined,
  maxCzk: number | null | undefined,
): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat("cs-CZ", {
      style: "currency",
      currency: "CZK",
      maximumFractionDigits: 0,
    }).format(n);
  if (minCzk != null && maxCzk != null) return `${fmt(minCzk)} – ${fmt(maxCzk)}`;
  if (maxCzk != null) return `do ${fmt(maxCzk)}`;
  if (minCzk != null) return `od ${fmt(minCzk)}`;
  return "Neuvedeno";
}
