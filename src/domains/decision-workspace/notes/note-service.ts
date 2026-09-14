/**
 * Owner-only PropertyUserNote persistence.
 * Never log content to analytics; never include in SEO/public DTOs.
 */

import { prisma } from "@/lib/db";
import { sanitizeNoteTags } from "./tags";
import { sanitizePropertyNoteContent } from "./sanitize-note-content";

export type PropertyUserNoteDto = {
  id: string;
  propertyId: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

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

export async function getNoteForUser(input: {
  userId: string;
  propertyIdOrSlug: string;
}): Promise<PropertyUserNoteDto | null> {
  const propertyId = await resolvePropertyId(input.propertyIdOrSlug);
  if (!propertyId) return null;

  const row = await prisma.propertyUserNote.findUnique({
    where: {
      userId_propertyId: { userId: input.userId, propertyId },
    },
  });
  if (!row) return null;
  return {
    id: row.id,
    propertyId: row.propertyId,
    content: row.content,
    tags: row.tags,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Batch notes for comparison preview — owner filter only. */
export async function listNotesForProperties(input: {
  userId: string;
  propertyIds: string[];
}): Promise<Map<string, PropertyUserNoteDto>> {
  if (input.propertyIds.length === 0) return new Map();
  const rows = await prisma.propertyUserNote.findMany({
    where: {
      userId: input.userId,
      propertyId: { in: input.propertyIds.slice(0, 20) },
    },
  });
  const map = new Map<string, PropertyUserNoteDto>();
  for (const row of rows) {
    map.set(row.propertyId, {
      id: row.id,
      propertyId: row.propertyId,
      content: row.content,
      tags: row.tags,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  }
  return map;
}

export async function upsertNoteForUser(input: {
  userId: string;
  propertyIdOrSlug: string;
  content: string;
  tags?: string[];
}): Promise<
  | { ok: true; note: PropertyUserNoteDto }
  | { ok: false; error: string }
> {
  const propertyId = await resolvePropertyId(input.propertyIdOrSlug);
  if (!propertyId) {
    return {
      ok: false,
      error: "Nemovitost nenalezena v katalogu — poznámku nelze uložit.",
    };
  }

  const content = sanitizePropertyNoteContent(input.content);
  const tags = sanitizeNoteTags(input.tags ?? []);

  if (!content && tags.length === 0) {
    await prisma.propertyUserNote.deleteMany({
      where: { userId: input.userId, propertyId },
    });
    return {
      ok: false,
      error: "Prázdná poznámka byla odstraněna.",
    };
  }

  const row = await prisma.propertyUserNote.upsert({
    where: {
      userId_propertyId: { userId: input.userId, propertyId },
    },
    create: {
      userId: input.userId,
      propertyId,
      content: content || " ",
      tags,
    },
    update: {
      content: content || " ",
      tags,
    },
  });

  return {
    ok: true,
    note: {
      id: row.id,
      propertyId: row.propertyId,
      content: row.content,
      tags: row.tags,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    },
  };
}

export async function deleteNoteForUser(input: {
  userId: string;
  propertyIdOrSlug: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const propertyId = await resolvePropertyId(input.propertyIdOrSlug);
  if (!propertyId) return { ok: false, error: "Nemovitost nenalezena." };
  await prisma.propertyUserNote.deleteMany({
    where: { userId: input.userId, propertyId },
  });
  return { ok: true };
}
