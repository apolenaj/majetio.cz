/**
 * CRM lead ownership + internal expected value (142–145, 185).
 * expectedValue is an internal forecast — not realized commerce revenue.
 */

import { prisma } from "@/lib/db";
import { assertCanViewLead, type CrmActor } from "./access";
import { sanitizeCrmPlainText } from "./sanitize-notes";

export async function setLeadOwner(input: {
  leadId: string;
  actor: CrmActor;
  ownerUserId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await assertCanViewLead(input.actor, input.leadId);
  if (!access.ok) return access;

  await prisma.$transaction(async (tx) => {
    await tx.lead.update({
      where: { id: input.leadId },
      data: { ownerUserId: input.ownerUserId },
    });

    const existing = await tx.leadAssignment.findFirst({
      where: {
        leadId: input.leadId,
        userId: input.ownerUserId,
        role: "OWNER",
      },
    });
    if (existing) {
      await tx.leadAssignment.update({
        where: { id: existing.id },
        data: { active: true },
      });
    } else {
      await tx.leadAssignment.create({
        data: {
          leadId: input.leadId,
          userId: input.ownerUserId,
          organizationId: access.lead.organizationId,
          role: "OWNER",
          active: true,
          assignedByUserId: input.actor.userId,
        },
      });
    }

    await tx.leadActivity.create({
      data: {
        leadId: input.leadId,
        type: "OWNER_SET",
        note: "Nastaven owner pipeline",
        actorUserId: input.actor.userId,
        visibility: "INTERNAL",
        meta: { ownerUserId: input.ownerUserId },
      },
    });
  });

  return { ok: true };
}

/**
 * Internal forecast only — never write realized commerce revenue rows.
 */
export async function setLeadExpectedValue(input: {
  leadId: string;
  actor: CrmActor;
  expectedValueMinor: number | null;
  currency?: string;
  note?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await assertCanViewLead(input.actor, input.leadId);
  if (!access.ok) return access;

  if (
    input.expectedValueMinor != null &&
    (input.expectedValueMinor < 0 || !Number.isFinite(input.expectedValueMinor))
  ) {
    return { ok: false, error: "Neplatná očekávaná hodnota." };
  }

  const note = input.note ? sanitizeCrmPlainText(input.note, 500) : null;

  await prisma.lead.update({
    where: { id: input.leadId },
    data: {
      expectedValueMinor: input.expectedValueMinor,
      expectedValueCurrency: input.currency ?? "CZK",
      expectedValueNote: note,
    },
  });

  await prisma.leadActivity.create({
    data: {
      leadId: input.leadId,
      type: "EXPECTED_VALUE",
      note: note ?? "Aktualizace expected value (interní, ≠ realized revenue)",
      actorUserId: input.actor.userId,
      visibility: "INTERNAL",
      meta: {
        expectedValueMinor: input.expectedValueMinor,
        currency: input.currency ?? "CZK",
        isRealizedRevenue: false,
      },
    },
  });

  return { ok: true };
}

/** Strip expected value from buyer-facing DTOs. */
export function toPublicLeadDto<T extends Record<string, unknown>>(
  lead: T,
): Omit<
  T,
  "expectedValueMinor" | "expectedValueCurrency" | "expectedValueNote"
> {
  const clone = { ...lead } as T & {
    expectedValueMinor?: unknown;
    expectedValueCurrency?: unknown;
    expectedValueNote?: unknown;
  };
  delete clone.expectedValueMinor;
  delete clone.expectedValueCurrency;
  delete clone.expectedValueNote;
  return clone;
}
