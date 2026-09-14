/**
 * Public comparison module cache (BOD 146).
 * Personal financing / Finanční pas / match-against-passport MUST NOT enter this cache.
 */

import { createHash } from "node:crypto";

import { comparisonConfig } from "@/config/comparison";
import type { ComparisonPublicPropertyMetrics } from "./types";

type CacheEntry<T> = { value: T; expiresAt: number };

const store = new Map<string, CacheEntry<unknown>>();

const PERSONAL_KEYS = [
  "financing",
  "matchScore",
  "availableEquity",
  "passport",
  "income",
  "ltvPersonal",
] as const;

export function assertPublicMetricsOnly(
  metrics: ComparisonPublicPropertyMetrics,
): void {
  const json = JSON.stringify(metrics);
  for (const key of PERSONAL_KEYS) {
    if (json.includes(`"${key}"`)) {
      throw new Error(
        `Public comparison cache must not contain personal field: ${key}`,
      );
    }
  }
}

export function buildPublicMetricsCacheKey(input: {
  propertyId: string;
  updatedAt: string;
}): string {
  const raw = `cmp-public|${input.propertyId}|${input.updatedAt}`;
  const hash = createHash("sha256").update(raw).digest("hex").slice(0, 16);
  return `cmp:public:${hash}`;
}

export function getCachedPublicMetrics(
  key: string,
): ComparisonPublicPropertyMetrics | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value as ComparisonPublicPropertyMetrics;
}

export function setCachedPublicMetrics(
  key: string,
  value: ComparisonPublicPropertyMetrics,
  ttlMs = comparisonConfig.publicCacheTtlMs,
): void {
  assertPublicMetricsOnly(value);
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function clearComparisonPublicCache(): void {
  store.clear();
}

/** @deprecated Prefer clearComparisonPublicCache */
export function clearComparisonPublicCacheForTests(): void {
  clearComparisonPublicCache();
}
