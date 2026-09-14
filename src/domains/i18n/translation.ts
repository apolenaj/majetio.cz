/**
 * Translation key architecture + content status (Prompt 17.2).
 * Legal / regulatory copy must not ship as machine-only translation.
 */

export const TRANSLATION_CONTENT_STATUSES = [
  "DRAFT",
  "TRANSLATED",
  "REVIEWED",
  "APPROVED",
] as const;

export type TranslationContentStatus =
  (typeof TRANSLATION_CONTENT_STATUSES)[number];

export type TranslationNamespace =
  | "ui"
  | "marketing"
  | "product"
  | "legal"
  | "regulatory"
  | "email"
  | "errors";

export type TranslationEntry = {
  /** Dot-path key, e.g. legal.terms.withdrawal_digital */
  key: string;
  namespace: TranslationNamespace;
  /** Source language (usually en or cs). */
  sourceLocale: string;
  /** Target locale for this row. */
  locale: string;
  status: TranslationContentStatus;
  /** Human reviewer required before public for legal/regulatory. */
  requiresHumanReview: boolean;
  /** Optional machine draft — never public for legal without APPROVED. */
  machineTranslated?: boolean;
  updatedAt?: string;
};

/** Keys that must be APPROVED before public render. */
export const LEGAL_TRANSLATION_NAMESPACES: readonly TranslationNamespace[] = [
  "legal",
  "regulatory",
] as const;

export function isLegalNamespace(ns: TranslationNamespace): boolean {
  return (LEGAL_TRANSLATION_NAMESPACES as readonly string[]).includes(ns);
}

/**
 * Public gate: legal/regulatory needs APPROVED (+ human review).
 * UI/marketing may ship at REVIEWED or APPROVED.
 */
export function isTranslationPublicallyShippable(
  entry: Pick<
    TranslationEntry,
    "namespace" | "status" | "requiresHumanReview" | "machineTranslated"
  >,
): boolean {
  if (isLegalNamespace(entry.namespace)) {
    if (entry.machineTranslated && entry.status !== "APPROVED") return false;
    if (entry.requiresHumanReview && entry.status !== "APPROVED") return false;
    return entry.status === "APPROVED";
  }
  return entry.status === "REVIEWED" || entry.status === "APPROVED";
}

/**
 * Convention: no hardcoded UI strings in new international surfaces.
 * Keys: `{namespace}.{area}.{descriptor}`
 */
export function translationKey(
  namespace: TranslationNamespace,
  area: string,
  descriptor: string,
): string {
  return `${namespace}.${area}.${descriptor}`;
}

/** Minimal seed catalog (structure only — full copy packs come later). */
export const TRANSLATION_KEY_CATALOG: readonly {
  key: string;
  namespace: TranslationNamespace;
  requiresHumanReview: boolean;
}[] = [
  {
    key: "ui.nav.properties",
    namespace: "ui",
    requiresHumanReview: false,
  },
  {
    key: "ui.nav.pricing",
    namespace: "ui",
    requiresHumanReview: false,
  },
  {
    key: "fx.orientational_only",
    namespace: "product",
    requiresHumanReview: false,
  },
  {
    key: "legal.terms.title",
    namespace: "legal",
    requiresHumanReview: true,
  },
  {
    key: "legal.privacy.title",
    namespace: "legal",
    requiresHumanReview: true,
  },
  {
    key: "legal.withdrawal.digital_content",
    namespace: "legal",
    requiresHumanReview: true,
  },
  {
    key: "regulatory.disclaimer.not_advice",
    namespace: "regulatory",
    requiresHumanReview: true,
  },
] as const;
