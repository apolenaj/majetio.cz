/**
 * Deduplicate observations to canonical keys before aggregation.
 */

import type { RawObservationRecord } from "@/domains/locations/ingestion/types";
import { encodeSegmentKey, inferMarketAge, normalizeLayout } from "@/domains/locations/metrics/segment";
import type { PropertyCondition } from "@prisma/client";

export function buildCanonicalKey(record: RawObservationRecord): string {
  if (record.canonicalKey) return record.canonicalKey;
  return [
    record.locationId,
    record.externalId,
    record.isTransaction ? "tx" : "ask",
    record.propertyType ?? "ALL",
    normalizeLayout(record.layout ?? "ALL"),
  ].join(":");
}

export function deduplicateObservations(
  records: RawObservationRecord[],
): RawObservationRecord[] {
  const byKey = new Map<string, RawObservationRecord>();

  for (const record of records) {
    const key = buildCanonicalKey(record);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, { ...record, canonicalKey: key });
      continue;
    }
    // Prefer newer observation
    if (new Date(record.observedAt) >= new Date(existing.observedAt)) {
      byKey.set(key, { ...record, canonicalKey: key });
    }
  }

  return [...byKey.values()];
}

export function resolveSegmentKey(record: RawObservationRecord): string {
  if (record.segmentKey) return record.segmentKey;
  const condition = (record.condition ?? "UNKNOWN") as PropertyCondition;
  return encodeSegmentKey({
    propertyType: (record.propertyType as "APARTMENT") ?? "ALL",
    marketAge: inferMarketAge(condition),
    layout: normalizeLayout(record.layout ?? "ALL"),
  });
}
