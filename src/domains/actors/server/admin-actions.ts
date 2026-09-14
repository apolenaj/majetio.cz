"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { auth } from "@/lib/auth";
import {
  assertSensitiveAction,
  roleHasPermission,
  SensitiveActionError,
} from "@/domains/administration";
import { writeAuditLog } from "@/lib/auth/audit";
import {
  assertNotImpersonating,
  endImpersonation,
  IMPERSONATION_COOKIE,
  loadAdminUserDetail,
  markUserDeletionRequested,
  startImpersonation,
  suspendUser,
  unsuspendUser,
} from "@/domains/users/admin/user-ops";
import {
  auditOrgDocumentAccess,
  decideOrganizationKyc,
  registerOrgVerificationDocument,
} from "@/domains/organizations/admin/org-ops";
import { assignLeadAdmin } from "@/domains/leads/admin/lead-ops";
import {
  activatePricingPlan,
  createPricingPlanDraft,
  refuseManualPaymentSucceeded,
} from "@/domains/commerce/admin/pricing-governance";

async function requireActor() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    return { ok: false as const, error: "Přihlášení je povinné." };
  }
  return {
    ok: true as const,
    userId: session.user.id,
    role: session.user.role,
  };
}

function revalidateActors() {
  revalidatePath("/admin/uzivatele");
  revalidatePath("/admin/organizace");
  revalidatePath("/admin/leady");
  revalidatePath("/admin/objednavky");
  revalidatePath("/admin/ceník");
  revalidatePath("/admin/cenik");
  revalidatePath("/admin");
}

export async function adminSuspendUserAction(input: {
  userId: string;
  reason: string;
}) {
  const actor = await requireActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };
  if (!roleHasPermission(actor.role, "users.suspend")) {
    return { ok: false as const, error: "Chybí users.suspend." };
  }
  const result = await suspendUser({
    userId: input.userId,
    reason: input.reason,
    actorUserId: actor.userId,
  });
  if (!result.ok) return result;
  revalidateActors();
  revalidatePath(`/admin/uzivatele/${input.userId}`);
  return { ok: true as const };
}

export async function adminUnsuspendUserAction(input: {
  userId: string;
  reason: string;
}) {
  const actor = await requireActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };
  if (!roleHasPermission(actor.role, "users.suspend")) {
    return { ok: false as const, error: "Chybí users.suspend." };
  }
  const result = await unsuspendUser({
    userId: input.userId,
    reason: input.reason,
    actorUserId: actor.userId,
  });
  if (!result.ok) return result;
  revalidateActors();
  return { ok: true as const };
}

export async function adminMarkDeletionRequestedAction(input: {
  userId: string;
  reason: string;
}) {
  const actor = await requireActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };
  if (!roleHasPermission(actor.role, "users.suspend")) {
    return { ok: false as const, error: "Chybí oprávnění." };
  }
  const result = await markUserDeletionRequested({
    ...input,
    actorUserId: actor.userId,
  });
  if (!result.ok) return result;
  revalidateActors();
  return { ok: true as const };
}

export async function adminRevealFinancialPassportAction(input: {
  userId: string;
  reason: string;
  confirmToken: string;
}) {
  const actor = await requireActor();
  if (!actor.ok) {
    return {
      ok: false as const,
      error: actor.error,
      financialPassport: null,
    };
  }
  if (!roleHasPermission(actor.role, "users.financial_passport.read")) {
    return {
      ok: false as const,
      error: "Chybí users.financial_passport.read.",
      financialPassport: null,
    };
  }
  try {
    await assertSensitiveAction({
      actorId: actor.userId,
      actorRole: actor.role,
      permission: "users.financial_passport.read",
      reason: input.reason,
      confirmToken: input.confirmToken,
      entity: "FinancialProfile",
      entityId: input.userId,
    });
  } catch (err) {
    if (err instanceof SensitiveActionError) {
      return { ok: false as const, error: err.message, financialPassport: null };
    }
    throw err;
  }

  await writeAuditLog({
    action: "admin.financial_passport.read",
    entity: "FinancialProfile",
    entityId: input.userId,
    actorId: actor.userId,
    meta: {
      sensitivity: "PROTECTED",
      reason: input.reason.trim().slice(0, 300),
    },
  });

  const detail = await loadAdminUserDetail({
    userId: input.userId,
    includeFinancialPassport: true,
  });
  return {
    ok: true as const,
    financialPassport: detail.financialPassport,
  };
}

