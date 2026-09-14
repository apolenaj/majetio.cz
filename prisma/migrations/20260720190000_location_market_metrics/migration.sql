-- Location market metrics — registry fields, segmentation, history series

CREATE TYPE "LocationMetricSourceType" AS ENUM (
  'OFFICIAL',
  'LICENSED_API',
  'PARTNER_FEED',
  'INTERNAL_AGGREGATION',
  'ESTIMATE',
  'OTHER'
);

CREATE TYPE "LocationMetricPriceKind" AS ENUM (
  'ASKING',
  'TRANSACTION',
  'NONE'
);

CREATE TYPE "LocationMetricCategory" AS ENUM (
  'PROPERTY_MARKET',
  'RENTAL_MARKET',
  'INVESTMENT',
  'INFRASTRUCTURE',
  'DEVELOPMENT'
);

-- Evolve existing LocationMetric (legacy `type` → metricKey)
ALTER TABLE "LocationMetric" RENAME COLUMN "type" TO "metricKey";

ALTER TABLE "LocationMetric" ADD COLUMN "category" "LocationMetricCategory" NOT NULL DEFAULT 'PROPERTY_MARKET';
ALTER TABLE "LocationMetric" ADD COLUMN "sourceType" "LocationMetricSourceType" NOT NULL DEFAULT 'INTERNAL_AGGREGATION';
ALTER TABLE "LocationMetric" ADD COLUMN "priceKind" "LocationMetricPriceKind" NOT NULL DEFAULT 'NONE';
ALTER TABLE "LocationMetric" ADD COLUMN "segmentKey" TEXT NOT NULL DEFAULT '_all';
ALTER TABLE "LocationMetric" ADD COLUMN "segment" JSONB;
ALTER TABLE "LocationMetric" ADD COLUMN "sampleCount" INTEGER;
ALTER TABLE "LocationMetric" ADD COLUMN "meanValue" DOUBLE PRECISION;
ALTER TABLE "LocationMetric" ADD COLUMN "lowerQuartile" DOUBLE PRECISION;
ALTER TABLE "LocationMetric" ADD COLUMN "upperQuartile" DOUBLE PRECISION;
ALTER TABLE "LocationMetric" ADD COLUMN "confidence" DOUBLE PRECISION;
ALTER TABLE "LocationMetric" ADD COLUMN "methodologyVersion" TEXT NOT NULL DEFAULT 'location-metrics.v2026.07';
ALTER TABLE "LocationMetric" ADD COLUMN "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "LocationMetric" ADD COLUMN "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "LocationMetric" ADD COLUMN "validTo" TIMESTAMP(3);

UPDATE "LocationMetric" SET "period" = 'legacy' WHERE "period" IS NULL;
ALTER TABLE "LocationMetric" ALTER COLUMN "period" SET NOT NULL;

DROP INDEX IF EXISTS "LocationMetric_locationId_type_idx";
CREATE UNIQUE INDEX "LocationMetric_locationId_metricKey_period_segmentKey_priceKind_validFrom_key"
  ON "LocationMetric"("locationId", "metricKey", "period", "segmentKey", "priceKind", "validFrom");
CREATE INDEX "LocationMetric_locationId_category_metricKey_idx" ON "LocationMetric"("locationId", "category", "metricKey");
CREATE INDEX "LocationMetric_locationId_period_idx" ON "LocationMetric"("locationId", "period");
CREATE INDEX "LocationMetric_metricKey_period_idx" ON "LocationMetric"("metricKey", "period");
CREATE INDEX "LocationMetric_validFrom_validTo_idx" ON "LocationMetric"("validFrom", "validTo");

CREATE TABLE "LocationMetricHistory" (
  "id" TEXT NOT NULL,
  "locationId" TEXT NOT NULL,
  "locationMetricId" TEXT,
  "metricKey" TEXT NOT NULL,
  "category" "LocationMetricCategory" NOT NULL,
  "priceKind" "LocationMetricPriceKind" NOT NULL DEFAULT 'NONE',
  "segmentKey" TEXT NOT NULL DEFAULT '_all',
  "period" TEXT NOT NULL,
  "value" DOUBLE PRECISION NOT NULL,
  "unit" TEXT,
  "sampleCount" INTEGER,
  "meanValue" DOUBLE PRECISION,
  "lowerQuartile" DOUBLE PRECISION,
  "upperQuartile" DOUBLE PRECISION,
  "confidence" DOUBLE PRECISION,
  "methodologyVersion" TEXT NOT NULL,
  "calculatedAt" TIMESTAMP(3) NOT NULL,
  "validFrom" TIMESTAMP(3) NOT NULL,
  "validTo" TIMESTAMP(3),

  CONSTRAINT "LocationMetricHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LocationMetricHistory_locationId_metricKey_segmentKey_priceKind_calculatedAt_idx"
  ON "LocationMetricHistory"("locationId", "metricKey", "segmentKey", "priceKind", "calculatedAt");
CREATE INDEX "LocationMetricHistory_locationId_period_idx" ON "LocationMetricHistory"("locationId", "period");
CREATE INDEX "LocationMetricHistory_metricKey_calculatedAt_idx" ON "LocationMetricHistory"("metricKey", "calculatedAt");

ALTER TABLE "LocationMetricHistory" ADD CONSTRAINT "LocationMetricHistory_locationId_fkey"
  FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LocationMetricHistory" ADD CONSTRAINT "LocationMetricHistory_locationMetricId_fkey"
  FOREIGN KEY ("locationMetricId") REFERENCES "LocationMetric"("id") ON DELETE SET NULL ON UPDATE CASCADE;
