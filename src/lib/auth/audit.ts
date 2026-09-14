import { headers } from "next/headers";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import {
  sanitizeAuditMeta,
  truncateSummary,
  type AuditActorType,
} from "@/domains/administration/audit/ops-audit-log";

export type AuditAction =
  | "auth.register"
  | "auth.login.success"
  | "auth.login.failure"
  | "auth.logout"
  | "auth.password_reset.request"
  | "auth.password_reset.success"
  | "auth.password_change"
  | "consent.grant"
  | "consent.revoke"
  | "onboarding.complete"
  | "onboarding.skip";

export async function writeAuditLog(input: {
  action: AuditAction | string;
  entity: string;
  entityId?: string;
  actorId?: string | null;
  actorType?: AuditActorType;
  reason?: string | null;
  beforeSummary?: string | null;
  afterSummary?: string | null;
  correlationId?: string | null;
  meta?: Prisma.InputJsonValue;
}): Promise<void> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    null;
  const userAgent = h.get("user-agent")?.slice(0, 500) ?? null;

  const metaRecord =
    input.meta && typeof input.meta === "object" && !Array.isArray(input.meta)
      ? (input.meta as Record<string, unknown>)
      : input.meta != null
        ? { value: input.meta }
        : null;

  await prisma.auditLog.create({
    data: {
      action: input.action,
      entity: input.entity,
      entityType: input.entity,
      entityId: input.entityId,
      actorId: input.actorId ?? undefined,
      actorType: input.actorType ?? (input.actorId ? "USER" : "SYSTEM"),
      reason: truncateSummary(input.reason, 2000),
      beforeSummary: truncateSummary(input.beforeSummary, 2000),
      afterSummary: truncateSummary(input.afterSummary, 2000),
      correlationId: input.correlationId ?? undefined,
      ip,
      userAgent,
      meta: sanitizeAuditMeta(metaRecord),
    },
  });
}

export async function getRequestIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}
