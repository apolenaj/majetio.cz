/**
 * Sync SavedSearchMatch rows against the live catalog.
 * New results = matches with notifiedAt IS NULL (never fake counts).
 */

import type { Prisma } from "@prisma/client";

import { parseSavedSearchFilters } from "@/domains/saved-searches/service/filters-version";
import { urlStateToSearchInput } from "@/domains/properties/search/url-state";
import {
  buildSearchWhere,
  normalizeSearchFilters,
} from "@/domains/properties/service/search/filters";
import { propertySearchInputSchema } from "@/domains/properties/schemas/search";
import { prisma } from "@/lib/db";
import { routeSavedSearchMatchAlert } from "@/domains/notifications/service/frequency-router";

const MAX_MATCH_SYNC = 100;

export type SavedSearchCardStats = {
  matchCount: number;
  newMatchCount: number;
  lastCheckedAt: string | null;
};

export async function countNewSavedSearchMatches(
  savedSearchId: string,
): Promise<number> {
  return prisma.savedSearchMatch.count({
    where: { savedSearchId, notifiedAt: null },
  });
}

export async function getSavedSearchCardStats(
  savedSearchId: string,
): Promise<SavedSearchCardStats> {
  const [search, matchCount, newMatchCount] = await Promise.all([
    prisma.savedSearch.findUnique({
      where: { id: savedSearchId },
      select: { lastCheckedAt: true },
    }),
    prisma.savedSearchMatch.count({ where: { savedSearchId } }),
    countNewSavedSearchMatches(savedSearchId),
  ]);
  return {
    matchCount,
    newMatchCount,
    lastCheckedAt: search?.lastCheckedAt?.toISOString() ?? null,
  };
}

/**
 * Recompute matches for one saved search.
 * @param baseline If true (first sync), mark all current matches as already seen.
 */
export async function syncSavedSearchMatches(input: {
  savedSearchId: string;
  baseline?: boolean;
  notify?: boolean;
}): Promise<{
  ok: true;
  matched: number;
  newCount: number;
} | { ok: false; error: string }> {
  const search = await prisma.savedSearch.findUnique({
    where: { id: input.savedSearchId },
    select: {
      id: true,
      userId: true,
      name: true,
      filters: true,
      lastCheckedAt: true,
      alertFrequency: true,
    },
  });
  if (!search) return { ok: false, error: "Hledání nenalezeno." };

  const parsedFilters = parseSavedSearchFilters(search.filters);
  const rawInput = urlStateToSearchInput(parsedFilters.state);
  const schemaParsed = propertySearchInputSchema.safeParse(rawInput);
  if (!schemaParsed.success) {
    return { ok: false, error: "Neplatné filtry uloženého hledání." };
  }

  const normalized = normalizeSearchFilters(schemaParsed.data);
  if (!normalized.ok) {
    return { ok: false, error: normalized.errors[0] ?? "Filtry nelze použít." };
  }

  const where = buildSearchWhere(normalized.filters) as Prisma.PropertyWhereInput;
  const hits = await prisma.property.findMany({
    where,
    select: { id: true, slug: true, title: true, publishedAt: true },
    orderBy: { publishedAt: "desc" },
    take: MAX_MATCH_SYNC,
  });

  const now = new Date();
  const isBaseline = input.baseline === true || search.lastCheckedAt == null;
  const hitIds = new Set(hits.map((h) => h.id));

  const existing = await prisma.savedSearchMatch.findMany({
    where: { savedSearchId: search.id },
    select: { id: true, propertyId: true, notifiedAt: true },
  });
  const existingByProperty = new Map(
    existing.map((e) => [e.propertyId, e] as const),
  );

  const createdNew: Array<{
    propertyId: string;
    slug: string;
    title: string;
  }> = [];

  for (const hit of hits) {
    const prev = existingByProperty.get(hit.id);
    if (prev) {
      await prisma.savedSearchMatch.update({
        where: { id: prev.id },
        data: {
          lastMatchedAt: now,
          ...(isBaseline && prev.notifiedAt == null
            ? { notifiedAt: now }
            : {}),
        },
      });
    } else {
      await prisma.savedSearchMatch.create({
        data: {
          savedSearchId: search.id,
          propertyId: hit.id,
          firstMatchedAt: now,
          lastMatchedAt: now,
          notifiedAt: isBaseline ? now : null,
        },
      });
      if (!isBaseline) {
        createdNew.push({
          propertyId: hit.id,
          slug: hit.slug,
          title: hit.title,
        });
      }
    }
  }

  // Drop stale matches that no longer fit filters
  const staleIds = existing
    .filter((e) => !hitIds.has(e.propertyId))
    .map((e) => e.id);
  if (staleIds.length) {
    await prisma.savedSearchMatch.deleteMany({
      where: { id: { in: staleIds } },
    });
  }

  await prisma.savedSearch.update({
    where: { id: search.id },
    data: { lastCheckedAt: now },
  });

  if (
    input.notify &&
    !isBaseline &&
    search.alertFrequency !== "OFF" &&
    createdNew.length > 0
  ) {
    for (const prop of createdNew) {
      await routeSavedSearchMatchAlert({
        userId: search.userId,
        savedSearchId: search.id,
        searchName: search.name,
        alertFrequency: search.alertFrequency,
        propertyId: prop.propertyId,
        propertySlug: prop.slug,
        propertyTitle: prop.title,
        eventKind: "NEW_PROPERTY",
      });
    }
    await prisma.savedSearchMatch.updateMany({
      where: {
        savedSearchId: search.id,
        propertyId: { in: createdNew.map((p) => p.propertyId) },
        notifiedAt: null,
      },
      data: { notifiedAt: now },
    });
    await prisma.savedSearch.update({
      where: { id: search.id },
      data: { lastAlertedAt: now },
    });
  }

  const newCount = await countNewSavedSearchMatches(search.id);
  return { ok: true, matched: hits.length, newCount };
}

/** Mark outstanding new matches as seen (user opened the search). */
export async function acknowledgeSavedSearchMatches(
  savedSearchId: string,
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const search = await prisma.savedSearch.findFirst({
    where: { id: savedSearchId, userId },
    select: { id: true },
  });
  if (!search) return { ok: false, error: "Hledání nenalezeno." };

  await prisma.savedSearchMatch.updateMany({
    where: { savedSearchId, notifiedAt: null },
    data: { notifiedAt: new Date() },
  });
  return { ok: true };
}

export async function syncAllSavedSearchesForUser(
  userId: string,
): Promise<void> {
  const searches = await prisma.savedSearch.findMany({
    where: { userId },
    select: { id: true, lastCheckedAt: true },
    take: 20,
  });
  for (const s of searches) {
    await syncSavedSearchMatches({
      savedSearchId: s.id,
      baseline: s.lastCheckedAt == null,
      notify: false,
    });
  }
}
