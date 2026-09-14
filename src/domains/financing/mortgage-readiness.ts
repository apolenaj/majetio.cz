/**
 * MortgageReadiness — pure domain model for financing preparedness.
 *
 * Strict terminology:
 *   "basic_data_ready"      → required inputs are present for modelling
 *   "data_incomplete"       → one or more required inputs are missing
 *   "ready_for_review"      → all data present; user can meaningfully consult a specialist
 *
 * NEVER use: "approved", "pre-approved", "mortgage approved" — these are regulated terms.
 * This is an informational readiness indicator, not underwriting.
 */

import type { PassportState } from "@/lib/financial-passport/types";
import type { PropertyFinancingSummary } from "./property-financing";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const MORTGAGE_READINESS_LEVELS = [
  "data_incomplete",
  "basic_data_ready",
  "ready_for_review",
] as const;

export type MortgageReadinessLevel =
  (typeof MORTGAGE_READINESS_LEVELS)[number];

export type ChecklistItemId =
  | "property_price"
  | "own_funds"
  | "income"
  | "liabilities"
  | "contact";

export type ChecklistItemStatus = "done" | "missing" | "optional_missing";

export type ChecklistItem = {
  id: ChecklistItemId;
  label: string;
  hint: string;
  status: ChecklistItemStatus;
  /** Present value for preview — never show sensitive raw numbers in summary. */
  previewLabel: string | null;
};

