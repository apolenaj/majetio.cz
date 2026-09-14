/**
 * Mortgage lead retention policy and deletion flow (Prompt 13/10).
 *
 * @see docs/MORTGAGE_LEAD_RETENTION.md
 */

import { LeadType } from "@prisma/client";

import { prisma } from "@/lib/db";
import { sanitizeMortgageLeadAuditMeta, toAuditJson } from "@/domains/leads/service/privacy-guards";
import { writeAuditLog } from "@/lib/auth/audit";

/** Years to retain active lead PII after terminal workflow state. */
export const MORTGAGE_LEAD_ACTIVE_RETENTION_YEARS = 3;

/** Years to retain audit metadata (hashed identifiers only). */
export const MORTGAGE_LEAD_AUDIT_RETENTION_YEARS = 7;

/** Default retention from lead creation when partner not yet contacted. */
export const MORTGAGE_LEAD_DEFAULT_RETENTION_YEARS = 5;

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

export function computeMortgageLeadRetentionExpiresAt(input: {
  createdAt?: Date;
  partnerSubmitted?: boolean;
}): Date {
  const base = input.createdAt ?? new Date();
  const years = input.partnerSubmitted
    ? MORTGAGE_LEAD_ACTIVE_RETENTION_YEARS
    : MORTGAGE_LEAD_DEFAULT_RETENTION_YEARS;
  return new Date(base.getTime() + years * MS_PER_YEAR);
}

export type MortgageLeadDeletionResult = {
  leadId: string;
  correlationId: string;
  piiRedacted: boolean;
  partnerNotified: boolean;
};

/**
 * Redact sensitive mortgage lead PII while preserving audit trail + immutable snapshot.
 * Does NOT delete data at HypotekaJasne — user must contact partner separately.
 */
export async function requestMortgageLeadPiiDeletion(input: {
  userId: string;
  correlationId: string;
  reason: "consent_withdrawal" | "account_cleanup" | "user_request";
}): Promise<
  | { ok: true; data: MortgageLeadDeletionResult }
  | { ok: false; error: string; code?: string }
> {
  const lead = await prisma.lead.findUnique({
    where: { correlationId: input.correlationId },
    include: { mortgageProfile: true },
  });

  if (!lead || lead.type !== LeadType.FINANCING || !lead.mortgageProfile) {
    return { ok: false, error: "Požadavek financování nebyl nalezen.", code: "NOT_FOUND" };
  }

  if (lead.userId !== input.userId) {
    return { ok: false, error: "K tomuto požadavku nemáte přístup.", code: "FORBIDDEN" };
  }

  if (lead.piiRedactedAt) {
    return {
      ok: true,
      data: {
        leadId: lead.id,
        correlationId: lead.correlationId,
        piiRedacted: true,
        partnerNotified: false,
      },
    };
  }

  const now = new Date();
  const partnerSubmitted = Boolean(lead.mortgageProfile.submittedAt);

  await prisma.$transaction([
    prisma.lead.update({
      where: { id: lead.id },
      data: {
        email: null,
        phone: null,
        deletionRequestedAt: now,
        piiRedactedAt: now,
        retentionExpiresAt: computeMortgageLeadRetentionExpiresAt({
          createdAt: lead.createdAt,
          partnerSubmitted,
        }),
      },
    }),
    prisma.mortgageLeadProfile.update({
      where: { leadId: lead.id },
      data: {
        monthlyIncomeCzk: null,
        monthlyLiabilitiesCzk: null,
        availableEquityCzk: null,
        purchasePriceCzk: null,
      },
    }),
    prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: "mortgage_lead.pii_redacted",
        note: "Citlivá pole leadu byla redigována na žádost uživatele.",
        meta: sanitizeMortgageLeadAuditMeta({
          correlationId: lead.correlationId,
          retentionAction: input.reason,
        }),
      },
    }),
  ]);

  await writeAuditLog({
    action: "mortgage_lead.pii_redacted",
    entity: "Lead",
    entityId: lead.id,
    actorId: input.userId,
    meta: toAuditJson(
      sanitizeMortgageLeadAuditMeta({
        correlationId: lead.correlationId,
        retentionAction: input.reason,
      }),
    ),
  });

  return {
    ok: true,
    data: {
      leadId: lead.id,
      correlationId: lead.correlationId,
      piiRedacted: true,
      partnerNotified: false,
    },
  };
}

/** Batch job helper — purge leads past retention with redacted PII. */
export async function purgeExpiredMortgageLeadPii(now = new Date()): Promise<number> {
  const expired = await prisma.lead.findMany({
    where: {
      type: LeadType.FINANCING,
      retentionExpiresAt: { lte: now },
      piiRedactedAt: { not: null },
    },
    select: { id: true },
    take: 100,
  });

  if (expired.length === 0) return 0;

  await prisma.lead.deleteMany({
    where: { id: { in: expired.map((l) => l.id) } },
  });

  return expired.length;
}
