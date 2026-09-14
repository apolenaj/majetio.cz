/**
 * Saved-search match batching — e.g. "3 nové nabídky odpovídají hledání".
 * One visible digest PropertyAlert per user/search/day (IN_APP).
 */

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { buildSavedSearchBatchCopy } from "./alert-copy";
import {
  savedSearchBatchKey,
  savedSearchMatchDedupeKey,
} from "./alert-dedupe";
import { deliverPropertyAlert } from "./deliver-alert";

function readPropertyIds(meta: unknown): string[] {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return [];
  const ids = (meta as { propertyIds?: unknown }).propertyIds;
  return Array.isArray(ids) ? ids.filter((x): x is string => typeof x === "string") : [];
}

export async function notifySavedSearchMatch(input: {
  userId: string;
  savedSearchId: string;
  searchName: string;
  propertyId: string;
  propertySlug: string;
  propertyTitle: string;
  /** When false, IN_APP only (digest e-mail is queued separately). Default true. */
  preferEmail?: boolean;
}): Promise<{ ok: boolean; batched: boolean; count: number }> {
  const day = new Date().toISOString().slice(0, 10);
  const batchKey = savedSearchBatchKey({
    savedSearchId: input.savedSearchId,
    day,
  });
  const digestDedupe = `${batchKey}:digest`;
  const propertyMarker = `${savedSearchMatchDedupeKey({
    savedSearchId: input.savedSearchId,
    propertyId: input.propertyId,
    day,
  })}:IN_APP`;

  const marker = await prisma.propertyAlert.findUnique({
    where: {
      userId_dedupeKey: { userId: input.userId, dedupeKey: propertyMarker },
    },
    select: { id: true },
  });
  if (marker) {
    return { ok: true, batched: true, count: 0 };
  }

  const existingDigest = await prisma.propertyAlert.findUnique({
    where: {
      userId_dedupeKey: {
        userId: input.userId,
        dedupeKey: `${digestDedupe}:IN_APP`,
      },
    },
  });

  if (existingDigest) {
    const propertyIds = [
      ...readPropertyIds(existingDigest.meta),
      input.propertyId,
    ];
    const uniqueIds = [...new Set(propertyIds)];
    const count = uniqueIds.length;
    const copy = buildSavedSearchBatchCopy({
      searchName: input.searchName,
      count,
    });

    await prisma.$transaction([
      prisma.propertyAlert.update({
        where: { id: existingDigest.id },
        data: {
          title: copy.title,
          body: copy.body,
          href: "/ucet/ulozena-hledani",
          propertyId: null,
          meta: {
            category: "transactional",
            savedSearchId: input.savedSearchId,
            batchCount: count,
            propertyIds: uniqueIds,
          } as Prisma.InputJsonValue,
        },
      }),
      prisma.propertyAlert.create({
        data: {
          userId: input.userId,
          propertyId: input.propertyId,
          type: "SAVED_SEARCH_MATCH",
          channel: "IN_APP",
          status: "SUPPRESSED",
          title: "match-marker",
          dedupeKey: propertyMarker,
          batchKey,
          meta: {
            digestAlertId: existingDigest.id,
            reason: "property_match_marker",
          } as Prisma.InputJsonValue,
        },
      }),
    ]);

    return { ok: true, batched: true, count };
  }

  // First match of the day — create digest (+ optional email)
  const result = await deliverPropertyAlert({
    userId: input.userId,
    propertyId: input.propertyId,
    type: "SAVED_SEARCH_MATCH",
    title: `Nová nabídka: ${input.propertyTitle}`,
    body: `Nabídka odpovídá uloženému hledání „${input.searchName}“.`,
    href: `/nemovitosti/${input.propertySlug}`,
    dedupeKey: digestDedupe,
    batchKey,
    preferEmail: input.preferEmail !== false,
    meta: {
      savedSearchId: input.savedSearchId,
      batchCount: 1,
      propertyIds: [input.propertyId],
      eventKind: "NEW_PROPERTY",
    },
  });

  if (result.ok && result.status !== "SUPPRESSED" && result.status !== "DEDUPED") {
    await prisma.propertyAlert.create({
      data: {
        userId: input.userId,
        propertyId: input.propertyId,
        type: "SAVED_SEARCH_MATCH",
        channel: "IN_APP",
        status: "SUPPRESSED",
        title: "match-marker",
        dedupeKey: propertyMarker,
        batchKey,
        meta: {
          digestAlertId: result.alertId,
          reason: "property_match_marker",
        } as Prisma.InputJsonValue,
      },
    }).catch(() => undefined);
  }

  return {
    ok: result.ok,
    batched: false,
    count: 1,
  };
}
