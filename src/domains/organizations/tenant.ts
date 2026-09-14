/**
 * Strict tenant boundaries for B2B orgs (checklist 174 / 175).
 * Never trust client-supplied organizationId without membership check.
 */

import type { OrganizationMemberRole, Role } from "@prisma/client";

import { prisma } from "@/lib/db";

export type OrgAccessActor = {
  userId: string;
  role: Role;
};

const PLATFORM_ADMIN: Role[] = ["ADMIN", "SUPER_ADMIN"];

export type OrganizationAccess =
  | {
      ok: true;
      organizationId: string;
      memberRole: OrganizationMemberRole | "PLATFORM_ADMIN";
      canManageOrg: boolean;
      canViewBilling: boolean;
    }
  | { ok: false; error: string; code: "forbidden" | "not_found" };

/**
 * Assert actor may access organization data.
 * Agents: member only. Billing/settings: OWNER/ADMIN (or platform admin).
 */
export async function assertOrganizationAccess(input: {
  actor: OrgAccessActor;
  organizationId: string;
  /** Require OWNER/ADMIN (billing, verification, plan changes). */
  requireManager?: boolean;
  /** Require OWNER for billing mutations. */
  requireBilling?: boolean;
}): Promise<OrganizationAccess> {
  const org = await prisma.organization.findUnique({
    where: { id: input.organizationId },
    select: { id: true },
  });
  if (!org) {
    return { ok: false, error: "Organizace nenalezena.", code: "not_found" };
  }

  if (PLATFORM_ADMIN.includes(input.actor.role)) {
    return {
      ok: true,
      organizationId: org.id,
      memberRole: "PLATFORM_ADMIN",
      canManageOrg: true,
      canViewBilling: true,
    };
  }

  const membership = await prisma.organizationMember.findFirst({
    where: {
      organizationId: input.organizationId,
      userId: input.actor.userId,
      active: true,
    },
    select: { role: true },
  });
  if (!membership) {
    return {
      ok: false,
      error: "Nemáte přístup k této organizaci.",
      code: "forbidden",
    };
  }

  const canManageOrg =
    membership.role === "OWNER" || membership.role === "ADMIN";
  const canViewBilling = membership.role === "OWNER" || membership.role === "ADMIN";

  if (input.requireBilling && membership.role !== "OWNER" && membership.role !== "ADMIN") {
    return {
      ok: false,
      error: "Billing mohou spravovat jen OWNER/ADMIN organizace.",
      code: "forbidden",
    };
  }
  if (input.requireManager && !canManageOrg) {
    return {
      ok: false,
      error: "Vyžadována role OWNER nebo ADMIN.",
      code: "forbidden",
    };
  }

  return {
    ok: true,
    organizationId: org.id,
    memberRole: membership.role,
    canManageOrg,
    canViewBilling,
  };
}

/** IDOR helper — returns null when cross-tenant. */
export async function getOrganizationForActor(input: {
  actor: OrgAccessActor;
  organizationId: string;
  requireManager?: boolean;
}) {
  const access = await assertOrganizationAccess(input);
  if (!access.ok) return null;
  return prisma.organization.findUnique({
    where: { id: access.organizationId },
  });
}

export function buildPropertyTenantWhere(input: {
  actorUserId: string;
  organizationId: string;
  memberRole: OrganizationMemberRole | "PLATFORM_ADMIN";
}): Record<string, unknown> {
  if (
    input.memberRole === "PLATFORM_ADMIN" ||
    input.memberRole === "OWNER" ||
    input.memberRole === "ADMIN"
  ) {
    return { organizationId: input.organizationId };
  }
  // AGENT — only own listings inside the org
  return {
    organizationId: input.organizationId,
    listedByUserId: input.actorUserId,
  };
}
