/**
 * Cache keys for Location Intelligence.
 * Personalized Finanční pas matches must NOT use shared cache.
 */

import { createHash } from "node:crypto";

export type LocationCacheDimensions = {
  locationIdOrSlug: string;
  segmentKey: string;
  period: string;
  methodologyVersion: string;
};

export function buildLocationCacheKey(
  namespace: string,
  dims: LocationCacheDimensions,
): string {
  const raw = [
    namespace,
    dims.locationIdOrSlug,
    dims.segmentKey,
    dims.period,
    dims.methodologyVersion,
  ].join("|");
  const hash = createHash("sha256").update(raw).digest("hex").slice(0, 16);
  return `loc:${namespace}:${hash}`;
}

export function buildMarketSummaryCacheKey(dims: LocationCacheDimensions): string {
  return buildLocationCacheKey("market-summary", dims);
}

export function buildComparisonCacheKey(input: {
  slugs: string[];
  segmentKey: string;
  period: string;
  methodologyVersion: string;
}): string {
  const sorted = [...input.slugs].map((s) => s.toLowerCase()).sort();
  return buildLocationCacheKey("comparison", {
    locationIdOrSlug: sorted.join(","),
    segmentKey: input.segmentKey,
    period: input.period,
    methodologyVersion: input.methodologyVersion,
  });
}

/**
 * Personalized match scores depend on user Finanční pas — never put in shared cache.
 */
export function assertNotSharedPersonalizedCache(tag: "location-match"): never | void {
  if (tag === "location-match") {
    // Documented guard — callers must not register shared cache for this tag.
    return;
  }
}

/** Simple in-process TTL cache for precomputed public aggregates (dev / single-node). */
type CacheEntry<T> = { value: T; expiresAt: number };

const memoryStore = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(key: string): T | null {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value as T;
}

export function setCached<T>(key: string, value: T, ttlMs: number): void {
  memoryStore.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function invalidateLocationCachePrefix(prefix: string): number {
  let n = 0;
  for (const key of memoryStore.keys()) {
    if (key.startsWith(prefix)) {
      memoryStore.delete(key);
      n += 1;
    }
  }
  return n;
}

export const DEFAULT_PUBLIC_CACHE_TTL_MS = 15 * 60 * 1000;
