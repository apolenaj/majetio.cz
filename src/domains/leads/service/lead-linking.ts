/**
 * Secure mortgage lead linking after verified authentication (Prompt 13/10).
 *
 * Leads are attached ONLY after credential verification (login/register).
 * Never link based on email query parameters or unauthenticated requests.
 */

import { LeadType } from "@prisma/client";

import { prisma } from "@/lib/db";
import { sanitizeMortgageLeadAuditMeta, toAuditJson } from "@/domains/leads/service/privacy-guards";
import { writeAuditLog } from "@/lib/auth/audit";

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export type LinkMortgageLeadsResult = {
  linkedCount: number;
  correlationIds: string[];
};

/**
 * Attach unclaimed FINANCING leads to a verified user account.
 * Matching rule: normalized email equality + userId IS NULL + valid consent.
 */
export async function linkUnclaimedMortgageLeadsOnAuth(input: {
  userId: string;
  verifiedEmail: string;
  authMethod: "login" | "register";
}): Promise<LinkMortgageLeadsResult> {
  const email = normalizeEmail(input.verifiedEmail);

  const candidates = await prisma.lead.findMany({
    where: {
      type: LeadType.FINANCING,
      userId: null,
      email: { equals: email, mode: "insensitive" },
      piiRedactedAt: null,
    },
    select: { id: true, correlationId: true, consentId: true, payload: true },
    take: 20,
  });

  const eligible = candidates.filter((lead) => {
    if (lead.consentId) return true;
    const payload =
      lead.payload && typeof lead.payload === "object" && !Array.isArray(lead.payload)
        ? (lead.payload as Record<string, unknown>)
        : null;
    return Boolean(payload?.consentReceipt);
  });

  if (eligible.length === 0) {
    return { linkedCount: 0, correlationIds: [] };
  }

  const ids = eligible.map((c) => c.id);
  const correlationIds = eligible.map((c) => c.correlationId);

  await prisma.$transaction(async (tx) => {
    await tx.lead.updateMany({
      where: { id: { in: ids } },
      data: { userId: input.userId },
    });
    await tx.mortgageLeadCrm.updateMany({
      where: { leadId: { in: ids }, ownerUserId: null },
      data: { ownerUserId: input.userId },
    });
    for (const leadId of ids) {
      await tx.leadActivity.create({
        data: {
          leadId,
          type: "mortgage_lead.linked_on_auth",
          note: "Lead připojen k účtu po ověření identity.",
          meta: sanitizeMortgageLeadAuditMeta({
            retentionAction: input.authMethod,
          }),
        },
      });
    }
  });

  await writeAuditLog({
    action: "mortgage_lead.linked_on_auth",
    entity: "User",
    entityId: input.userId,
    actorId: input.userId,
    meta: toAuditJson(
      sanitizeMortgageLeadAuditMeta({
        linkedCount: ids.length,
        authMethod: input.authMethod,
      }),
    ),
  });

  return { linkedCount: ids.length, correlationIds };
}
