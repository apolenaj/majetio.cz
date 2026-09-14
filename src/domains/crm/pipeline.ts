/**
 * CRM pipeline — status transitions, assignments, notes, nextAction, timeline.
 */

import type {
  LeadAssignmentRole,
  LeadNextActionType,
  LeadStatus,
  LeadType,
  Prisma,
} from "@prisma/client";

import { isLeadRoutingPaused } from "@/domains/markets/capabilities/kill-switch";
import { prisma } from "@/lib/db";
import {
  assertCanViewLead,
  buildLeadAccessWhere,
  type CrmActor,
} from "./access";
import { resolveCrmLeadRouting } from "./lead-routing";
import { sanitizeCrmPlainText } from "./sanitize-notes";

export const LEAD_STATUS_LABELS_CS: Record<LeadStatus, string> = {
  NEW: "Nový",
  CONTACTED: "Kontaktován",
  IN_PROGRESS: "V řešení",
  QUALIFIED: "Kvalifikovaný",
  WON: "Vyhraný",
  LOST: "Ztracený",
  HANDED_OFF: "Předaný",
};

/** Allowed pipeline transitions. */
export const LEAD_STATUS_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  NEW: ["CONTACTED", "IN_PROGRESS", "LOST", "HANDED_OFF"],
  CONTACTED: ["IN_PROGRESS", "QUALIFIED", "LOST", "HANDED_OFF"],
  IN_PROGRESS: ["CONTACTED", "QUALIFIED", "WON", "LOST", "HANDED_OFF"],
  QUALIFIED: ["IN_PROGRESS", "WON", "LOST", "HANDED_OFF"],
  HANDED_OFF: ["WON", "LOST", "IN_PROGRESS"],
  WON: [],
  LOST: [],
};

export type TimelineEntry = {
  id: string;
  type: string;
  note: string | null;
  visibility: "SYSTEM" | "INTERNAL";
  actorUserId: string | null;
  createdAt: Date;
  meta: unknown;
};

