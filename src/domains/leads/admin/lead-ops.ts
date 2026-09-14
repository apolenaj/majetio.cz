/**
 * Lead Operations — mini CRM queues for admin.
 */

import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/auth/audit";

export type LeadOpsQueues = {
  failedSubmissions: Array<{
    id: string;
    leadId: string | null;
    status: string;
    errorMessage: string | null;
    createdAt: Date;
  }>;
  unassigned: Array<{
    id: string;
    type: string;
    status: string;
    email: string | null;
    source: string | null;
    createdAt: Date;
  }>;
  stale: Array<{
    id: string;
    type: string;
    status: string;
    nextActionDueAt: Date | null;
    assignedToUserId: string | null;
    updatedAt: Date;
  }>;
  error: string | null;
};

const STALE_DAYS = 7;

export async function buildLeadOpsQueues(): Promise<LeadOpsQueues> {
  const staleBefore = new Date();
  staleBefore.setDate(staleBefore.getDate() - STALE_DAYS);

  try {
    const [failedSubmissions, unassigned, stale] = await Promise.all([
      prisma.mortgageLeadSubmissionAttempt.findMany({
        where: {
          status: {
            in: ["FAILED_TRANSIENT", "FAILED_PERMANENT", "DEAD_LETTER"],
          },
        },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          leadId: true,
          status: true,
          errorMessage: true,
          createdAt: true,
        },
      }),
      prisma.lead.findMany({
        where: {
          OR: [
            { routingTarget: "UNASSIGNED" },
            { assignedToUserId: null, ownerUserId: null },
          ],
          status: { in: ["NEW", "CONTACTED", "IN_PROGRESS"] },
        },
        orderBy: { createdAt: "desc" },
        take: 40,
        select: {
          id: true,
          type: true,
          status: true,
          email: true,
          source: true,
          createdAt: true,
        },
      }),
      prisma.lead.findMany({
        where: {
          status: { in: ["NEW", "CONTACTED", "IN_PROGRESS", "QUALIFIED"] },
          updatedAt: { lt: staleBefore },
        },
        orderBy: { updatedAt: "asc" },
        take: 40,
        select: {
          id: true,
          type: true,
          status: true,
          nextActionDueAt: true,
          assignedToUserId: true,
          updatedAt: true,
        },
      }),
    ]);

    return {
      failedSubmissions: failedSubmissions.map((f) => ({
        id: f.id,
        leadId: f.leadId,
        status: String(f.status),
        errorMessage: f.errorMessage,
        createdAt: f.createdAt,
      })),
      unassigned,
      stale,
      error: null,
    };
  } catch (err) {
    return {
      failedSubmissions: [],
      unassigned: [],
      stale: [],
      error: err instanceof Error ? err.message : "Lead ops failed",
    };
  }
}

export async function assignLeadAdmin(input: {
  leadId: string;
  assigneeUserId: string;
  actorUserId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await prisma.lead.update({
    where: { id: input.leadId },
    data: {
      assignedToUserId: input.assigneeUserId,
      ownerUserId: input.assigneeUserId,
      routingTarget: "INTERNAL_ANALYST",
    },
  });
  await writeAuditLog({
    action: "admin.lead.assign",
    entity: "Lead",
    entityId: input.leadId,
    actorId: input.actorUserId,
    meta: { assigneeUserId: input.assigneeUserId },
  });
  return { ok: true };
}
