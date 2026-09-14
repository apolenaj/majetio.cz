/**
 * Route saved-search match alerts by frequency (BOD 72).
 * INSTANT → immediate; DAILY/WEEKLY → digest queue; OFF → no-op.
 */

import type { SavedSearchAlertFrequency } from "@prisma/client";

import { notifySavedSearchMatch } from "./saved-search-alerts";
import { enqueueDigestItem } from "./digest";
import { emitAlertTelemetry } from "../observability/telemetry";

export async function routeSavedSearchMatchAlert(input: {
  userId: string;
  savedSearchId: string;
  searchName: string;
  alertFrequency: SavedSearchAlertFrequency;
  propertyId: string;
  propertySlug: string;
  propertyTitle: string;
  propertyCity?: string | null;
  eventKind: "NEW_PROPERTY" | "PRICE_DROP" | "RELISTED";
}): Promise<{ notified: boolean }> {
  if (input.alertFrequency === "OFF") {
    emitAlertTelemetry({
      type: "alert_duplicate_suppressed",
      alertType: "SAVED_SEARCH_MATCH",
      reason: "frequency_off",
    });
    return { notified: false };
  }

  if (input.alertFrequency === "INSTANT") {
    const result = await notifySavedSearchMatch({
      userId: input.userId,
      savedSearchId: input.savedSearchId,
      searchName: input.searchName,
      propertyId: input.propertyId,
      propertySlug: input.propertySlug,
      propertyTitle: input.propertyTitle,
      preferEmail: true,
    });
    return { notified: result.ok };
  }

  // DAILY / WEEKLY → digest bucket (e-mail later; in-app batched)
  await enqueueDigestItem({
    userId: input.userId,
    savedSearchId: input.savedSearchId,
    searchName: input.searchName,
    frequency: input.alertFrequency,
    propertyId: input.propertyId,
    propertySlug: input.propertySlug,
    propertyTitle: input.propertyTitle,
    propertyCity: input.propertyCity ?? null,
    eventKind: input.eventKind,
  });

  // Lightweight in-app batch (no immediate e-mail)
  await notifySavedSearchMatch({
    userId: input.userId,
    savedSearchId: input.savedSearchId,
    searchName: input.searchName,
    propertyId: input.propertyId,
    propertySlug: input.propertySlug,
    propertyTitle: input.propertyTitle,
    preferEmail: false,
  });

  return { notified: true };
}
