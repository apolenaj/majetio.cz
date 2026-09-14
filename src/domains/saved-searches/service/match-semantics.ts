/**
 * SavedSearchMatch semantics — "new" definition (BOD 70).
 * New = firstMatchedAt is after the previous lastCheckedAt.
 * Yesterday's already-matched listing is not "new" on today's check.
 */

import { prisma } from "@/lib/db";

export function isNewMatchAfterLastCheck(input: {
  firstMatchedAt: Date;
  lastCheckedAt: Date | null;
  /** True when this upsert created the row just now. */
  createdNow: boolean;
}): boolean {
  if (!input.createdNow) return false;
  if (input.lastCheckedAt == null) {
    // First-ever check for this search should baseline, not notify —
    // callers pass createdNow=false for baseline.
    return false;
  }
  return input.firstMatchedAt.getTime() > input.lastCheckedAt.getTime();
}

/**
 * Upsert match row. Returns whether this is a net-new match after last check.
 */
export async function upsertSavedSearchMatch(input: {
  savedSearchId: string;
  propertyId: string;
  lastCheckedAt: Date | null;
}): Promise<{ isNew: boolean; matchId: string }> {
  const now = new Date();
  const existing = await prisma.savedSearchMatch.findUnique({
    where: {
      savedSearchId_propertyId: {
        savedSearchId: input.savedSearchId,
        propertyId: input.propertyId,
      },
    },
    select: { id: true, firstMatchedAt: true, notifiedAt: true },
  });

  if (existing) {
    await prisma.savedSearchMatch.update({
      where: { id: existing.id },
      data: { lastMatchedAt: now },
    });
    return { isNew: false, matchId: existing.id };
  }

  // Baseline (never checked): mark notified immediately so historical stock isn't "new"
  const baseline = input.lastCheckedAt == null;
  const created = await prisma.savedSearchMatch.create({
    data: {
      savedSearchId: input.savedSearchId,
      propertyId: input.propertyId,
      firstMatchedAt: now,
      lastMatchedAt: now,
      notifiedAt: baseline ? now : null,
    },
    select: { id: true, firstMatchedAt: true },
  });

  const isNew = isNewMatchAfterLastCheck({
    firstMatchedAt: created.firstMatchedAt,
    lastCheckedAt: input.lastCheckedAt,
    createdNow: !baseline,
  });

  return { isNew, matchId: created.id };
}

/** Mark matches as seen when user opens / checks a saved search. */
export async function markSavedSearchChecked(input: {
  savedSearchId: string;
  userId: string;
}): Promise<void> {
  const search = await prisma.savedSearch.findFirst({
    where: { id: input.savedSearchId, userId: input.userId },
    select: { id: true },
  });
  if (!search) return;

  const now = new Date();
  await prisma.$transaction([
    prisma.savedSearch.update({
      where: { id: search.id },
      data: { lastCheckedAt: now },
    }),
    prisma.savedSearchMatch.updateMany({
      where: { savedSearchId: search.id, notifiedAt: null },
      data: { notifiedAt: now },
    }),
  ]);
}
