/**
 * Mortgage lead data transfer — field whitelist and exclusion policy (Prompt 13/4).
 *
 * Data minimization: only fields listed in MORTGAGE_LEAD_SHAREABLE_FIELDS may
 * appear in DataSharingPreview. Everything else is explicitly excluded.
 */

import type { ConsentType } from "@prisma/client";

/** Consent type used for all new HypotekaJasne handoffs. */
export const MORTGAGE_LEAD_CONSENT_TYPE =
  "MORTGAGE_LEAD_DATA_TRANSFER" satisfies ConsentType;

/** Legal text version — stored on every Consent receipt. */
export const MORTGAGE_LEAD_CONSENT_TEXT_VERSION = "mortgage-lead-transfer.v2026.07";

export type MortgageLeadShareFieldKey =
  | "email"
  | "name"
  | "phone"
  | "propertyReference"
  | "purchasePriceCzk"
  | "availableEquityCzk"
  | "monthlyIncomeCzk"
  | "monthlyLiabilitiesCzk";

export type MortgageLeadShareFieldDef = {
  key: MortgageLeadShareFieldKey;
  label: string;
  always: boolean;
  defaultIncluded: boolean;
  category: "contact" | "property" | "financial";
};

/**
 * Absolute minimum fields for mortgage lead assessment.
 * `defaultIncluded: false` — user must explicitly opt in (data minimization).
 * `always: true` — required for handoff, cannot be deselected.
 */
export const MORTGAGE_LEAD_SHAREABLE_FIELDS: readonly MortgageLeadShareFieldDef[] = [
  {
    key: "email",
    label: "E-mail",
    always: true,
    defaultIncluded: true,
    category: "contact",
  },
  {
    key: "name",
    label: "Jméno (pokud je v profilu)",
    always: false,
    defaultIncluded: false,
    category: "contact",
  },
  {
    key: "phone",
    label: "Telefon (pokud je v profilu)",
    always: false,
    defaultIncluded: false,
    category: "contact",
  },
  {
    key: "propertyReference",
    label: "Reference nemovitosti / analýzy",
    always: false,
    defaultIncluded: false,
    category: "property",
  },
  {
    key: "purchasePriceCzk",
    label: "Kupní cena z aktuálního scénáře",
    always: false,
    defaultIncluded: false,
    category: "property",
  },
  {
    key: "availableEquityCzk",
    label: "Vlastní zdroje (equity)",
    always: false,
    defaultIncluded: false,
    category: "financial",
  },
  {
    key: "monthlyIncomeCzk",
    label: "Měsíční příjem (orientační)",
    always: false,
    defaultIncluded: false,
    category: "financial",
  },
  {
    key: "monthlyLiabilitiesCzk",
    label: "Měsíční závazky (orientační)",
    always: false,
    defaultIncluded: false,
    category: "financial",
  },
];

/** Categories never transmitted — shown in UI as explicit exclusions. */
export const MORTGAGE_LEAD_EXCLUDED_CATEGORIES = [
  "Kompletní Finanční pas",
  "Historie hledání nemovitostí",
  "Oblíbené a porovnání",
  "Investiční analýzy a scénáře",
  "Marketingové preference",
  "Heslo a přihlašovací údaje",
] as const;

/** Consent receipt shape stored in Consent.metadata. */
export type MortgageLeadConsentReceipt = {
  consentTextVersion: string;
  consentAt: string;
  recipient: string;
  recipientUrl: string;
  purpose: string;
  sharedFields: MortgageLeadShareFieldKey[];
  sharedFieldLabels: string[];
  source: string;
  leadId?: string;
  correlationId?: string;
  externalLeadId?: string;
  handoffContext?: {
    analysisId?: string;
    propertyId?: string;
    purchasePriceCzk?: number;
  };
};
