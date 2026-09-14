/**
 * Ingestion hooks: write price/status history, then emit domain events.
 * Alert generation is event-driven (BOD 138) — never cartesian matching here.
 */

import type { PriceChangeType, PropertyStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import {
  emitPropertyDomainEvent,
  emitPropertyCreatedIfActive,
} from "../events/property-events";

export async function recordPropertyPriceObservation(input: {
  propertyId: string;
  amount: number;
  changeType: PriceChangeType;
  observedAt?: Date;
  sourceId?: string | null;
  note?: string | null;
  /** When true, skip alert generation (e.g. backfill). */
  skipAlerts?: boolean;
}) {
  const observedAt = input.observedAt ?? new Date();
  const row = await prisma.propertyPriceHistory.create({
    data: {
      propertyId: input.propertyId,
      amount: input.amount,
      priceCzk: input.amount,
      changeType: input.changeType,
      observedAt,
      sourceId: input.sourceId ?? null,
      note: input.note ?? null,
    },
  });

  if (!input.skipAlerts) {
    await emitPropertyDomainEvent({
      type: "PropertyPriceChanged",
      propertyId: input.propertyId,
      amount: input.amount,
      changeType: input.changeType,
      observedAt,
    });
  }

  return { history: row };
}

export async function recordPropertyStatusChange(input: {
  propertyId: string;
  previousStatus: PropertyStatus | null;
  newStatus: PropertyStatus;
  changedAt?: Date;
  sourceId?: string | null;
  reason?: string | null;
  note?: string | null;
  /**
   * True when change is driven only by freshness / source silence
   * (STALE → UNAVAILABLE). Never generates alerts.
   */
  freshnessOnly?: boolean;
  skipAlerts?: boolean;
}) {
  const changedAt = input.changedAt ?? new Date();

  const [history] = await prisma.$transaction([
    prisma.propertyStatusHistory.create({
      data: {
        propertyId: input.propertyId,
        previousStatus: input.previousStatus,
        newStatus: input.newStatus,
        status: input.newStatus,
        changedAt,
        sourceId: input.sourceId ?? null,
        reason: input.reason ?? null,
        note: input.note ?? null,
      },
    }),
    prisma.property.update({
      where: { id: input.propertyId },
      data: { status: input.newStatus },
    }),
  ]);

  if (!input.skipAlerts) {
    await emitPropertyDomainEvent({
      type: "PropertyStatusChanged",
      propertyId: input.propertyId,
      previousStatus: input.previousStatus,
      newStatus: input.newStatus,
      changedAt,
      freshnessOnly: input.freshnessOnly,
    });
  }

  return { history };
}

/**
 * After a listing becomes publicly ACTIVE — emit PropertyCreated for reverse match.
 */
export async function recordPropertyPublished(propertyId: string): Promise<void> {
  await emitPropertyCreatedIfActive(propertyId);
}
