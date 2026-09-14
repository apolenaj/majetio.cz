/**
 * Monetization audit trail (checklist 207, 210).
 * Price changes, manual entitlements, success-fee validations.
 */

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

export const MONETIZATION_AUDIT_ACTIONS = [
  "pricing.plan.upsert",
  "pricing.plan.archive",
  "entitlement.manual.grant",
  "entitlement.manual.revoke",
  "success_fee.verify",
  "success_fee.reverse",
  "org.billing_mode.change",
  "revenue.commerce.recognized",
  "revenue.reversed",
  "reconciliation.run",
  "payment.refund.admin",
  "attribution.resolve",
  "fraud.signal.blocked",
] as const;

export type MonetizationAuditAction =
  (typeof MONETIZATION_AUDIT_ACTIONS)[number];

/**
 * Server-side audit write — safe without Next headers (jobs / webhooks).
 */
export async function writeMonetizationAuditLog(input: {
  action: MonetizationAuditAction | string;
  entity: string;
  entityId?: string | null;
  actorId?: string | null;
  meta?: Prisma.InputJsonValue;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<string> {
  const row = await prisma.auditLog.create({
    data: {
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      actorId: input.actorId ?? null,
      ip: input.ip ?? null,
      userAgent: input.userAgent?.slice(0, 500) ?? null,
      meta: input.meta,
    },
    select: { id: true },
  });
  return row.id;
}

export async function listMonetizationAuditLogs(input?: {
  take?: number;
  actions?: string[];
}) {
  return prisma.auditLog.findMany({
    where: {
      action: input?.actions?.length
        ? { in: input.actions }
        : {
            in: [...MONETIZATION_AUDIT_ACTIONS],
          },
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(input?.take ?? 50, 200),
    select: {
      id: true,
      action: true,
      entity: true,
      entityId: true,
      actorId: true,
      createdAt: true,
      meta: true,
    },
  });
}
