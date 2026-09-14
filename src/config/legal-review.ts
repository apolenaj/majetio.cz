/**
 * Legal / Accounting Review registry (checklist 213–215).
 * Features that must stay gated or annotated until counsel / accounting signs off.
 */

import {
  FEATURE_FLAG_DEFAULTS,
  type FeatureFlagKey,
} from "@/config/feature-flags";

export type LegalReviewDomain =
  | "consumer_withdrawal"
  | "success_fees"
  | "vat"
  | "invoices"
  | "partner_marketplace"
  | "purchase_concierge";

export type LegalReviewItem = {
  id: string;
  domain: LegalReviewDomain;
  /** Checklist / bod references from monetization prompt. */
  checklist: number[];
  titleCs: string;
  reasonCs: string;
  /** Runtime gate — must default OFF when disputed. */
  featureFlag?: FeatureFlagKey | "CONSUMER_WITHDRAWAL_ENABLED" | "AUTOMATED_INVOICE_ENABLED";
  defaultEnabled: boolean;
  codeMarkers: string[];
};

/**
 * Canonical list of monetization surfaces requiring Legal/Accounting Review.
 * Do not ship public UX for items with defaultEnabled: false.
 */
export const LEGAL_REVIEW_REGISTRY: readonly LegalReviewItem[] = [
  {
    id: "consumer_withdrawal",
    domain: "consumer_withdrawal",
    checklist: [213],
    titleCs: "Odstoupení spotřebitele (digital content)",
    reasonCs:
      "14denní odstoupení / výjimka pro digitální obsah po zahájení plnění vyžaduje právní text a UX flow.",
    featureFlag: "CONSUMER_WITHDRAWAL_ENABLED",
    defaultEnabled: false,
    codeMarkers: [
      "src/config/legal-review.ts",
      "src/domains/commerce/consumer-withdrawal.ts",
    ],
  },
  {
    id: "transaction_success_fee",
    domain: "success_fees",
    checklist: [214, 215],
    titleCs: "Purchase Concierge / transaction success fee",
    reasonCs:
      "Zastoupení při koupi a success fee z transakce — právní rámec + licence realitní činnosti.",
    featureFlag: "TRANSACTION_SUCCESS_FEE_ENABLED",
    defaultEnabled: FEATURE_FLAG_DEFAULTS.TRANSACTION_SUCCESS_FEE_ENABLED,
    codeMarkers: [
      "src/domains/revenue/success-fee-model.ts",
      "src/config/feature-flags.ts",
    ],
  },
  {
    id: "b2b_broker_success_fee",
    domain: "success_fees",
    checklist: [183, 216, 215],
    titleCs: "B2B MODE B success fee (podíl z provize makléře)",
    reasonCs:
      "Fakturace podílu z broker commission — accounting + smlouva s org; default billing MODE A. Nezávislé na Purchase Concierge flag.",
    /** Not gated by TRANSACTION_SUCCESS_FEE_ENABLED — separate B2B product. */
    defaultEnabled: true,
    codeMarkers: [
      "src/domains/revenue/billing.ts",
      "src/domains/revenue/lead-billing-conditions.ts",
      "src/domains/professional-services/transactions.ts",
    ],
  },
  {
    id: "vat_treatment",
    domain: "vat",
    checklist: [215],
    titleCs: "DPH sazby a reverse-charge / OSS",
    reasonCs:
      "DEFAULT_VAT_RATE_BP = 21 % je technický split; daňové režimy (OSS, B2B reverse-charge) vyžadují accounting review.",
    defaultEnabled: true,
    codeMarkers: [
      "src/config/commerce.ts",
      "src/domains/commerce/quote.ts",
    ],
  },
  {
    id: "automated_invoices",
    domain: "invoices",
    checklist: [215],
    titleCs: "Automatická daňová doklady / faktury",
    reasonCs:
      "Generování daňových dokladů (ISDOC / e-faktura) zůstává OFF do accounting review.",
    featureFlag: "AUTOMATED_INVOICE_ENABLED",
    defaultEnabled: false,
    codeMarkers: [
      "src/domains/commerce/invoices.ts",
      "src/config/legal-review.ts",
    ],
  },
  {
    id: "partner_marketplace",
    domain: "partner_marketplace",
    checklist: [214],
    titleCs: "Partner Marketplace revenue share",
    reasonCs: "Partnerské fee / revenue share — smlouvy a daňové dopady.",
    featureFlag: "PARTNER_MARKETPLACE_ENABLED",
    defaultEnabled: FEATURE_FLAG_DEFAULTS.PARTNER_MARKETPLACE_ENABLED,
    codeMarkers: ["src/config/feature-flags.ts", "docs/PARTNER_MONETIZATION.md"],
  },
] as const;

/** Marker string for code comments / docs — grep-friendly. */
export const LEGAL_REVIEW_MARKER = "LEGAL_REVIEW" as const;

export function listBlockedLegalReviewItems(): LegalReviewItem[] {
  return LEGAL_REVIEW_REGISTRY.filter((item) => !item.defaultEnabled);
}

export function assertDisputedFeaturesDefaultOff(): {
  ok: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  for (const item of LEGAL_REVIEW_REGISTRY) {
    if (item.featureFlag && item.defaultEnabled) {
      // Only disputed domains must stay OFF
      if (
        item.domain === "consumer_withdrawal" ||
        item.domain === "success_fees" ||
        item.domain === "invoices" ||
        item.domain === "partner_marketplace" ||
        item.domain === "purchase_concierge"
      ) {
        violations.push(`${item.id}:default_on`);
      }
    }
  }
  if (FEATURE_FLAG_DEFAULTS.TRANSACTION_SUCCESS_FEE_ENABLED) {
    violations.push("TRANSACTION_SUCCESS_FEE_ENABLED:default_on");
  }
  if (FEATURE_FLAG_DEFAULTS.PARTNER_MARKETPLACE_ENABLED) {
    violations.push("PARTNER_MARKETPLACE_ENABLED:default_on");
  }
  if (FEATURE_FLAG_DEFAULTS.CONSUMER_WITHDRAWAL_ENABLED) {
    violations.push("CONSUMER_WITHDRAWAL_ENABLED:default_on");
  }
  if (FEATURE_FLAG_DEFAULTS.AUTOMATED_INVOICE_ENABLED) {
    violations.push("AUTOMATED_INVOICE_ENABLED:default_on");
  }
  return { ok: violations.length === 0, violations };
}