export function canTransitionLeadStatus(
  from: LeadStatus,
  to: LeadStatus,
): boolean {
  if (from === to) return true;
  return LEAD_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

async function appendActivity(input: {
  leadId: string;
  type: string;
  note?: string | null;
  actorUserId?: string | null;
  visibility?: "SYSTEM" | "INTERNAL";
  meta?: Record<string, unknown>;
  tx?: Prisma.TransactionClient | typeof prisma;
}): Promise<void> {
  const db = input.tx ?? prisma;
  await db.leadActivity.create({
    data: {
      leadId: input.leadId,
      type: input.type,
      note: input.note ? sanitizeCrmPlainText(input.note) : null,
      actorUserId: input.actorUserId ?? null,
      visibility: input.visibility ?? "SYSTEM",
      meta: (input.meta ?? undefined) as Prisma.InputJsonValue,
    },
  });
}

/**
 * Apply routing + optional assignment after lead create / type change.
 */
export async function applyLeadRouting(input: {
  leadId: string;
  actorUserId?: string | null;
  listingAgentUserId?: string | null;
  analystUserId?: string | null;
  organizationId?: string | null;
}): Promise<{ ok: true; routingRuleKey: string } | { ok: false; error: string }> {
  const lead = await prisma.lead.findUnique({ where: { id: input.leadId } });
  if (!lead) return { ok: false, error: "Lead nenalezen." };

  const marketCode = (
    (lead as { marketCode?: string }).marketCode ??
    lead.marketCountry ??
    "CZ"
  ).toUpperCase();
  if (isLeadRoutingPaused(marketCode)) {
    return {
      ok: false,
      error: `Lead routing pro trh ${marketCode} je dočasně pozastaven (kill switch).`,
    };
  }

  let listingAgent = input.listingAgentUserId ?? null;
  let organizationId = input.organizationId ?? lead.organizationId;
  if (lead.propertyId && (!listingAgent || !organizationId)) {
    const property = await prisma.property.findUnique({
      where: { id: lead.propertyId },
      select: { listedByUserId: true, organizationId: true },
    });
    listingAgent = listingAgent ?? property?.listedByUserId ?? null;
    organizationId = organizationId ?? property?.organizationId ?? null;
  }

  const decision = resolveCrmLeadRouting({
    leadType: lead.type,
    marketCountry: lead.marketCountry,
    listingAgentUserId: listingAgent,
    organizationId,
    analystUserId: input.analystUserId,
  });

  const assigneeId = decision.assignToUserId;

  await prisma.$transaction(async (tx) => {
    await tx.lead.update({
      where: { id: lead.id },
      data: {
        routingTarget: decision.target,
        routingRuleKey: decision.routingRuleKey,
        partner: decision.partner ?? lead.partner,
        organizationId: decision.organizationId ?? organizationId,
        assignedToUserId: assigneeId ?? lead.assignedToUserId,
        nextActionType:
          decision.target === "MORTGAGE_PARTNER"
            ? "AWAIT_PARTNER_RESPONSE"
            : decision.target === "LISTING_AGENT"
              ? "CONTACT_CLIENT"
              : decision.target === "INTERNAL_ANALYST"
                ? "INTERNAL_REVIEW"
                : lead.nextActionType,
        nextActionOwnerId: assigneeId ?? lead.nextActionOwnerId,
      },
    });

    if (assigneeId) {
      await tx.leadAssignment.upsert({
        where: {
          leadId_userId_role: {
            leadId: lead.id,
            userId: assigneeId,
            role: "ASSIGNEE",
          },
        },
        create: {
          leadId: lead.id,
          userId: assigneeId,
          organizationId: decision.organizationId ?? organizationId,
          role: "ASSIGNEE",
          assignedByUserId: input.actorUserId ?? null,
          active: true,
        },
        update: {
          active: true,
          unassignedAt: null,
          assignedAt: new Date(),
          assignedByUserId: input.actorUserId ?? null,
        },
      });
    }

    await appendActivity({
      leadId: lead.id,
      type: "ROUTING",
      note: decision.reasonCs,
      actorUserId: input.actorUserId,
      visibility: "SYSTEM",
      meta: {
        target: decision.target,
        routingRuleKey: decision.routingRuleKey,
        partner: decision.partner,
        integrationRef: decision.integrationRef,
      },
      tx,
    });
  });

  return { ok: true, routingRuleKey: decision.routingRuleKey };
}

export async function transitionLeadStatus(input: {
  leadId: string;
  toStatus: LeadStatus;
  actor: CrmActor;
  note?: string;
  now?: Date;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await assertCanViewLead(input.actor, input.leadId);
  if (!access.ok) return access;

  const from = access.lead.status;
  if (!canTransitionLeadStatus(from, input.toStatus)) {
    return {
      ok: false,
      error: `Přechod ${from} → ${input.toStatus} není povolen.`,
    };
  }

  const now = input.now ?? new Date();
  await prisma.$transaction(async (tx) => {
    await tx.lead.update({
      where: { id: input.leadId },
      data: { status: input.toStatus, statusChangedAt: now },
    });
    await appendActivity({
      leadId: input.leadId,
      type: "STATUS_CHANGE",
      note:
        input.note ??
        `${LEAD_STATUS_LABELS_CS[from]} → ${LEAD_STATUS_LABELS_CS[input.toStatus]}`,
      actorUserId: input.actor.userId,
      visibility: "SYSTEM",
      meta: { from, to: input.toStatus },
      tx,
    });
  });

  return { ok: true };
}

export async function assignLead(input: {
  leadId: string;
  assigneeUserId: string;
  actor: CrmActor;
  role?: LeadAssignmentRole;
  organizationId?: string | null;
  note?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await assertCanViewLead(input.actor, input.leadId);
  if (!access.ok) return access;

  const role = input.role ?? "ASSIGNEE";
  const note = input.note ? sanitizeCrmPlainText(input.note, 500) : null;

  await prisma.$transaction(async (tx) => {
    await tx.leadAssignment.upsert({
      where: {
        leadId_userId_role: {
          leadId: input.leadId,
          userId: input.assigneeUserId,
          role,
        },
      },
      create: {
        leadId: input.leadId,
        userId: input.assigneeUserId,
        organizationId:
          input.organizationId ?? access.lead.organizationId ?? null,
        role,
        assignedByUserId: input.actor.userId,
        note,
        active: true,
      },
      update: {
        active: true,
        unassignedAt: null,
        assignedAt: new Date(),
        assignedByUserId: input.actor.userId,
        note,
      },
    });

    if (role === "ASSIGNEE" || role === "OWNER") {
      await tx.lead.update({
        where: { id: input.leadId },
        data: {
          assignedToUserId: input.assigneeUserId,
          organizationId:
            input.organizationId ?? access.lead.organizationId ?? undefined,
        },
      });
    }

    await appendActivity({
      leadId: input.leadId,
      type: "ASSIGNMENT",
      note: note ?? "Lead přiřazen.",
      actorUserId: input.actor.userId,
      visibility: "SYSTEM",
      meta: { assigneeUserId: input.assigneeUserId, role },
      tx,
    });
  });

  return { ok: true };
}

export async function addInternalLeadNote(input: {
  leadId: string;
  actor: CrmActor;
  note: string;
}): Promise<{ ok: true; activityId: string } | { ok: false; error: string }> {
  const access = await assertCanViewLead(input.actor, input.leadId);
  if (!access.ok) return access;

  const sanitized = sanitizeCrmPlainText(input.note);
  if (sanitized.length < 1) {
    return { ok: false, error: "Poznámka je prázdná po sanitizaci." };
  }

  const activity = await prisma.leadActivity.create({
    data: {
      leadId: input.leadId,
      type: "INTERNAL_NOTE",
      note: sanitized,
      actorUserId: input.actor.userId,
      visibility: "INTERNAL",
    },
    select: { id: true },
  });

  return { ok: true, activityId: activity.id };
}

export async function setLeadNextAction(input: {
  leadId: string;
  actor: CrmActor;
  nextActionType: LeadNextActionType;
  dueAt?: Date | null;
  ownerUserId?: string | null;
  note?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await assertCanViewLead(input.actor, input.leadId);
  if (!access.ok) return access;

  const note = input.note ? sanitizeCrmPlainText(input.note, 1000) : null;
  const ownerUserId =
    input.ownerUserId === undefined
      ? access.lead.assignedToUserId
      : input.ownerUserId;

  await prisma.$transaction(async (tx) => {
    await tx.lead.update({
      where: { id: input.leadId },
      data: {
        nextActionType: input.nextActionType,
        nextActionDueAt: input.dueAt ?? null,
        nextActionOwnerId: ownerUserId,
        nextActionNote: note,
      },
    });
    await appendActivity({
      leadId: input.leadId,
      type: "NEXT_ACTION",
      note: note ?? `Next action: ${input.nextActionType}`,
      actorUserId: input.actor.userId,
      visibility: "INTERNAL",
      meta: {
        nextActionType: input.nextActionType,
        dueAt: input.dueAt?.toISOString() ?? null,
        ownerUserId,
      },
      tx,
    });
  });

  return { ok: true };
}

/** Timeline for CRM UI — includes INTERNAL notes (staff only). */
export async function getLeadTimeline(input: {
  leadId: string;
  actor: CrmActor;
  includeInternalNotes?: boolean;
}): Promise<
  | { ok: true; entries: TimelineEntry[] }
  | { ok: false; error: string }
> {
  const access = await assertCanViewLead(input.actor, input.leadId);
  if (!access.ok) return access;

  const includeInternal = input.includeInternalNotes !== false;
  const rows = await prisma.leadActivity.findMany({
    where: {
      leadId: input.leadId,
      ...(includeInternal ? {} : { visibility: "SYSTEM" }),
    },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  return {
    ok: true,
    entries: rows.map((r) => ({
      id: r.id,
      type: r.type,
      note: r.note,
      visibility: r.visibility,
      actorUserId: r.actorUserId,
      createdAt: r.createdAt,
      meta: r.meta,
    })),
  };
}

export async function listAccessibleLeads(input: {
  actor: CrmActor;
  status?: LeadStatus;
  type?: LeadType;
  /** Primary CRM filter — isolate markets (Rules 209+). */
  marketCode?: string;
  take?: number;
}): Promise<
  Array<{
    id: string;
    type: LeadType;
    status: LeadStatus;
    marketCode: string;
    assignedToUserId: string | null;
    ownerUserId: string | null;
    organizationId: string | null;
    routingTarget: string;
    nextActionType: LeadNextActionType;
    nextActionDueAt: Date | null;
    nextActionNote: string | null;
    expectedValueMinor: number | null;
    expectedValueCurrency: string | null;
    createdAt: Date;
  }>
> {
  const accessWhere = await buildLeadAccessWhere(input.actor);
  const rows = await prisma.lead.findMany({
    where: {
      ...accessWhere,
      ...(input.status ? { status: input.status } : {}),
      ...(input.type ? { type: input.type } : {}),
      ...(input.marketCode
        ? { marketCode: input.marketCode.toUpperCase() }
        : {}),
    },
    orderBy: [{ nextActionDueAt: "asc" }, { createdAt: "desc" }],
    take: Math.min(input.take ?? 50, 100),
    select: {
      id: true,
      type: true,
      status: true,
      marketCode: true,
      assignedToUserId: true,
      ownerUserId: true,
      organizationId: true,
      routingTarget: true,
      nextActionType: true,
      nextActionDueAt: true,
      nextActionNote: true,
      expectedValueMinor: true,
      expectedValueCurrency: true,
      createdAt: true,
    },
  });
  return rows;
}
