/**
 * Event-driven property alert bus (BOD 138).
 * PropertyPriceChanged / PropertyCreated / PropertyStatusChanged → watchers → alerts.
 */

import type { PriceChangeType, PropertyStatus } from "@prisma/client";

import { propertyAlertConfig } from "@/config/property-alerts";
import { processFavouritePriceChange } from "../service/price-alerts";
import { processFavouriteStatusChange } from "../service/status-alerts";
import { batchMatchChangedProperties } from "@/domains/saved-searches/service/reverse-match";
import { emitAlertTelemetry } from "../observability/telemetry";
import { prisma } from "@/lib/db";

export type PropertyDomainEvent =
  | {
      type: "PropertyPriceChanged";
      propertyId: string;
      amount: number;
      changeType: PriceChangeType | string;
      observedAt: Date;
    }
  | {
      type: "PropertyCreated";
      propertyId: string;
    }
  | {
      type: "PropertyStatusChanged";
      propertyId: string;
      previousStatus: PropertyStatus | string | null;
      newStatus: PropertyStatus | string;
      changedAt: Date;
      freshnessOnly?: boolean;
    }
  /** @deprecated Prefer PropertyStatusChanged — kept for callers mid-migration. */
  | {
      type: "PropertyRelisted";
      propertyId: string;
      previousStatus: PropertyStatus | string | null;
      newStatus: PropertyStatus | string;
      changedAt: Date;
      freshnessOnly?: boolean;
    };

/**
 * Dispatch a domain event to favourite watchers + saved-search reverse match.
 */
export async function emitPropertyDomainEvent(
  event: PropertyDomainEvent,
): Promise<void> {
  switch (event.type) {
    case "PropertyPriceChanged": {
      const ignore = propertyAlertConfig.price.ignoreChangeTypes as readonly string[];
      if (ignore.includes(String(event.changeType))) {
        emitAlertTelemetry({
          type: "alert_duplicate_suppressed",
          alertType: "PRICE_DECREASE",
          reason: "corrected_price",
        });
        return;
      }

      await processFavouritePriceChange({
        propertyId: event.propertyId,
        amount: event.amount,
        changeType: event.changeType,
        observedAt: event.observedAt,
      });

      // Price drop → reverse-match saved searches (batch of one)
      if (
        event.changeType === "DECREASED" ||
        (typeof event.changeType === "string" &&
          event.changeType.toUpperCase() === "DECREASED")
      ) {
        await batchMatchChangedProperties({
          propertyIds: [event.propertyId],
          eventKind: "PRICE_DROP",
          notify: true,
        });
      }
      return;
    }

    case "PropertyCreated": {
      await batchMatchChangedProperties({
        propertyIds: [event.propertyId],
        eventKind: "NEW_PROPERTY",
        notify: true,
      });
      return;
    }

    case "PropertyStatusChanged":
    case "PropertyRelisted": {
      await processFavouriteStatusChange({
        propertyId: event.propertyId,
        previousStatus: event.previousStatus,
        newStatus: event.newStatus,
        changedAt: event.changedAt,
        freshnessOnly: event.freshnessOnly,
      });

      if (event.newStatus === "ACTIVE" && !event.freshnessOnly) {
        await batchMatchChangedProperties({
          propertyIds: [event.propertyId],
          eventKind: "RELISTED",
          notify: true,
        });
      }
      return;
    }

    default:
      return;
  }
}

/**
 * Convenience for ingestion: load property and emit PropertyCreated.
 */
export async function emitPropertyCreatedIfActive(
  propertyId: string,
): Promise<void> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, status: true, visibility: true },
  });
  if (!property) return;
  if (property.status !== "ACTIVE" || property.visibility !== "PUBLIC") return;
  await emitPropertyDomainEvent({ type: "PropertyCreated", propertyId });
}
