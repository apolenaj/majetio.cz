/**
 * Shared mutation rate limits for workspace actions (save, compare, notes, share).
 * Uses AuthRateLimit table — same sliding window as favourites.
 */

import { prisma } from "@/lib/db";

const WINDOW_MS = 60_000;

const LIMITS = {
  favourite: 40,
  comparison: 30,
  note: 40,
  share: 15,
} as const;

export type WorkspaceRateDomain = keyof typeof LIMITS;

export type WorkspaceRateLimitResult =
  | { ok: true }
  | { ok: false; error: string; retryAfterSec: number };

function keyFor(domain: WorkspaceRateDomain, userId: string, action: string): string {
  return `ws:${domain}:${action}:${userId}`.toLowerCase();
}

/**
 * Consume one mutation slot. Returns retryAfter when over cap.
 */
export async function assertWorkspaceMutationAllowed(
  userId: string,
  domain: WorkspaceRateDomain,
  action: string,
): Promise<WorkspaceRateLimitResult> {
  const max = LIMITS[domain];
  const key = keyFor(domain, userId, action);
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
  if (next > max) {
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
