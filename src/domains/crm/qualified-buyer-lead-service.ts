/**
 * QualifiedBuyerLead lifecycle — qualify, anonymize for agent, accept/reveal.
 */

import type {
  BuyerFinancingStance,
  ContactVerificationLevel,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/db";
import {
  QUALIFICATION_RULE_VERSION,
  evaluateBuyerQualification,
  type QualificationInput,
  type TimelineBand,
  TIMELINE_BANDS,
} from "./qualification-rules";
import {
  buildAnonymizedQualifiedProfile,
  canAgentViewFullFinancialProfile,
  type AgentRevealedBuyerProfile,
  type AnonymizedQualifiedProfile,
} from "./privacy";

function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * 86_400_000);
}

function parseTimelineBand(value: string | null | undefined): TimelineBand | null {
  if (!value) return null;
  return (TIMELINE_BANDS as readonly string[]).includes(value)
    ? (value as TimelineBand)
    : null;
}

export async function createQualifiedBuyerLead(input: {
  propertyId: string;
  buyerUserId: string;
  inquiryId?: string | null;
  contactVerification: ContactVerificationLevel;
  budgetBandMinCzk?: number | null;
  budgetBandMaxCzk?: number | null;
  financingStance: BuyerFinancingStance;
  timelineBand?: string | null;
  now?: Date;
}): Promise<
  | { ok: true; leadId: string; anonymized: AnonymizedQualifiedProfile }
  | { ok: false; error: string; code?: string }
> {
  const qualificationInput: QualificationInput = {
    contactVerification: input.contactVerification,
    budgetBandMinCzk: input.budgetBandMinCzk,
    budgetBandMaxCzk: input.budgetBandMaxCzk,
    financingStance: input.financingStance,
    timelineBand: input.timelineBand,
  };
  const result = evaluateBuyerQualification(qualificationInput);
  if (!result.qualified) {
    return {
      ok: false,
      error: "Zájemce nesplňuje kritéria kvalifikace.",
      code: "not_qualified",
    };
  }

  const property = await prisma.property.findUnique({
    where: { id: input.propertyId },
    select: { id: true, organizationId: true, listedByUserId: true },
  });
  if (!property) {
    return { ok: false, error: "Nemovitost nenalezena." };
  }

  const now = input.now ?? new Date();
  const timelineBand = parseTimelineBand(input.timelineBand);

  const lead = await prisma.$transaction(async (tx) => {
    const created = await tx.qualifiedBuyerLead.create({
      data: {
        propertyId: property.id,
        organizationId: property.organizationId,
        agentUserId: property.listedByUserId,
        buyerUserId: input.buyerUserId,
        inquiryId: input.inquiryId ?? null,
        status: "PENDING_AGENT_REVIEW",
        qualificationRuleVersion: QUALIFICATION_RULE_VERSION,
        qualifiedAt: now,
        contactVerification: input.contactVerification,
        contactVerified: result.contactVerified,
        budgetKnown: result.budgetKnown,
        budgetBandMinCzk: input.budgetBandMinCzk ?? null,
        budgetBandMaxCzk: input.budgetBandMaxCzk ?? null,
        financingStance: input.financingStance,
        timelineBand,
        expiresAt: addDays(now, 14),
        slaDueAt: addDays(now, 1),
        activities: {
          create: {
            type: "QUALIFIED",
            note: "Lead splnil produktová kritéria kvalifikace.",
            meta: {
              ruleVersion: result.ruleVersion,
              checksPassed: result.checks.filter((c) => c.passed).map((c) => c.id),
            },
          },
        },
      },
    });

    const anonymized = buildAnonymizedQualifiedProfile({
      leadId: created.id,
      status: created.status,
      budgetBandMinCzk: created.budgetBandMinCzk,
      budgetBandMaxCzk: created.budgetBandMaxCzk,
      timelineBand: created.timelineBand,
      financingStance: created.financingStance,
      contactVerified: created.contactVerified,
      qualificationChecks: result.checks,
      disclaimerCs: result.disclaimerCs,
    });

    await tx.qualifiedBuyerLead.update({
      where: { id: created.id },
      data: {
        anonymizedProfileSnapshot: anonymized as unknown as Prisma.InputJsonValue,
      },
    });

    if (input.inquiryId) {
      await tx.inquiry.update({
        where: { id: input.inquiryId },
        data: { status: "CONVERTED" },
      });
    }

    return { id: created.id, anonymized };
  });

  return { ok: true, leadId: lead.id, anonymized: lead.anonymized };
}

