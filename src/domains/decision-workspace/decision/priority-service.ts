/**
 * Persist personal decision priority on Favourite (owner-scoped).
 */

import type { DecisionPriorityLevel } from "@prisma/client";

import { prisma } from "@/lib/db";
import {
  isPropertyDecisionPriority,
  type PropertyDecisionPriority,
} from "./property-priority";

async function resolvePropertyId(
  propertyIdOrSlug: string,
): Promise<string | null> {
  const row = await prisma.property.findFirst({
    where: {
      OR: [{ id: propertyIdOrSlug }, { slug: propertyIdOrSlug }],
    },
    select: { id: true },
  });
  return row?.id ?? null;
}

export async function getDecisionPriorityForUser(input: {
  userId: string;
  propertyIdOrSlug: string;
}): Promise<PropertyDecisionPriority | null> {
  const propertyId = await resolvePropertyId(input.propertyIdOrSlug);
  if (!propertyId) return null;
  const row = await prisma.favourite.findUnique({
    where: {
      userId_propertyId: { userId: input.userId, propertyId },
    },
    select: { decisionPriority: true },
  });
  const p = row?.decisionPriority;
  return isPropertyDecisionPriority(p) ? p : null;
}

export async function setDecisionPriorityForUser(input: {
  userId: string;
  propertyIdOrSlug: string;
  priority: PropertyDecisionPriority | null;
}): Promise<
  | { ok: true; priority: PropertyDecisionPriority | null }
  | { ok: false; error: string }
> {
  const propertyId = await resolvePropertyId(input.propertyIdOrSlug);
  if (!propertyId) {
    return { ok: false, error: "Nemovitost nenalezena v katalogu." };
  }

  if (
    input.priority != null &&
    !isPropertyDecisionPriority(input.priority)
  ) {
    return { ok: false, error: "Neplatná priorita." };
  }

  const priority = input.priority as DecisionPriorityLevel | null;

  const existing = await prisma.favourite.findUnique({
    where: {
      userId_propertyId: { userId: input.userId, propertyId },
    },
    select: { id: true, priceAtSave: true },
  });

  if (existing) {
    await prisma.favourite.update({
      where: { id: existing.id },
      data: { decisionPriority: priority },
    });
  } else {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { askingPrice: true, priceCzk: true },
    });
    await prisma.favourite.create({
      data: {
        userId: input.userId,
        propertyId,
        status: "CONSIDERING",
        decisionPriority: priority,
        priceAtSave: property?.askingPrice ?? property?.priceCzk ?? null,
      },
    });
  }

  return { ok: true, priority: input.priority };
}
