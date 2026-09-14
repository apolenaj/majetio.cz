/**
 * Explicit negative signal for recommendations (BOD 85, 86, 88, 89).
 * REJECTED favourites must not reappear in recommended sort immediately.
 */

import { prisma } from "@/lib/db";

/** Property IDs the user explicitly rejected — exclude from recommendations. */
export async function listRejectedPropertyIdsForUser(
  userId: string,
): Promise<Set<string>> {
  const rows = await prisma.favourite.findMany({
    where: { userId, status: "REJECTED" },
    select: { propertyId: true },
  });
  return new Set(rows.map((r) => r.propertyId));
}

/**
 * Filter listings so rejected favourites are dropped (or scored to bottom).
 */
export function excludeRejectedFromRecommendations<T extends { id: string }>(
  listings: T[],
  rejectedIds: Set<string> | ReadonlySet<string>,
): T[] {
  if (rejectedIds.size === 0) return listings;
  return listings.filter((item) => !rejectedIds.has(item.id));
}

/**
 * Pure helper for match / sort pipelines.
 */
export function isExcludedFromRecommendations(
  propertyId: string,
  rejectedIds: Set<string> | ReadonlySet<string>,
): boolean {
  return rejectedIds.has(propertyId);
}