/**
 * Agent view BEFORE accept — anonymized only. Never FinancialProfile.
 * Tenant boundary: agentUserId OR org OWNER/ADMIN (not every AGENT member).
 */
export async function getAgentLeadView(input: {
  leadId: string;
  agentUserId: string;
}): Promise<
  | { ok: true; view: AnonymizedQualifiedProfile | AgentRevealedBuyerProfile }
  | { ok: false; error: string }
> {
  const lead = await prisma.qualifiedBuyerLead.findUnique({
    where: { id: input.leadId },
  });
  if (!lead) {
    return { ok: false, error: "Lead nenalezen." };
  }

  const isAssignedAgent = lead.agentUserId === input.agentUserId;
  let isOrgManager = false;
  if (!isAssignedAgent && lead.organizationId) {
    const membership = await prisma.organizationMember.findFirst({
      where: {
        organizationId: lead.organizationId,
        userId: input.agentUserId,
        active: true,
        role: { in: ["OWNER", "ADMIN"] },
      },
      select: { id: true },
    });
    isOrgManager = Boolean(membership);
  }
  if (!isAssignedAgent && !isOrgManager) {
    return { ok: false, error: "Lead nenalezen." };
  }

  if (lead.status !== "ACCEPTED") {
    if (
      lead.anonymizedProfileSnapshot &&
      typeof lead.anonymizedProfileSnapshot === "object"
    ) {
      return {
        ok: true,
        view: lead.anonymizedProfileSnapshot as unknown as AnonymizedQualifiedProfile,
      };
    }
    const rebuilt = evaluateBuyerQualification({
      contactVerification: lead.contactVerification,
      budgetBandMinCzk: lead.budgetBandMinCzk,
      budgetBandMaxCzk: lead.budgetBandMaxCzk,
      financingStance: lead.financingStance,
      timelineBand: lead.timelineBand,
    });
    return {
      ok: true,
      view: buildAnonymizedQualifiedProfile({
        leadId: lead.id,
        status: lead.status,
        budgetBandMinCzk: lead.budgetBandMinCzk,
        budgetBandMaxCzk: lead.budgetBandMaxCzk,
        timelineBand: lead.timelineBand,
        financingStance: lead.financingStance,
        contactVerified: lead.contactVerified,
        qualificationChecks: rebuilt.checks,
        disclaimerCs: rebuilt.disclaimerCs,
      }),
    };
  }

  // ACCEPTED — contact may be shown; FP only with consent
  const consent = lead.profileShareConsentId
    ? await prisma.consent.findUnique({
        where: { id: lead.profileShareConsentId },
      })
    : await prisma.consent.findFirst({
        where: {
          userId: lead.buyerUserId,
          type: "AGENT_BUYER_PROFILE_SHARE",
          granted: true,
          revokedAt: null,
        },
        orderBy: { createdAt: "desc" },
      });

  const shareGranted = Boolean(consent?.granted && !consent.revokedAt);
  const revealFp = canAgentViewFullFinancialProfile({
    leadStatus: lead.status,
    profileShareConsentGranted: shareGranted,
  });

  const buyer = await prisma.user.findUnique({
    where: { id: lead.buyerUserId },
    select: {
      name: true,
      email: true,
      profile: { select: { phone: true } },
      financialProfile: revealFp,
    },
  });

  const rebuilt = evaluateBuyerQualification({
    contactVerification: lead.contactVerification,
    budgetBandMinCzk: lead.budgetBandMinCzk,
    budgetBandMaxCzk: lead.budgetBandMaxCzk,
    financingStance: lead.financingStance,
    timelineBand: lead.timelineBand,
  });
  const anon = buildAnonymizedQualifiedProfile({
    leadId: lead.id,
    status: lead.status,
    budgetBandMinCzk: lead.budgetBandMinCzk,
    budgetBandMaxCzk: lead.budgetBandMaxCzk,
    timelineBand: lead.timelineBand,
    financingStance: lead.financingStance,
    contactVerified: lead.contactVerified,
    qualificationChecks: rebuilt.checks,
    disclaimerCs: rebuilt.disclaimerCs,
  });

  const fp = buyer?.financialProfile;
  const revealed: AgentRevealedBuyerProfile = {
    kind: "agent_revealed_buyer_profile",
    leadId: lead.id,
    status: "ACCEPTED",
    contact: {
      name: buyer?.name ?? null,
      email: buyer?.email ?? null,
      phone: buyer?.profile?.phone ?? null,
    },
    budgetBandLabelCs: anon.budgetBandLabelCs,
    timelineLabelCs: anon.timelineLabelCs,
    financingLabelCs: anon.financingLabelCs,
    financialProfile: revealFp
      ? {
          monthlyIncomeCzk: fp?.monthlyIncomeCzk ?? null,
          monthlyLiabilitiesCzk: fp?.monthlyLiabilitiesCzk ?? null,
          availableEquityCzk: fp?.availableEquityCzk ?? null,
          financingMode: fp?.financingMode ?? null,
        }
      : null,
    privacy: {
      fullFinancialProfileVisible: revealFp,
      contactDetailsVisible: true,
      consentType: "AGENT_BUYER_PROFILE_SHARE",
    },
  };

  return { ok: true, view: revealed };
}

