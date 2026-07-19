/**
 * Property alert / notification foundation (Prompt 8 Part 4).
 * Data layer only — no email jobs or workers yet.
 */

import type { NotificationChannel, PropertyAlertType, Prisma, PrismaClient } from "@prisma/client";

export type AlertEventInput = {
  userId: string;
  savedSearchId?: string | null;
  propertyId?: string | null;
  alertType: PropertyAlertType;
  payload?: Record<string, unknown>;
};

/** Record an undelivered alert event for a future worker to pick up. */
export async function enqueuePropertyAlertEvent(
  db: PrismaClient,
  input: AlertEventInput,
) {
  return db.propertyAlertEvent.create({
    data: {
      userId: input.userId,
      savedSearchId: input.savedSearchId ?? null,
      propertyId: input.propertyId ?? null,
      alertType: input.alertType,
      payload: (input.payload ?? {}) as Prisma.InputJsonValue,
    },
  });
}

/**
 * Ensure subscription rows exist for a saved search when alerts are enabled.
 * INSTANT/WEEKLY → PRICE_DROP + NEW_PROPERTY (+ SAVED_SEARCH_MATCH) IN_APP.
 */
export async function syncAlertSubscriptionsForSavedSearch(
  db: PrismaClient,
  input: {
    userId: string;
    savedSearchId: string;
    alertFrequency: "OFF" | "INSTANT" | "WEEKLY";
    channel?: NotificationChannel;
  },
) {
  const channel = input.channel ?? "IN_APP";
  const types: PropertyAlertType[] = [
    "PRICE_DROP",
    "NEW_PROPERTY",
    "SAVED_SEARCH_MATCH",
  ];

  if (input.alertFrequency === "OFF") {
    await db.propertyAlertSubscription.updateMany({
      where: { userId: input.userId, savedSearchId: input.savedSearchId },
      data: { enabled: false },
    });
    return;
  }

  for (const alertType of types) {
    await db.propertyAlertSubscription.upsert({
      where: {
        userId_savedSearchId_alertType_channel: {
          userId: input.userId,
          savedSearchId: input.savedSearchId,
          alertType,
          channel,
        },
      },
      create: {
        userId: input.userId,
        savedSearchId: input.savedSearchId,
        alertType,
        channel,
        enabled: true,
        meta: { frequency: input.alertFrequency } as Prisma.InputJsonValue,
      },
      update: {
        enabled: true,
        meta: { frequency: input.alertFrequency } as Prisma.InputJsonValue,
      },
    });
  }
}

/** Pending events for a future delivery worker. */
export async function listUndeliveredAlertEvents(
  db: PrismaClient,
  limit = 100,
) {
  return db.propertyAlertEvent.findMany({
    where: { deliveredAt: null },
    orderBy: { createdAt: "asc" },
    take: Math.min(500, Math.max(1, limit)),
  });
}
