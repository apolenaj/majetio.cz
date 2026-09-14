import type {
  LocationMetricCategory,
  LocationMetricPriceKind,
  LocationMetricSourceType,
  PropertyCondition,
  PropertyType,
} from "@prisma/client";

import type { LocationMetricKey } from "@/domains/locations/metrics/registry";
import type { LocationMetricSegment } from "@/domains/locations/metrics/segment";

export type RawPriceObservation = {
  pricePerSqm: number;
  propertyType: PropertyType;
  condition: PropertyCondition;
  layout?: string | null;
};

export type RawRentObservation = {
  rentPerSqm: number;
  propertyType: PropertyType;
  condition: PropertyCondition;
  layout?: string | null;
};

export type MetricAggregationContext = {
  locationId: string;
  period: string;
  source: string;
  sourceType: LocationMetricSourceType;
  calculatedAt: Date;
  validFrom: Date;
  validTo?: Date | null;
};

export type AggregatedMetricRecord = {
  locationId: string;
  metricKey: LocationMetricKey | string;
  category: LocationMetricCategory;
  value: number;
  unit: string;
  period: string;
  source: string;
  sourceType: LocationMetricSourceType;
  priceKind: LocationMetricPriceKind;
  segmentKey: string;
  segment: LocationMetricSegment;
  sampleCount: number;
  meanValue: number | null;
  lowerQuartile: number | null;
  upperQuartile: number | null;
  confidence: number;
  methodologyVersion: string;
  calculatedAt: Date;
  validFrom: Date;
  validTo: Date | null;
  /** When false, value exists for audit but must not be shown in UI. */
  display: boolean;
  suppressReason: string | null;
};

export type MetricHistoryPoint = {
  locationId: string;
  locationMetricId?: string | null;
  metricKey: string;
  category: LocationMetricCategory;
  priceKind: LocationMetricPriceKind;
  segmentKey: string;
  period: string;
  value: number;
  unit: string;
  sampleCount: number;
  meanValue: number | null;
  lowerQuartile: number | null;
  upperQuartile: number | null;
  confidence: number;
  methodologyVersion: string;
  calculatedAt: Date;
  validFrom: Date;
  validTo: Date | null;
};

export type SegmentBucket<T> = {
  segmentKey: string;
  segment: LocationMetricSegment;
  observations: T[];
};
