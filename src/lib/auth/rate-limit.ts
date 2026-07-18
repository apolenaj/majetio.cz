import { prisma } from "@/lib/db";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 8;
const LOCK_MS = 15 * 60 * 1000;

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

function normalizeKey(parts: string[]): string {
  return parts.map((p) => p.trim().toLowerCase()).filter(Boolean).join(":");
}

export async function assertNotRateLimited(parts: string[]): Promise<RateLimitResult> {
  const key = normalizeKey(parts);
  const now = new Date();
  const row = await prisma.authRateLimit.findUnique({ where: { key } });

  if (row?.lockedUntil && row.lockedUntil > now) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((row.lockedUntil.getTime() - now.getTime()) / 1000),
    };
  }

  if (row && now.getTime() - row.windowStart.getTime() > WINDOW_MS) {
    await prisma.authRateLimit.update({
      where: { key },
      data: { failCount: 0, windowStart: now, lockedUntil: null },
    });
  }

  return { ok: true };
}

export async function recordAuthFailure(parts: string[]): Promise<void> {
  const key = normalizeKey(parts);
  const now = new Date();
  const row = await prisma.authRateLimit.findUnique({ where: { key } });

  if (!row || now.getTime() - row.windowStart.getTime() > WINDOW_MS) {
    await prisma.authRateLimit.upsert({
      where: { key },
      create: { key, failCount: 1, windowStart: now },
      update: { failCount: 1, windowStart: now, lockedUntil: null },
    });
    return;
  }

  const failCount = row.failCount + 1;
  const lockedUntil =
    failCount >= MAX_FAILURES ? new Date(now.getTime() + LOCK_MS) : row.lockedUntil;

  await prisma.authRateLimit.update({
    where: { key },
    data: { failCount, lockedUntil },
  });
}

export async function clearAuthFailures(parts: string[]): Promise<void> {
  const key = normalizeKey(parts);
  await prisma.authRateLimit.deleteMany({ where: { key } });
}
