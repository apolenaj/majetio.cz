"use server";

import { auth } from "@/lib/auth";
import {
  mortgageLeadService,
} from "@/domains/leads";
import type {
  MortgageLeadDetailDto,
  MortgageLeadListItemDto,
} from "@/domains/leads/schemas/mortgage-lead";

export async function loadMortgageLeadsPage(): Promise<
  | { ok: true; data: { leads: MortgageLeadListItemDto[] } }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Přihlášení je povinné." };
  }

  const leads = await mortgageLeadService.listMortgageLeadsForUser({
    userId: session.user.id,
    limit: 30,
  });

  return { ok: true, data: { leads } };
}

export async function loadMortgageLeadDetail(
  correlationId: string,
): Promise<
  | { ok: true; data: MortgageLeadDetailDto }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Přihlášení je povinné." };
  }

  const result = await mortgageLeadService.getMortgageLeadDetailForUser({
    userId: session.user.id,
    correlationId,
  });

  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, data: result.data };
}