export async function adminStartImpersonationAction(input: {
  targetUserId: string;
  reason: string;
  confirmToken: string;
}) {
  const actor = await requireActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };
  if (!roleHasPermission(actor.role, "users.impersonate")) {
    return { ok: false as const, error: "Chybí users.impersonate." };
  }
  try {
    await assertSensitiveAction({
      actorId: actor.userId,
      actorRole: actor.role,
      permission: "users.impersonate",
      reason: input.reason,
      confirmToken: input.confirmToken,
      entity: "User",
      entityId: input.targetUserId,
    });
  } catch (err) {
    if (err instanceof SensitiveActionError) {
      return { ok: false as const, error: err.message };
    }
    throw err;
  }

  const result = await startImpersonation({
    targetUserId: input.targetUserId,
    actorUserId: actor.userId,
    reason: input.reason,
  });
  if (!result.ok) return result;

  const jar = await cookies();
  jar.set(IMPERSONATION_COOKIE, result.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60,
  });

  revalidateActors();
  return { ok: true as const };
}

export async function adminEndImpersonationAction() {
  const actor = await requireActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };
  const jar = await cookies();
  const token = jar.get(IMPERSONATION_COOKIE)?.value ?? null;
  const result = await endImpersonation({
    actorUserId: actor.userId,
    token,
  });
  jar.delete(IMPERSONATION_COOKIE);
  if (!result.ok) return result;
  revalidateActors();
  return { ok: true as const };
}

export async function adminDecideOrgKycAction(input: {
  organizationId: string;
  decision: "VERIFIED" | "REJECTED" | "PENDING";
  reason: string;
}) {
  const actor = await requireActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };
  if (!roleHasPermission(actor.role, "orgs.verify")) {
    return { ok: false as const, error: "Chybí orgs.verify." };
  }
  const result = await decideOrganizationKyc({
    ...input,
    actorUserId: actor.userId,
  });
  if (!result.ok) return result;
  revalidateActors();
  revalidatePath(`/admin/organizace/${input.organizationId}`);
  return { ok: true as const };
}

export async function adminRegisterOrgDocAction(input: {
  organizationId: string;
  storageKey: string;
  fileName: string;
  contentType: string;
  notes?: string;
}) {
  const actor = await requireActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };
  if (!roleHasPermission(actor.role, "orgs.verify")) {
    return { ok: false as const, error: "Chybí orgs.verify." };
  }
  const result = await registerOrgVerificationDocument({
    ...input,
    actorUserId: actor.userId,
  });
  if (!result.ok) return result;
  revalidateActors();
  return result;
}

export async function adminAccessOrgDocAction(input: { documentId: string }) {
  const actor = await requireActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };
  if (!roleHasPermission(actor.role, "orgs.verify")) {
    return { ok: false as const, error: "Chybí orgs.verify." };
  }
  return auditOrgDocumentAccess({
    documentId: input.documentId,
    actorUserId: actor.userId,
  });
}

export async function adminAssignLeadAction(input: {
  leadId: string;
  assigneeUserId: string;
}) {
  const actor = await requireActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };
  if (!roleHasPermission(actor.role, "leads.write")) {
    return { ok: false as const, error: "Chybí leads.write." };
  }
  const result = await assignLeadAdmin({
    ...input,
    actorUserId: actor.userId,
  });
  if (!result.ok) return result;
  revalidateActors();
  return { ok: true as const };
}

export async function adminCreatePricingDraftAction(input: {
  fromPlanId?: string;
  key: string;
  versionKey: string;
  name: string;
  priceGrossMinor: number;
  changeReason: string;
  effectiveFrom: string;
}) {
  const actor = await requireActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };
  if (!roleHasPermission(actor.role, "pricing.write")) {
    return { ok: false as const, error: "Chybí pricing.write." };
  }
  const effectiveFrom = new Date(input.effectiveFrom);
  if (Number.isNaN(effectiveFrom.getTime())) {
    return { ok: false as const, error: "Neplatné effective date." };
  }
  const result = await createPricingPlanDraft({
    ...input,
    effectiveFrom,
    actorUserId: actor.userId,
  });
  if (!result.ok) return result;
  revalidateActors();
  return result;
}

export async function adminActivatePricingPlanAction(input: {
  planId: string;
  reason: string;
  confirmToken: string;
}) {
  const actor = await requireActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };
  if (!roleHasPermission(actor.role, "pricing.approve")) {
    return { ok: false as const, error: "Chybí pricing.approve." };
  }
  try {
    await assertSensitiveAction({
      actorId: actor.userId,
      actorRole: actor.role,
      permission: "pricing.approve",
      reason: input.reason,
      confirmToken: input.confirmToken,
      entity: "PricingPlan",
      entityId: input.planId,
    });
  } catch (err) {
    if (err instanceof SensitiveActionError) {
      return { ok: false as const, error: err.message };
    }
    throw err;
  }
  const result = await activatePricingPlan({
    planId: input.planId,
    actorUserId: actor.userId,
    reason: input.reason,
  });
  if (!result.ok) return result;
  revalidateActors();
  return { ok: true as const };
}

/** Explicitly blocked — never force Payment.SUCCEEDED from admin. */
export async function adminForcePaymentSucceededAction(input: {
  paymentId: string;
}) {
  const actor = await requireActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };
  return refuseManualPaymentSucceeded({
    paymentId: input.paymentId,
    actorUserId: actor.userId,
  });
}
