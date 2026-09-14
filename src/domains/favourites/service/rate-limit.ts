/**
 * Mutation rate limits for favourites / notes (BOD 133).
 * Reuses AuthRateLimit table with sliding failure-style counters
 * adapted for successful-mutation throttling.
 */

import { prisma } from "@/lib/db";

const WINDOW_MS = 60_000;
/** Max favourite mutations (save/status/note/meta) per user per minute. */
const MAX_MUTATIONS_PER_WINDOW = 40;

export type FavouriteRateLimitResult =
  | { ok: true }
  | { ok: false; error: string; retryAfterSec: number };

function keyFor(userId: string, action: string): string {
  return `favourite:${action}:${userId}`.toLowerCase();
}

/**
 * Consume one mutation slot. Returns retryAfter when over cap.
 */
export async function assertFavouriteMutationAllowed(
  userId: string,
  action: "save" | "note" | "status" | "meta" | "remove" = "save",
): Promise<FavouriteRateLimitResult> {
  const key = keyFor(userId, action);
  const now = new Date();
  const row = await prisma.authRateLimit.findUnique({ where: { key } });

  if (row?.lockedUntil && row.lockedUntil > now) {
    return {
      ok: false,
      error: "Příliš mnoho úprav najednou. Zkuste to za chvíli.",
      retryAfterSec: Math.ceil((row.lockedUntil.getTime() - now.getTime()) / 1000),
    };
  }

  if (!row || now.getTime() - row.windowStart.getTime() > WINDOW_MS) {
    await prisma.authRateLimit.upsert({
      where: { key },
      create: { key, failCount: 1, windowStart: now, lockedUntil: null },
      update: { failCount: 1, windowStart: now, lockedUntil: null },
    });
    return { ok: true };
  }

  const next = row.failCount + 1;
  if (next > MAX_MUTATIONS_PER_WINDOW) {
    const lockedUntil = new Date(now.getTime() + WINDOW_MS);
    await prisma.authRateLimit.update({
      where: { key },
      data: { failCount: next, lockedUntil },
    });
    return {
      ok: false,
      error: "Příliš mnoho úprav najednou. Zkuste to za chvíli.",
      retryAfterSec: Math.ceil(WINDOW_MS / 1000),
    };
  }

  await prisma.authRateLimit.update({
    where: { key },
    data: { failCount: next },
  });
  return { ok: true };
}
