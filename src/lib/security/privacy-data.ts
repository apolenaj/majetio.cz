/**
 * Soft-delete / anonymization helpers for critical privacy data.
 * Prefer tombstone + redact over hard delete where retention requires audit.
 */

import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/auth/audit";
import { sanitizePlainText } from "@/lib/security/sanitize";

/**
 * Soft-request account deletion: mark user, clear Financial Passport values,
 * keep audit trail. Does not hard-delete (that remains password-confirmed path).
 */
export async function softRequestAccountErasure(input: {
  userId: string;
  actorId: string;
  reason?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, deletionRequestedAt: true },
  });
  if (!user) return { ok: false, error: "User not found" };

  await prisma.$transaction([
    prisma.user.update({
      where: { id: input.userId },
      data: {
        deletionRequestedAt: user.deletionRequestedAt ?? new Date(),
        accountStatus: "DELETION_REQUESTED",
      },
    }),
    prisma.financialProfile.updateMany({
      where: { userId: input.userId },
      data: {
        monthlyIncomeCzk: null,
        monthlyLiabilitiesCzk: null,
        availableEquityCzk: null,
        equityPercent: null,
        financingMode: null,
        employmentType: null,
        creditScoreBand: null,
      },
    }),
    prisma.userMarketProfile.updateMany({
      where: { userId: input.userId },
      data: {
        maxBudgetMinor: null,
        availableEquityMinor: null,
        monthlyIncomeMinor: null,
        monthlyLiabilitiesMinor: null,
      },
    }),
  ]);

  await writeAuditLog({
    action: "privacy.soft_erasure.requested",
    entity: "User",
    entityId: input.userId,
    actorId: input.actorId,
    reason: input.reason?.slice(0, 300) ?? null,
    meta: { financialProfileCleared: true },
  });

  return { ok: true };
}

/** Sanitize free-text API fields (notes, titles, descriptions). */
export function sanitizeUserContentField(
  value: string | null | undefined,
  maxLength = 4_000,
): string | null {
  if (value == null) return null;
  const cleaned = sanitizePlainText(value, maxLength);
  return cleaned.length ? cleaned : null;
}
