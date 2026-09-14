/**
 * Qualified Buyer inbox + SLA (138 / 139).
 * Response-time measurement only — NO public broker ranking.
 */

import type { QualifiedBuyerLeadStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import {
  assertOrganizationAccess,
  type OrgAccessActor,
} from "@/domains/organizations/tenant";
import { buildAnonymizedQualifiedProfile } from "./privacy";
import { evaluateBuyerQualification } from "./qualification-rules";

/** Default first-response SLA window (hours). Not a public score. */
export const QBL_FIRST_RESPONSE_SLA_HOURS = 24;

export function computeSlaDueAt(qualifiedAt: Date, hours = QBL_FIRST_RESPONSE_SLA_HOURS): Date {
  return new Date(qualifiedAt.getTime() + hours * 3_600_000);
}

export function evaluateSlaBreach(input: {
  slaDueAt: Date | null;
  firstResponseAt: Date | null;
  now?: Date;
}): { breached: boolean; responseTimeMs: number | null } {
  const now = input.now ?? new Date();
  if (!input.slaDueAt) {
    return { breached: false, responseTimeMs: null };
  }
  if (input.firstResponseAt) {
    const responseTimeMs =
      input.firstResponseAt.getTime() -
      (input.slaDueAt.getTime() - QBL_FIRST_RESPONSE_SLA_HOURS * 3_600_000);
    return {
      breached: input.firstResponseAt.getTime() > input.slaDueAt.getTime(),
      responseTimeMs: Math.max(0, responseTimeMs),
    };
  }
  return {
    breached: now.getTime() > input.slaDueAt.getTime(),
    responseTimeMs: null,
  };
}

export type QualifiedBuyerInboxItem = {
  leadId: string;
  propertyId: string;
  status: QualifiedBuyerLeadStatus;
  qualifiedAt: Date | null;
  slaDueAt: Date | null;
  firstResponseAt: Date | null;
  slaBreached: boolean;
  responseTimeMs: number | null;
  /** Anonymized only — never buyer email/phone without accept+consent. */
  anonymized: ReturnType<typeof buildAnonymizedQualifiedProfile>;
};

/**
 * Tenant-scoped inbox. AGENT sees only assigned leads; OWNER/ADMIN see org.
 */
export async function listQualifiedBuyerInbox(input: {
  actor: OrgAccessActor;
  organizationId: string;
  take?: number;
  now?: Date;
}): Promise<
  | { ok: true; items: QualifiedBuyerInboxItem[]; publicRankingEnabled: false }
  | { ok: false; error: string }
> {
  const access = await assertOrganizationAccess({
    actor: input.actor,
    organizationId: input.organizationId,
  });
  if (!access.ok) return { ok: false, error: access.error };

  const now = input.now ?? new Date();
  const isManager =
    access.memberRole === "OWNER" ||
    access.memberRole === "ADMIN" ||
    access.memberRole === "PLATFORM_ADMIN";

  const rows = await prisma.qualifiedBuyerLead.findMany({
    where: {
      organizationId: input.organizationId,
      ...(isManager ? {} : { agentUserId: input.actor.userId }),
      status: {
        in: ["PENDING_AGENT_REVIEW", "ACCEPTED", "EXPIRED"],
      },
    },
    orderBy: [{ slaDueAt: "asc" }, { createdAt: "desc" }],
    take: Math.min(input.take ?? 50, 100),
  });

  // Mark breaches without ranking
  const breachIds = rows
    .filter(
      (r) =>
        !r.firstResponseAt &&
        r.slaDueAt &&
        r.slaDueAt.getTime() < now.getTime() &&
        !r.slaBreachedAt,
    )
    .map((r) => r.id);
  if (breachIds.length > 0) {
    await prisma.qualifiedBuyerLead.updateMany({
      where: { id: { in: breachIds } },
      data: { slaBreachedAt: now },
    });
  }

  const items: QualifiedBuyerInboxItem[] = rows.map((lead) => {
    const sla = evaluateSlaBreach({
      slaDueAt: lead.slaDueAt,
      firstResponseAt: lead.firstResponseAt,
      now,
    });
    const rebuilt = evaluateBuyerQualification({
      contactVerification: lead.contactVerification,
      budgetBandMinCzk: lead.budgetBandMinCzk,
      budgetBandMaxCzk: lead.budgetBandMaxCzk,
      financingStance: lead.financingStance,
      timelineBand: lead.timelineBand,
    });
    const anonymized =
      lead.anonymizedProfileSnapshot &&
      typeof lead.anonymizedProfileSnapshot === "object"
        ? (lead.anonymizedProfileSnapshot as ReturnType<
            typeof buildAnonymizedQualifiedProfile
          >)
        : buildAnonymizedQualifiedProfile({
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

    return {
      leadId: lead.id,
      propertyId: lead.propertyId,
      status: lead.status,
      qualifiedAt: lead.qualifiedAt,
      slaDueAt: lead.slaDueAt,
      firstResponseAt: lead.firstResponseAt,
      slaBreached: sla.breached || Boolean(lead.slaBreachedAt),
      responseTimeMs: sla.responseTimeMs,
      anonymized,
    };
  });

  return { ok: true, items, publicRankingEnabled: false };
}

export async function recordQualifiedBuyerFirstResponse(input: {
  leadId: string;
  actorUserId: string;
  now?: Date;
}): Promise<{ ok: true; responseTimeMs: number | null } | { ok: false; error: string }> {
  const lead = await prisma.qualifiedBuyerLead.findUnique({
    where: { id: input.leadId },
  });
  if (!lead) return { ok: false, error: "Lead nenalezen." };

  const access = lead.organizationId
    ? await assertOrganizationAccess({
        actor: { userId: input.actorUserId, role: "USER" },
        organizationId: lead.organizationId,
      })
    : null;

  const allowed =
    lead.agentUserId === input.actorUserId ||
    (access &&
      access.ok &&
      (access.memberRole === "OWNER" ||
        access.memberRole === "ADMIN" ||
        access.memberRole === "PLATFORM_ADMIN"));

  if (!allowed) {
    return { ok: false, error: "Nemáte oprávnění k tomuto leadu." };
  }

  if (lead.firstResponseAt) {
    const sla = evaluateSlaBreach({
      slaDueAt: lead.slaDueAt,
      firstResponseAt: lead.firstResponseAt,
    });
    return { ok: true, responseTimeMs: sla.responseTimeMs };
  }

  const now = input.now ?? new Date();
  const sla = evaluateSlaBreach({
    slaDueAt: lead.slaDueAt,
    firstResponseAt: now,
    now,
  });

  await prisma.qualifiedBuyerLead.update({
    where: { id: lead.id },
    data: {
      firstResponseAt: now,
      ...(sla.breached && !lead.slaBreachedAt ? { slaBreachedAt: now } : {}),
      activities: {
        create: {
          type: "FIRST_RESPONSE",
          note: "První odpověď makléře zaznamenána (SLA měření).",
          meta: {
            responseTimeMs: sla.responseTimeMs,
            breached: sla.breached,
            publicRanking: false,
          },
        },
      },
    },
  });

  return { ok: true, responseTimeMs: sla.responseTimeMs };
}
