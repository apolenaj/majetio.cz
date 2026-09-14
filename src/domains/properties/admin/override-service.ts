/**
 * Persist manual field override + optional apply onto Property row.
 */

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import {
  OVERRIDEABLE_FIELD_KEYS,
  type OverrideableFieldKey,
} from "@/domains/properties/admin/override-resolve";
import { writeAuditLog } from "@/lib/auth/audit";

export async function upsertPropertyFieldOverride(input: {
  propertyId: string;
  fieldKey: string;
  value: string;
  reason: string;
  actorUserId: string;
  expiresAt?: Date | null;
  applyToCanonical?: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (
    !(OVERRIDEABLE_FIELD_KEYS as readonly string[]).includes(input.fieldKey)
  ) {
    return { ok: false, error: `Field ${input.fieldKey} cannot be overridden.` };
  }
  if (input.reason.trim().length < 8) {
    return { ok: false, error: "Reason is required (min. 8 characters)." };
  }

  const fieldKey = input.fieldKey as OverrideableFieldKey;

  await prisma.propertyFieldOverride.upsert({
    where: {
      propertyId_fieldKey: {
        propertyId: input.propertyId,
        fieldKey,
      },
    },
    create: {
      propertyId: input.propertyId,
      fieldKey,
      value: input.value,
      locked: true,
      reason: input.reason.trim(),
      manualTag: true,
      expiresAt: input.expiresAt ?? null,
      createdById: input.actorUserId,
      updatedById: input.actorUserId,
    } as Prisma.PropertyFieldOverrideUncheckedCreateInput,
    update: {
      value: input.value,
      locked: true,
      reason: input.reason.trim(),
      manualTag: true,
      expiresAt: input.expiresAt ?? null,
      updatedById: input.actorUserId,
    } as Prisma.PropertyFieldOverrideUncheckedUpdateInput,
  });

  if (input.applyToCanonical !== false) {
    const data: Record<string, unknown> = {};
    if (fieldKey === "askingPrice") {
      const n = Number(input.value);
      if (!Number.isFinite(n)) {
        return { ok: false, error: "askingPrice must be a number." };
      }
      data.askingPrice = n;
    } else if (fieldKey === "usableArea") {
      const n = Number(input.value);
      if (!Number.isFinite(n)) {
        return { ok: false, error: "usableArea must be a number." };
      }
      data.usableArea = n;
    } else {
      data[fieldKey] = input.value;
    }
    await prisma.property.update({
      where: { id: input.propertyId },
      data: data as Prisma.PropertyUpdateInput,
    });
  }

  await writeAuditLog({
    action: "admin.property.override",
    entity: "Property",
    entityId: input.propertyId,
    actorId: input.actorUserId,
    meta: {
      fieldKey,
      reason: input.reason.trim().slice(0, 300),
      expiresAt: input.expiresAt?.toISOString() ?? null,
      manualTag: true,
    },
  });

  return { ok: true };
}
