"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { createAdminRefund } from "@/domains/payments";
import { prisma } from "@/lib/db";
import { writeMonetizationAuditLog } from "@/domains/revenue/monetization-audit";
import {
  assertSensitiveAction,
  roleHasPermission,
  SensitiveActionError,
} from "@/domains/administration";
import { assertNotImpersonating } from "@/domains/users/admin/user-ops";

async function requireCommerceActor(): Promise<
  | { ok: true; userId: string; role: string }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    return { ok: false, error: "Přihlášení je povinné." };
  }
  return {
    ok: true,
    userId: session.user.id,
    role: session.user.role,
  };
}

export async function adminRefundOrderAction(input: {
  orderId: string;
  reason: string;
  /** Step-up confirm — must be CONFIRM_ACTION */
  confirmToken?: string;
  amountMinor?: number;
  kind?: "refund" | "storno" | "chargeback";
}) {
  const actor = await requireCommerceActor();
  if (!actor.ok) {
    return { ok: false as const, error: actor.error };
  }

  if (!roleHasPermission(actor.role, "payments.refund")) {
    return {
      ok: false as const,
      error: "Chybí oprávnění payments.refund.",
    };
  }

  const notImpersonating = await assertNotImpersonating(actor.userId);
  if (!notImpersonating.ok) {
    return { ok: false as const, error: notImpersonating.error };
  }

  try {
    await assertSensitiveAction({
      actorId: actor.userId,
      actorRole: actor.role,
      permission: "payments.refund",
      reason: input.reason,
      confirmToken: input.confirmToken ?? "",
      entity: "Order",
      entityId: input.orderId,
      meta: { kind: input.kind ?? "storno" },
    });
  } catch (err) {
    if (err instanceof SensitiveActionError) {
      return { ok: false as const, error: err.message };
    }
    throw err;
  }

  const result = await createAdminRefund({
    orderId: input.orderId,
    reason: input.reason,
    amountMinor: input.amountMinor,
    kind: input.kind ?? "storno",
  });

  if (!result.ok) return result;

  await writeMonetizationAuditLog({
    action: "payment.refund.admin",
    entity: "Order",
    entityId: input.orderId,
    actorId: actor.userId,
    meta: {
      kind: input.kind ?? "storno",
      reason: input.reason.slice(0, 200),
      amountMinor: input.amountMinor ?? null,
      stepUp: "reason_confirm",
    },
  });

  revalidatePath("/admin/objednavky");
  revalidatePath("/admin/monetizace");
  revalidatePath("/admin");
  return { ok: true as const };
}

export async function listAdminOrdersAction() {
  const actor = await requireCommerceActor();
  if (!actor.ok) {
    return { ok: false as const, error: "unauthorized" as const, orders: [] };
  }
  if (!roleHasPermission(actor.role, "payments.read")) {
    return { ok: false as const, error: "unauthorized" as const, orders: [] };
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 40,
    select: {
      id: true,
      status: true,
      productKey: true,
      priceVersionKey: true,
      amountGrossMinor: true,
      amountVatMinor: true,
      currency: true,
      userId: true,
      createdAt: true,
      paidAt: true,
      refundedAt: true,
      user: { select: { email: true } },
    },
  });

  return { ok: true as const, orders };
}
