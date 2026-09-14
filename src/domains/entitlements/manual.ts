/**
 * Manual admin entitlements (checklist 208 / 209).
 * Always source=MANUAL_ADMIN — never written as PAID_ORDER.
 */

import type { EntitlementKind, Prisma } from "@prisma/client";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/db";

export type GrantManualEntitlementInput = {
  userId: string;
  productKey: string;
  kind?: EntitlementKind;
  featureKeys?: string[];
  reason: string;
  actorUserId: string;
  expiresAt?: Date | null;
  propertyId?: string | null;
  analysisId?: string | null;
  contentVersionKey?: string | null;
  now?: Date;
  tx?: Prisma.TransactionClient | typeof prisma;
};

function assertReason(reason: string): string | null {
  const trimmed = reason.trim();
  if (trimmed.length < 8) {
    return "Důvod manuálního entitlementu musí mít alespoň 8 znaků.";
  }
  if (trimmed.length > 2000) {
    return "Důvod je příliš dlouhý.";
  }
  return null;
}

/**
 * Admin grant — explicit reason + actor. Never sets orderId (paid separation).
 */
export async function grantManualEntitlement(
  input: GrantManualEntitlementInput,
): Promise<
  | { ok: true; entitlementId: string }
  | { ok: false; error: string }
> {
  const reasonError = assertReason(input.reason);
  if (reasonError) return { ok: false, error: reasonError };

  const actor = await prisma.user.findUnique({
    where: { id: input.actorUserId },
    select: { id: true, role: true },
  });
  if (!actor) return { ok: false, error: "Admin actor nenalezen." };
  if (actor.role !== Role.ADMIN && actor.role !== Role.SUPER_ADMIN) {
    return { ok: false, error: "Manuální entitlement vyžaduje ADMIN / SUPER_ADMIN." };
  }

  const now = input.now ?? new Date();
  const db = input.tx ?? prisma;

  const row = await db.entitlement.create({
    data: {
      userId: input.userId,
      orderId: null,
      productKey: input.productKey,
      kind: input.kind ?? "LEGACY_PRODUCT",
      source: "MANUAL_ADMIN",
      status: "ACTIVE",
      featureKeys: input.featureKeys ?? [],
      propertyId: input.propertyId ?? null,
      analysisId: input.analysisId ?? null,
      contentVersionKey: input.contentVersionKey ?? null,
      expiresAt: input.expiresAt ?? null,
      grantedAt: now,
      manualReason: input.reason.trim(),
      manualActorUserId: input.actorUserId,
      manualGrantedAt: now,
      grantAttempts: 1,
      meta: {
        source: "MANUAL_ADMIN",
        separatedFromPaid: true,
      },
    },
  });

  const { writeMonetizationAuditLog } = await import(
    "@/domains/revenue/monetization-audit"
  );
  await writeMonetizationAuditLog({
    action: "entitlement.manual.grant",
    entity: "Entitlement",
    entityId: row.id,
    actorId: input.actorUserId,
    meta: {
      userId: input.userId,
      productKey: input.productKey,
      reason: input.reason.trim().slice(0, 200),
      expiresAt: input.expiresAt?.toISOString() ?? null,
    },
  }).catch(() => undefined);

  return { ok: true, entitlementId: row.id };
}

export async function listManualEntitlementsForUser(userId: string) {
  return prisma.entitlement.findMany({
    where: { userId, source: "MANUAL_ADMIN" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      productKey: true,
      kind: true,
      status: true,
      expiresAt: true,
      manualReason: true,
      manualActorUserId: true,
      manualGrantedAt: true,
      createdAt: true,
    },
  });
}

export async function revokeManualEntitlement(input: {
  entitlementId: string;
  actorUserId: string;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const reasonError = assertReason(input.reason);
  if (reasonError) return { ok: false, error: reasonError };

  const row = await prisma.entitlement.findUnique({
    where: { id: input.entitlementId },
  });
  if (!row) return { ok: false, error: "Entitlement nenalezen." };
  if (row.source !== "MANUAL_ADMIN") {
    return {
      ok: false,
      error: "Lze revokovat jen MANUAL_ADMIN — placené řešte refund/chargeback.",
    };
  }

  await prisma.entitlement.update({
    where: { id: row.id },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
      revokeReason: `manual:${input.reason.trim()}`,
      meta: {
        ...(typeof row.meta === "object" && row.meta !== null
          ? (row.meta as object)
          : {}),
        revokedByActorUserId: input.actorUserId,
      },
    },
  });

  const { writeMonetizationAuditLog } = await import(
    "@/domains/revenue/monetization-audit"
  );
  await writeMonetizationAuditLog({
    action: "entitlement.manual.revoke",
    entity: "Entitlement",
    entityId: row.id,
    actorId: input.actorUserId,
    meta: { reason: input.reason.trim().slice(0, 200) },
  }).catch(() => undefined);

  return { ok: true };
}
