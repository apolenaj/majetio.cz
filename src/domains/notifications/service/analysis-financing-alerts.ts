/**
 * Analysis / financing alert helpers (callable from those domains).
 */

import { prisma } from "@/lib/db";
import {
  analysisAlertDedupeKey,
  financingAlertDedupeKey,
} from "./alert-dedupe";
import { deliverPropertyAlert } from "./deliver-alert";

export async function notifyNewAnalysisAvailable(input: {
  userId: string;
  propertyId: string;
  analysisId: string;
  propertySlug: string;
  propertyTitle: string;
}) {
  return deliverPropertyAlert({
    userId: input.userId,
    propertyId: input.propertyId,
    type: "NEW_ANALYSIS_AVAILABLE",
    title: `Nová analýza: ${input.propertyTitle}`,
    body: "Pro uloženou nemovitost je připravena aktualizovaná investiční analýza.",
    href: `/analyza/${input.analysisId}`,
    dedupeKey: analysisAlertDedupeKey({
      propertyId: input.propertyId,
      analysisId: input.analysisId,
    }),
    preferEmail: true,
    meta: { analysisId: input.analysisId },
  });
}

export async function notifyFinancingChanged(input: {
  userId: string;
  propertyId: string;
  propertySlug: string;
  propertyTitle: string;
  eventToken: string;
  summary: string;
}) {
  return deliverPropertyAlert({
    userId: input.userId,
    propertyId: input.propertyId,
    type: "FINANCING_CHANGED",
    title: `Financování: ${input.propertyTitle}`,
    body: input.summary,
    href: `/nemovitosti/${input.propertySlug}`,
    dedupeKey: financingAlertDedupeKey({
      propertyId: input.propertyId,
      eventToken: input.eventToken,
    }),
    preferEmail: true,
  });
}

/** Notify all non-rejected favourite owners that a new analysis exists. */
export async function notifyFavouritesNewAnalysis(input: {
  propertyId: string;
  analysisId: string;
  propertySlug: string;
  propertyTitle: string;
}) {
  const favourites = await prisma.favourite.findMany({
    where: {
      propertyId: input.propertyId,
      status: { not: "REJECTED" },
    },
    select: { userId: true },
  });

  let notified = 0;
  for (const fav of favourites) {
    const result = await notifyNewAnalysisAvailable({
      userId: fav.userId,
      ...input,
    });
    if (result.ok && (result.status === "SENT" || result.status === "PENDING")) {
      notified += 1;
    }
  }
  return { notified };
}
