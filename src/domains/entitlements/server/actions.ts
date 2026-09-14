"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth/roles";
import {
  assertFeatureAccess,
  grantManualEntitlement,
  listManualEntitlementsForUser,
  revokeManualEntitlement,
  type EntitlementFeature,
} from "@/domains/entitlements";
import { prisma } from "@/lib/db";

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

async function requireAdminId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const role = session.user.role;
  if (!role || !isAdmin(role)) return null;
  return session.user.id;
}

/** Client/server gate for paid B2C features (177–179 after grant). */
export async function checkFeatureAccessAction(input: {
  feature: EntitlementFeature;
  propertyId?: string | null;
  contentVersionKey?: string | null;
  recordView?: boolean;
  /** Product marketScope gate (Buyer Pass CZ ≠ UAE). */
  marketCode?: string | null;
}) {
  const userId = await requireUserId();
  if (!userId) {
    return {
      ok: false as const,
      allowed: false as const,
      error: "Přihlášení je povinné.",
      code: "unauthorized" as const,
    };
  }
  const result = await assertFeatureAccess({
    userId,
    feature: input.feature,
    propertyId: input.propertyId,
    contentVersionKey: input.contentVersionKey,
    recordView: input.recordView,
    marketCode: input.marketCode,
  });
  return { ok: true as const, ...result };
}

export async function listMyEntitlementsAction() {
  const userId = await requireUserId();
  if (!userId) {
    return { ok: false as const, error: "unauthorized" as const, entitlements: [] };
  }
  const entitlements = await prisma.entitlement.findMany({
    where: {
      userId,
      status: { in: ["ACTIVE", "TRIAL", "PAST_DUE", "PENDING_GRANT"] },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      productKey: true,
      kind: true,
      source: true,
      status: true,
      expiresAt: true,
      propertyId: true,
      featureKeys: true,
      grantedAt: true,
    },
  });
  return { ok: true as const, entitlements };
}

export async function adminGrantManualEntitlementAction(input: {
  userEmail: string;
  productKey: string;
  reason: string;
  expiresAtIso?: string | null;
  featureKeys?: string[];
}) {
  const actorId = await requireAdminId();
  if (!actorId) {
    return { ok: false as const, error: "Vyžadována role ADMIN." };
  }

  const { assertNotImpersonating } = await import(
    "@/domains/users/admin/user-ops"
  );
  const gate = await assertNotImpersonating(actorId);
  if (!gate.ok) {
    return { ok: false as const, error: gate.error };
  }

  const email = input.userEmail.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) {
    return { ok: false as const, error: "Uživatel s tímto e-mailem nenalezen." };
  }

  let expiresAt: Date | null = null;
  if (input.expiresAtIso?.trim()) {
    const d = new Date(input.expiresAtIso);
    if (Number.isNaN(d.getTime())) {
      return { ok: false as const, error: "Neplatné datum expirace." };
    }
    expiresAt = d;
  }

  const result = await grantManualEntitlement({
    userId: user.id,
    productKey: input.productKey.trim(),
    reason: input.reason,
    actorUserId: actorId,
    expiresAt,
    featureKeys: input.featureKeys ?? ["BASIC_SCORE", "BASIC_RISKS", "DEEP_ANALYSIS"],
  });

  if (!result.ok) return result;

  revalidatePath("/admin/uzivatele");
  return { ok: true as const, entitlementId: result.entitlementId };
}

export async function adminRevokeManualEntitlementAction(input: {
  entitlementId: string;
  reason: string;
}) {
  const actorId = await requireAdminId();
  if (!actorId) {
    return { ok: false as const, error: "Vyžadována role ADMIN." };
  }
  const result = await revokeManualEntitlement({
    entitlementId: input.entitlementId,
    actorUserId: actorId,
    reason: input.reason,
  });
  if (!result.ok) return result;
  revalidatePath("/admin/uzivatele");
  return { ok: true as const };
}

export async function adminListManualEntitlementsAction(input: {
  userEmail: string;
}) {
  const actorId = await requireAdminId();
  if (!actorId) {
    return { ok: false as const, error: "unauthorized" as const, entitlements: [] };
  }
  const user = await prisma.user.findUnique({
    where: { email: input.userEmail.trim().toLowerCase() },
    select: { id: true },
  });
  if (!user) {
    return { ok: false as const, error: "Uživatel nenalezen.", entitlements: [] };
  }
  const entitlements = await listManualEntitlementsForUser(user.id);
  return { ok: true as const, entitlements, userId: user.id };
}
