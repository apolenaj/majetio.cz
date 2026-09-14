"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import {
  acceptQualifiedBuyerLead,
  recordQualifiedBuyerFirstResponse,
} from "@/domains/crm";

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function acceptQualifiedBuyerLeadAction(input: {
  leadId: string;
}) {
  const userId = await requireUserId();
  if (!userId) return { ok: false as const, error: "Přihlášení je povinné." };

  const result = await acceptQualifiedBuyerLead({
    leadId: input.leadId,
    agentUserId: userId,
  });
  if (!result.ok) return result;
  revalidatePath("/profi/leady");
  revalidatePath("/profi");
  return { ok: true as const };
}

export async function recordQualifiedBuyerFirstResponseAction(input: {
  leadId: string;
}) {
  const userId = await requireUserId();
  if (!userId) return { ok: false as const, error: "Přihlášení je povinné." };

  const result = await recordQualifiedBuyerFirstResponse({
    leadId: input.leadId,
    actorUserId: userId,
  });
  if (!result.ok) return result;
  revalidatePath("/profi/leady");
  revalidatePath("/profi");
  return { ok: true as const, responseTimeMs: result.responseTimeMs };
}
