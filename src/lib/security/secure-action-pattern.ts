"use server";

/**
 * Example secure Server Action pattern:
 * 1. Session auth (never trust client userId)
 * 2. Zod .strict() input (anti mass-assignment)
 * 3. Ownership check (IDOR → 404)
 * 4. Sanitize user text
 * 5. Return DTO only
 * 6. Structured log without PII / Financial Passport
 */

import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  OwnershipError,
  assertOwnedRecord,
  pickDto,
  strictObject,
} from "@/lib/security/validate";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { logger } from "@/lib/security/logger";
import { assertSlidingRateLimit } from "@/lib/security/rate-limit";
import { getRequestIp } from "@/lib/auth/audit";

const updateFavouriteNoteSchema = strictObject({
  favouriteId: z.string().cuid(),
  note: z.string().max(4_000),
});

export type FavouriteNoteDto = {
  id: string;
  note: string | null;
  updatedAt: string;
};

export async function updateFavouriteNoteSecureAction(
  input: unknown,
): Promise<
  | { ok: true; data: FavouriteNoteDto }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Přihlášení je povinné." };
  }
  const userId = session.user.id;

  const ip = await getRequestIp().catch(() => "unknown");
  const limited = await assertSlidingRateLimit({
    key: `fav-note:${userId}:${ip}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return { ok: false, error: "Příliš mnoho požadavků. Zkuste to později." };
  }

  const parsed = updateFavouriteNoteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Neplatný vstup." };
  }

  try {
    const favourite = await assertOwnedRecord({
      load: () =>
        prisma.favourite.findFirst({
          where: { id: parsed.data.favouriteId, userId },
          select: { id: true, note: true, updatedAt: true },
        }),
    });

    const note = sanitizePlainText(parsed.data.note, 4_000);

    const updated = await prisma.favourite.update({
      where: { id: favourite.id },
      data: { note: note.length ? note : null },
      select: { id: true, note: true, updatedAt: true },
    });

    logger.info("favourite_note_updated", {
      favouriteId: updated.id,
      userId,
      // never: note content, email, passport
    });

    return {
      ok: true,
      data: {
        ...pickDto(updated, ["id", "note"] as const),
        updatedAt: updated.updatedAt.toISOString(),
      },
    };
  } catch (err) {
    if (err instanceof OwnershipError) {
      return { ok: false, error: "Záznam nenalezen." };
    }
    logger.error("favourite_note_update_failed", {
      name: err instanceof Error ? err.name : "unknown",
      userId,
    });
    return { ok: false, error: "Uložení se nezdařilo." };
  }
}
