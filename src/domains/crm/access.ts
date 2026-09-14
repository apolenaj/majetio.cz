/**
 * CRM RBAC — agent sees own leads, agency manager org-wide, system admin all.
 */

import type { Lead, LeadType, Role } from "@prisma/client";

import { prisma } from "@/lib/db";

export type CrmActor = {
  userId: string;
  role: Role;
};

const SYSTEM_ADMIN_ROLES: Role[] = ["ADMIN", "SUPER_ADMIN"];
const SALES_ROLES: Role[] = ["SALES", "ADMIN", "SUPER_ADMIN"];
const ANALYST_ROLES: Role[] = ["ANALYST", "ADMIN", "SUPER_ADMIN"];

export function isSystemAdmin(actor: CrmActor): boolean {
  return SYSTEM_ADMIN_ROLES.includes(actor.role);
}

export async function listManagedOrganizationIds(
  userId: string,
): Promise<string[]> {
  const memberships = await prisma.organizationMember.findMany({
    where: {
      userId,
      active: true,
      role: { in: ["OWNER", "ADMIN"] },
    },
    select: { organizationId: true },
  });
  return memberships.map((m) => m.organizationId);
}

/**
 * Prisma where fragment for listLeads — never returns unscoped OR for agents.
 */
export async function buildLeadAccessWhere(
  actor: CrmActor,
): Promise<Record<string, unknown>> {
  if (isSystemAdmin(actor) || actor.role === "SALES") {
    return {};
  }

  if (ANALYST_ROLES.includes(actor.role) && actor.role === "ANALYST") {
    return {
      OR: [
        { assignedToUserId: actor.userId },
        {
          assignments: {
            some: { userId: actor.userId, active: true },
          },
        },
        {
          type: { in: ["PROPERTY_AUDIT", "ANALYSIS_INTEREST"] satisfies LeadType[] },
          routingTarget: "INTERNAL_ANALYST",
        },
      ],
    };
  }

  const managedOrgIds = await listManagedOrganizationIds(actor.userId);
  const or: Record<string, unknown>[] = [
    { assignedToUserId: actor.userId },
    {
      assignments: {
        some: { userId: actor.userId, active: true },
      },
    },
  ];

  if (managedOrgIds.length > 0) {
    or.push({ organizationId: { in: managedOrgIds } });
  }

  return { OR: or };
}

export async function canActorViewLead(
  actor: CrmActor,
  lead: Pick<
    Lead,
    "id" | "assignedToUserId" | "organizationId" | "type" | "routingTarget"
  >,
): Promise<boolean> {
  if (isSystemAdmin(actor) || actor.role === "SALES") return true;

  if (lead.assignedToUserId === actor.userId) return true;

  const assignment = await prisma.leadAssignment.findFirst({
    where: { leadId: lead.id, userId: actor.userId, active: true },
    select: { id: true },
  });
  if (assignment) return true;

  if (
    actor.role === "ANALYST" &&
    (lead.type === "PROPERTY_AUDIT" || lead.type === "ANALYSIS_INTEREST") &&
    lead.routingTarget === "INTERNAL_ANALYST"
  ) {
    return true;
  }

  if (lead.organizationId) {
    const membership = await prisma.organizationMember.findFirst({
      where: {
        organizationId: lead.organizationId,
        userId: actor.userId,
        active: true,
        role: { in: ["OWNER", "ADMIN"] },
      },
      select: { id: true },
    });
    if (membership) return true;
  }

  return false;
}

export async function assertCanViewLead(
  actor: CrmActor,
  leadId: string,
): Promise<
  | { ok: true; lead: Lead }
  | { ok: false; error: string }
> {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return { ok: false, error: "Lead nenalezen." };
  const allowed = await canActorViewLead(actor, lead);
  if (!allowed) return { ok: false, error: "Nemáte oprávnění k tomuto leadu." };
  return { ok: true, lead };
}

export { SALES_ROLES, ANALYST_ROLES };
