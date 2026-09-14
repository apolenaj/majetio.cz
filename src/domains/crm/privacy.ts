/**
 * Agent-facing privacy DTOs for QualifiedBuyerLead.
 *
 * Pre-accept: anonymized profile only (budget band, timeline, financing stance).
 * Full FinancialProfile is NEVER included without AGENT_BUYER_PROFILE_SHARE
 * consent AND lead status ACCEPTED.
 */

import type { BuyerFinancingStance, QualifiedBuyerLeadStatus } from "@prisma/client";

import {
  FINANCING_STANCE_LABELS_CS,
  TIMELINE_BAND_LABELS_CS,
  formatBudgetBandCs,
  type TimelineBand,
  type QualificationCheck,
} from "./qualification-rules";

const FORBIDDEN_AGENT_KEYS = new Set([
  "monthlyIncomeCzk",
  "monthlyLiabilitiesCzk",
  "availableEquityCzk",
  "equityPercent",
  "employmentType",
  "creditScoreBand",
  "email",
  "phone",
  "buyerEmail",
  "buyerPhone",
  "buyerName",
  "passwordHash",
  "age",
  "gender",
  "nationality",
]);

export type AnonymizedQualifiedProfile = {
  kind: "anonymized_qualified_profile";
  leadId: string;
  status: QualifiedBuyerLeadStatus;
  budgetBandLabelCs: string;
  budgetBandMinCzk: number | null;
  budgetBandMaxCzk: number | null;
  timelineBand: string | null;
  timelineLabelCs: string | null;
  financingStance: BuyerFinancingStance;
  financingLabelCs: string;
  contactVerified: boolean;
  /** What Majetio verified — no purchase guarantee. */
  qualificationChecks: QualificationCheck[];
  badgeLabelCs: "Kvalifikovaný zájemce";
  disclaimerCs: string;
  /** Explicit privacy contract for clients. */
  privacy: {
    fullFinancialProfileVisible: false;
    contactDetailsVisible: false;
    requiresAcceptAndConsentForFullProfile: true;
  };
};

export type AgentRevealedBuyerProfile = {
  kind: "agent_revealed_buyer_profile";
  leadId: string;
  status: "ACCEPTED";
  contact: {
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  /** Still banded / stance — exact income only if consent allows. */
  budgetBandLabelCs: string;
  timelineLabelCs: string | null;
  financingLabelCs: string;
  financialProfile: {
    monthlyIncomeCzk: number | null;
    monthlyLiabilitiesCzk: number | null;
    availableEquityCzk: number | null;
    financingMode: string | null;
  } | null;
  privacy: {
    fullFinancialProfileVisible: boolean;
    contactDetailsVisible: true;
    consentType: "AGENT_BUYER_PROFILE_SHARE";
  };
};

export function buildAnonymizedQualifiedProfile(input: {
  leadId: string;
  status: QualifiedBuyerLeadStatus;
  budgetBandMinCzk?: number | null;
  budgetBandMaxCzk?: number | null;
  timelineBand?: string | null;
  financingStance: BuyerFinancingStance;
  contactVerified: boolean;
  qualificationChecks: QualificationCheck[];
  disclaimerCs: string;
}): AnonymizedQualifiedProfile {
  const timeline = input.timelineBand;
  const timelineLabelCs =
    timeline && timeline in TIMELINE_BAND_LABELS_CS
      ? TIMELINE_BAND_LABELS_CS[timeline as TimelineBand]
      : timeline
        ? timeline
        : null;

  return {
    kind: "anonymized_qualified_profile",
    leadId: input.leadId,
    status: input.status,
    budgetBandLabelCs: formatBudgetBandCs(
      input.budgetBandMinCzk,
      input.budgetBandMaxCzk,
    ),
    budgetBandMinCzk: input.budgetBandMinCzk ?? null,
    budgetBandMaxCzk: input.budgetBandMaxCzk ?? null,
    timelineBand: timeline ?? null,
    timelineLabelCs,
    financingStance: input.financingStance,
    financingLabelCs:
      FINANCING_STANCE_LABELS_CS[input.financingStance] ??
      FINANCING_STANCE_LABELS_CS.UNKNOWN,
    contactVerified: input.contactVerified,
    qualificationChecks: input.qualificationChecks,
    badgeLabelCs: "Kvalifikovaný zájemce",
    disclaimerCs: input.disclaimerCs,
    privacy: {
      fullFinancialProfileVisible: false,
      contactDetailsVisible: false,
      requiresAcceptAndConsentForFullProfile: true,
    },
  };
}

/**
 * Defense in depth — strip sensitive keys from any agent-bound JSON.
 */
export function sanitizeAgentFacingPayload(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (FORBIDDEN_AGENT_KEYS.has(key)) continue;
    out[key] = value;
  }
  return out;
}

/**
 * Gate: may agent see full financial profile?
 * Requires ACCEPTED + explicit AGENT_BUYER_PROFILE_SHARE consent granted.
 */
export function canAgentViewFullFinancialProfile(input: {
  leadStatus: QualifiedBuyerLeadStatus;
  profileShareConsentGranted: boolean;
}): boolean {
  return (
    input.leadStatus === "ACCEPTED" && input.profileShareConsentGranted === true
  );
}
