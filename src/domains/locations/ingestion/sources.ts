/**
 * Canonical LocationDataSource registry — categories + usage policy.
 */

import type { DataSourceDefinition } from "@/domains/locations/ingestion/types";

export const LOCATION_DATA_SOURCE_REGISTRY: DataSourceDefinition[] = [
  {
    key: "cz_official_stats",
    name: "ČSÚ / oficiální statistiky",
    category: "OFFICIAL_PUBLIC",
    urlOrReference: "https://www.czso.cz",
    license: "Open data / CC-compatible public",
    updateFrequency: "QUARTERLY",
    reliability: 0.92,
    allowedUsage: { display: true, commercial: true, derivative: true },
  },
  {
    key: "cz_flood_dtm",
    name: "DTM / DIBAVOD záplavové vrstvy",
    category: "OFFICIAL_PUBLIC",
    urlOrReference: "https://www.dibavod.cz",
    license: "Official public use",
    updateFrequency: "YEARLY",
    reliability: 0.9,
    allowedUsage: { display: true, commercial: true, derivative: true },
  },
  {
    key: "licensed_transaction_feed",
    name: "Licencovaný feed transakcí",
    category: "LICENSED",
    urlOrReference: "internal:licensed_tx",
    license: "Restricted commercial licence",
    updateFrequency: "MONTHLY",
    reliability: 0.88,
    allowedUsage: { display: true, commercial: true, derivative: false },
  },
  {
    key: "partner_listings_feed",
    name: "Partnerský feed inzerátů",
    category: "PARTNER",
    urlOrReference: "internal:partner_listings",
    license: "Partner agreement",
    updateFrequency: "DAILY",
    reliability: 0.75,
    allowedUsage: { display: true, commercial: true, derivative: true },
  },
  {
    key: "majetio_internal_aggregation",
    name: "Interní agregace Majetio",
    category: "INTERNAL_DERIVED",
    urlOrReference: "internal:location-metrics",
    license: "Majetio proprietary derived",
    updateFrequency: "DAILY",
    reliability: 0.8,
    allowedUsage: { display: true, commercial: true, derivative: true },
  },
  {
    key: "user_generated_signals",
    name: "Uživatelské signály (anonymizované)",
    category: "USER_GENERATED",
    urlOrReference: "internal:ugs",
    license: "User ToS — anonymized aggregates only",
    updateFrequency: "WEEKLY",
    reliability: 0.45,
    allowedUsage: { display: false, commercial: false, derivative: true },
  },
];

export function getDataSourceDefinition(
  key: string,
): DataSourceDefinition | null {
  return LOCATION_DATA_SOURCE_REGISTRY.find((s) => s.key === key) ?? null;
}

export function sourceQualityFromReliability(
  reliability: number,
): "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN" {
  if (reliability >= 0.85) return "HIGH";
  if (reliability >= 0.65) return "MEDIUM";
  if (reliability > 0) return "LOW";
  return "UNKNOWN";
}
