import { headers } from "next/headers";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

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
  meta?: Prisma.InputJsonValue;
}): Promise<void> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    null;
  const userAgent = h.get("user-agent")?.slice(0, 500) ?? null;

  await prisma.auditLog.create({
    data: {
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      actorId: input.actorId ?? undefined,
      ip,
      userAgent,
      meta: input.meta,
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
