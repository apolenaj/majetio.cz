/**
 * Abuse / rate limiting — Upstash when configured, else Prisma AuthRateLimit / memory.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import {
  assertNotRateLimited as assertAuthWindow,
  recordAuthFailure,
  clearAuthFailures,
} from "@/lib/auth/rate-limit";

export {
  assertNotRateLimited as assertAuthRateLimit,
  recordAuthFailure,
  clearAuthFailures,
} from "@/lib/auth/rate-limit";

export type SlidingLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSec: number };

type Bucket = { count: number; resetAt: number };

const memoryBuckets = new Map<string, Bucket>();

function memoryLimit(
  key: string,
  limit: number,
  windowMs: number,
): SlidingLimitResult {
  const now = Date.now();
  const row = memoryBuckets.get(key);
  if (!row || row.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  if (row.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((row.resetAt - now) / 1000)),
    };
  }
  row.count += 1;
  return { ok: true, remaining: limit - row.count };
}

let upstashLimiter: Ratelimit | null | undefined;

function getUpstashLimiter(): Ratelimit | null {
  if (upstashLimiter !== undefined) return upstashLimiter;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    upstashLimiter = null;
    return null;
  }
  upstashLimiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    prefix: "majetio",
    analytics: false,
  });
  return upstashLimiter;
}

/**
 * Generic sliding-window limit (scraping / public API abuse).
 * Prefers Upstash; falls back to process memory (single-instance).
 */
export async function assertSlidingRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<SlidingLimitResult> {
  const upstash = getUpstashLimiter();
  if (upstash) {
    // Dynamic window via ephemeral limiter instance would be ideal;
    // use fixed 60/min for Upstash path and scale by prefix key.
    const result = await upstash.limit(
      `${input.key}:${input.limit}:${input.windowMs}`,
    );
    if (!result.success) {
      return {
        ok: false,
        retryAfterSec: Math.max(
          1,
          Math.ceil((result.reset - Date.now()) / 1000),
        ),
      };
    }
    return { ok: true, remaining: result.remaining };
  }
  return memoryLimit(input.key, input.limit, input.windowMs);
}

/** Login / reset brute-force — Prisma-backed (multi-instance safe). */
export async function assertLoginRateLimit(parts: string[]) {
  return assertAuthWindow(parts);
}

/** Public search / listing scrape protection. */
export async function assertPublicSearchRateLimit(ip: string) {
  return assertSlidingRateLimit({
    key: `search:${ip}`,
    limit: 60,
    windowMs: 60_000,
  });
}

/** Webhook IP velocity (after signature verification). */
export async function assertWebhookIpRateLimit(ip: string) {
  return assertSlidingRateLimit({
    key: `webhook:${ip}`,
    limit: 120,
    windowMs: 60_000,
  });
}