export type MortgageReadiness = {
  level: MortgageReadinessLevel;
  /** Short display label. */
  label: string;
  /** Longer description — what the user should do next. */
  description: string;
  checklist: ChecklistItem[];
  /** True when all required (non-optional) items are done. */
  allRequiredDone: boolean;
  /**
   * CTA label variant — reflects readiness level.
   * Parent decides whether to show the DataSharingPreview dialog on click.
   */
  ctaLabel: string;
  ctaTone: "primary" | "secondary";
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hasNumber(v: number | null | undefined): boolean {
  return v != null && Number.isFinite(v) && v > 0;
}

function equityPreviewLabel(equity: number | null): string | null {
  if (!hasNumber(equity)) return null;
  // Bucket: don't show exact amount — less sensitive
  if (equity! >= 5_000_000) return "5 mil. Kč a více";
  if (equity! >= 2_000_000) return "2–5 mil. Kč";
  if (equity! >= 1_000_000) return "1–2 mil. Kč";
  if (equity! >= 500_000) return "500 tis. – 1 mil. Kč";
  return "méně než 500 tis. Kč";
}

function incomePreviewLabel(income: number | null): string | null {
  if (!hasNumber(income)) return null;
  if (income! >= 150_000) return "150 000 Kč/měs a více";
  if (income! >= 80_000) return "80 000–150 000 Kč/měs";
  if (income! >= 40_000) return "40 000–80 000 Kč/měs";
  return "do 40 000 Kč/měs";
}

// ---------------------------------------------------------------------------
// Main computation
// ---------------------------------------------------------------------------

export type MortgageReadinessInput = {
  /** From PropertyFinancingSummary or direct user inputs in the calculator. */
  askingPriceCzk: number | null;
  availableEquityCzk: number | null;
  /**
   * From passport — user may have filled income separately from the calculator.
   * Optional but strongly recommended for specialist review.
   */
  monthlyIncomeCzk: number | null;
  monthlyLiabilitiesCzk: number | null;
  /**
   * Whether the user has a verified contact (email).
   * Required for handoff; always true when isAuthenticated.
   */
  hasContact: boolean;
};

export function computeMortgageReadiness(
  input: MortgageReadinessInput,
): MortgageReadiness {
  const {
    askingPriceCzk,
    availableEquityCzk,
    monthlyIncomeCzk,
    monthlyLiabilitiesCzk,
    hasContact,
  } = input;

  // ----- Checklist -----

  const checklist: ChecklistItem[] = [
    {
      id: "property_price",
      label: "Cena nemovitosti",
      hint: "Zadejte kupní nebo odhadovanou cenu.",
      status: hasNumber(askingPriceCzk) ? "done" : "missing",
      previewLabel: hasNumber(askingPriceCzk)
        ? new Intl.NumberFormat("cs-CZ", {
            style: "currency",
            currency: "CZK",
            maximumFractionDigits: 0,
          }).format(askingPriceCzk!)
        : null,
    },
    {
      id: "own_funds",
      label: "Vlastní zdroje (equity)",
      hint: "Kolik vlastních prostředků do koupě vkládáte.",
      status: hasNumber(availableEquityCzk) ? "done" : "missing",
      previewLabel: equityPreviewLabel(availableEquityCzk),
    },
    {
      id: "income",
      label: "Měsíční příjem",
      hint: "Příjem slouží hypoteční bance pro posouzení úvěruschopnosti. Majetio jej nezpracovává pro jiné účely.",
      status: hasNumber(monthlyIncomeCzk)
        ? "done"
        : "optional_missing",
      previewLabel: incomePreviewLabel(monthlyIncomeCzk),
    },
    {
      id: "liabilities",
      label: "Měsíční závazky",
      hint: "Stávající splátky úvěrů, leasingů a jiných závazků.",
      status: hasNumber(monthlyLiabilitiesCzk)
        ? "done"
        : "optional_missing",
      previewLabel:
        hasNumber(monthlyLiabilitiesCzk)
          ? new Intl.NumberFormat("cs-CZ", {
              style: "currency",
              currency: "CZK",
              maximumFractionDigits: 0,
            }).format(monthlyLiabilitiesCzk!)
          : null,
    },
    {
      id: "contact",
      label: "Kontakt (e-mail)",
      hint: "Potřebný pro předání specialistovi. K dispozici po přihlášení.",
      status: hasContact ? "done" : "missing",
      previewLabel: hasContact ? "Ověřeno" : null,
    },
  ];

  // ----- Level -----

  const requiredItems = checklist.filter(
    (i) => i.id === "property_price" || i.id === "own_funds" || i.id === "contact",
  );
  const allRequiredDone = requiredItems.every((i) => i.status === "done");
  const incomeOrLiabilitiesDone = checklist.some(
    (i) =>
      (i.id === "income" || i.id === "liabilities") && i.status === "done",
  );

  let level: MortgageReadinessLevel;
  let label: string;
  let description: string;
  let ctaLabel: string;
  let ctaTone: MortgageReadiness["ctaTone"];

  if (allRequiredDone && incomeOrLiabilitiesDone) {
    level = "ready_for_review";
    label = "Připraveno k odbornému posouzení";
    description =
      "Máte základní údaje i orientační příjem. Hypoteční specialista může připravit reálnou nabídku.";
    ctaLabel = "Chci zjistit reálné možnosti financování";
    ctaTone = "primary";
  } else if (allRequiredDone) {
    level = "basic_data_ready";
    label = "Základní údaje připraveny";
    description =
      "Máte cenu, vlastní zdroje a kontakt. Doplňte orientační příjem a závazky pro přesnější posouzení.";
    ctaLabel = "Spojit se specialistou";
    ctaTone = "primary";
  } else {
    level = "data_incomplete";
    label = "Chybí údaje";
    description =
      "Doplňte označené položky. Minimálně cena nemovitosti, vlastní zdroje a kontakt jsou potřeba pro předání.";
    ctaLabel = "Doplnit chybějící údaje";
    ctaTone = "secondary";
  }

  return {
    level,
    label,
    description,
    checklist,
    allRequiredDone,
    ctaLabel,
    ctaTone,
  };
}

// ---------------------------------------------------------------------------
// Bridge: PassportState + FinancingSummary → ReadinessInput
// ---------------------------------------------------------------------------

export function buildReadinessInputFromPassport(
  passport: PassportState | null,
  summary: PropertyFinancingSummary | null,
  hasContact: boolean,
): MortgageReadinessInput {
  return {
    askingPriceCzk: summary?.purchasePriceCzk ?? null,
    // Prefer calculator-derived equity over passport for price-specific analysis
    availableEquityCzk:
      summary?.availableEquityCzk ??
      passport?.availableEquityCzk ??
      null,
    monthlyIncomeCzk: passport?.monthlyIncomeCzk ?? null,
    monthlyLiabilitiesCzk: passport?.monthlyLiabilitiesCzk ?? null,
    hasContact,
  };
}

// ---------------------------------------------------------------------------
// Scenario-level override: user may override passport values just for this
// analysis without modifying the global Financial Passport
// ---------------------------------------------------------------------------

export type PassportScenarioOverride = {
  monthlyIncomeCzk?: number | null;
  monthlyLiabilitiesCzk?: number | null;
};

export function applyScenarioOverride(
  base: MortgageReadinessInput,
  override: PassportScenarioOverride,
): MortgageReadinessInput {
  return {
    ...base,
    monthlyIncomeCzk:
      override.monthlyIncomeCzk !== undefined
        ? override.monthlyIncomeCzk
        : base.monthlyIncomeCzk,
    monthlyLiabilitiesCzk:
      override.monthlyLiabilitiesCzk !== undefined
        ? override.monthlyLiabilitiesCzk
        : base.monthlyLiabilitiesCzk,
  };
}