export async function acceptQualifiedBuyerLead(input: {
  leadId: string;
  agentUserId: string;
  now?: Date;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const now = input.now ?? new Date();
  // Strict tenant (175): assignee OR org OWNER/ADMIN — not every AGENT in the org
  const lead = await prisma.qualifiedBuyerLead.findFirst({
    where: {
      id: input.leadId,
      status: "PENDING_AGENT_REVIEW",
      OR: [
        { agentUserId: input.agentUserId },
        {
          organization: {
            members: {
              some: {
                userId: input.agentUserId,
                active: true,
                role: { in: ["OWNER", "ADMIN"] },
              },
            },
          },
        },
      ],
    },
  });
  if (!lead) {
    return { ok: false, error: "Lead nelze přijmout." };
  }

  await prisma.qualifiedBuyerLead.update({
    where: { id: lead.id },
    data: {
      status: "ACCEPTED",
      agentAcceptedAt: now,
      agentUserId: lead.agentUserId ?? input.agentUserId,
      activities: {
        create: {
          type: "AGENT_ACCEPTED",
          note: "Agent přijal kvalifikovaný lead. Finanční profil jen se souhlasem kupujícího.",
        },
      },
    },
  });

  // 183/216 — MODE A billing on accept (conditions module)
  if (lead.organizationId) {
    const { getOrgLeadBillingSettings, chargePayPerLead } = await import(
      "@/domains/revenue/billing"
    );
    const { shouldChargePayPerLeadOnAccept } = await import(
      "@/domains/revenue/lead-billing-conditions"
    );
    const settings = await getOrgLeadBillingSettings(lead.organizationId);
    if (
      shouldChargePayPerLeadOnAccept({
        organizationId: lead.organizationId,
        billingMode: settings?.mode,
      })
    ) {
      await chargePayPerLead({
        organizationId: lead.organizationId,
        qualifiedBuyerLeadId: lead.id,
        now,
      });
    }
  }

  return { ok: true };
}

/**
 * Mark full profile revealed only when consent + accepted — audit trail.
 */
export async function markFullProfileRevealed(input: {
  leadId: string;
  profileShareConsentId: string;
  now?: Date;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const lead = await prisma.qualifiedBuyerLead.findUnique({
    where: { id: input.leadId },
  });
  if (!lead || lead.status !== "ACCEPTED") {
    return { ok: false, error: "Lead není ve stavu ACCEPTED." };
  }
  const consent = await prisma.consent.findUnique({
    where: { id: input.profileShareConsentId },
  });
  if (
    !consent ||
    consent.type !== "AGENT_BUYER_PROFILE_SHARE" ||
    !consent.granted ||
    consent.revokedAt ||
    consent.userId !== lead.buyerUserId
  ) {
    return { ok: false, error: "Chybí platný souhlas AGENT_BUYER_PROFILE_SHARE." };
  }

  const now = input.now ?? new Date();
  await prisma.qualifiedBuyerLead.update({
    where: { id: lead.id },
    data: {
      profileShareConsentId: consent.id,
      fullProfileRevealedAt: now,
      activities: {
        create: {
          type: "FULL_PROFILE_REVEALED",
          note: "Agent zobrazil finanční profil po souhlasu kupujícího.",
          meta: { consentId: consent.id },
        },
      },
    },
  });

  return { ok: true };
}
