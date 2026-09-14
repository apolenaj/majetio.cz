/**
 * Map Prisma / domain records → Public / Internal DTOs.
 */

import type { Location, LocationMetric, LocationType } from "@prisma/client";
import { LOCATION_TYPE_LABELS_CS } from "@/domains/locations/types/hierarchy";
import type {
  InternalLocationMetricDto,
  PublicLocationDto,
  PublicMetricPointDto,
} from "@/domains/locations/dto";
import { getMetricDefinition } from "@/domains/locations/metrics/registry";
import { segmentLabelFromKey } from "@/domains/locations/service/location-page-service";

type LocationLike = Pick<
  Location,
  | "id"
  | "slug"
  | "name"
  | "publicLabel"
  | "type"
  | "countryCode"
  | "centroidLat"
  | "centroidLon"
  | "latitude"
  | "longitude"
>;

function mapPrecision(type: LocationType): PublicLocationDto["mapPrecision"] {
  if (type === "CITY" || type === "MUNICIPALITY") return "CITY";
  if (type === "CITY_DISTRICT" || type === "DISTRICT") return "DISTRICT";
  if (type === "NEIGHBORHOOD" || type === "MICRO_LOCATION") return "APPROXIMATE";
  return "NONE";
}

export function toPublicLocationDto(location: LocationLike): PublicLocationDto {
  const lat = location.centroidLat ?? location.latitude;
  const lon = location.centroidLon ?? location.longitude;
  // Round centroid to ~100m — never expose exact private coordinates publicly
  const centroid =
    lat != null && lon != null
      ? {
          latitude: Math.round(lat * 1000) / 1000,
          longitude: Math.round(lon * 1000) / 1000,
        }
      : null;

  return {
    kind: "public",
    id: location.id,
    slug: location.slug,
    name: location.name,
    publicLabel: location.publicLabel ?? location.name,
    type: location.type,
    hierarchyLabel: LOCATION_TYPE_LABELS_CS[location.type] ?? null,
    countryCode: location.countryCode,
    centroid,
    mapPrecision: mapPrecision(location.type),
  };
}

export function toPublicMetricPointDto(
  metric: LocationMetric,
  options?: { fallbackMessage?: string | null },
): PublicMetricPointDto {
  const def = getMetricDefinition(metric.metricKey);
  return {
    metricKey: metric.metricKey,
    label: def?.labelCs ?? metric.metricKey,
    value: metric.value,
    unit: metric.unit,
    period: metric.period,
    sampleCount: metric.sampleCount,
    confidence: metric.confidence,
    freshness: metric.freshness,
    priceKind: metric.priceKind,
    segmentKey: metric.segmentKey,
    methodologyVersion: metric.methodologyVersion,
    fallbackMessage:
      options?.fallbackMessage ??
      (metric.fallbackFromLocationId
        ? "Data vycházejí z širší oblasti."
        : null),
  };
}

export function toInternalLocationMetricDto(
  metric: LocationMetric,
  diagnostics?: InternalLocationMetricDto["diagnostics"],
): InternalLocationMetricDto {
  return {
    kind: "internal",
    id: metric.id,
    locationId: metric.locationId,
    metricKey: metric.metricKey,
    category: metric.category,
    value: metric.value,
    unit: metric.unit,
    period: metric.period,
    source: metric.source,
    sourceType: metric.sourceType,
    sourceQuality: metric.sourceQuality,
    dataSourceId: metric.dataSourceId,
    priceKind: metric.priceKind,
    segmentKey: metric.segmentKey,
    segment: metric.segment,
    sampleCount: metric.sampleCount,
    meanValue: metric.meanValue,
    lowerQuartile: metric.lowerQuartile,
    upperQuartile: metric.upperQuartile,
    confidence: metric.confidence,
    freshness: metric.freshness,
    reviewRequired: metric.reviewRequired,
    fallbackFromLocationId: metric.fallbackFromLocationId,
    methodologyVersion: metric.methodologyVersion,
    calculatedAt: metric.calculatedAt.toISOString(),
    validFrom: metric.validFrom.toISOString(),
    validTo: metric.validTo?.toISOString() ?? null,
    publishedAt: metric.publishedAt?.toISOString() ?? null,
    diagnostics,
  };
}

export { segmentLabelFromKey };
