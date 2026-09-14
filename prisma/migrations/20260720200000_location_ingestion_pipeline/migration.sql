-- Location Intelligence: data sources, ingestion, metric quality, market snapshots
-- Extends DataQualityIssue for location-scoped QA (no parallel issue system)

CREATE TYPE "LocationDataSourceCategory" AS ENUM (
  'OFFICIAL_PUBLIC',
  'LICENSED',
  'PARTNER',
  'INTERNAL_DERIVED',
  'USER_GENERATED'
);

CREATE TYPE "LocationDataUpdateFrequency" AS ENUM (
  'REALTIME',
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'YEARLY',
  'AD_HOC'
);

CREATE TYPE "LocationMetricFreshness" AS ENUM (
  'FRESH',
  'STALE',
  'UNKNOWN'
);

CREATE TYPE "LocationSourceQuality" AS ENUM (
  'HIGH',
  'MEDIUM',
  'LOW',
  'UNKNOWN'
);

CREATE TYPE "LocationIngestionJobStatus" AS ENUM (
  'PENDING',
  'FETCHING',
  'VALIDATING',
  'NORMALIZING',
  'AGGREGATING',
  'QUALITY_CHECK',
  'STORING',
  'PUBLISHED',
  'FAILED',
  'REVIEW_REQUIRED'
);

CREATE TABLE "LocationDataSource" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "category" "LocationDataSourceCategory" NOT NULL,
  "urlOrReference" TEXT,
  "license" TEXT,
  "updateFrequency" "LocationDataUpdateFrequency" NOT NULL DEFAULT 'MONTHLY',
  "lastUpdated" TIMESTAMP(3),
  "reliability" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
  "allowedUsage" JSONB,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LocationDataSource_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LocationDataSource_key_key" ON "LocationDataSource"("key");
CREATE INDEX "LocationDataSource_category_active_idx" ON "LocationDataSource"("category", "active");

CREATE TABLE "LocationIngestionJob" (
  "id" TEXT NOT NULL,
  "dataSourceId" TEXT NOT NULL,
  "status" "LocationIngestionJobStatus" NOT NULL DEFAULT 'PENDING',
  "period" TEXT,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "recordsFetched" INTEGER NOT NULL DEFAULT 0,
  "recordsStored" INTEGER NOT NULL DEFAULT 0,
  "errorMessage" TEXT,
  "stageLog" JSONB,
  "methodologyVersion" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LocationIngestionJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LocationIngestionJob_dataSourceId_status_idx" ON "LocationIngestionJob"("dataSourceId", "status");
CREATE INDEX "LocationIngestionJob_createdAt_idx" ON "LocationIngestionJob"("createdAt");

ALTER TABLE "LocationIngestionJob" ADD CONSTRAINT "LocationIngestionJob_dataSourceId_fkey"
  FOREIGN KEY ("dataSourceId") REFERENCES "LocationDataSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Extend LocationMetric quality / fallback / source linkage
ALTER TABLE "LocationMetric" ADD COLUMN "sourceQuality" "LocationSourceQuality" NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE "LocationMetric" ADD COLUMN "freshness" "LocationMetricFreshness" NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE "LocationMetric" ADD COLUMN "reviewRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "LocationMetric" ADD COLUMN "fallbackFromLocationId" TEXT;
ALTER TABLE "LocationMetric" ADD COLUMN "dataSourceId" TEXT;
ALTER TABLE "LocationMetric" ADD COLUMN "publishedAt" TIMESTAMP(3);

CREATE INDEX "LocationMetric_freshness_reviewRequired_idx" ON "LocationMetric"("freshness", "reviewRequired");
CREATE INDEX "LocationMetric_dataSourceId_idx" ON "LocationMetric"("dataSourceId");

ALTER TABLE "LocationMetric" ADD CONSTRAINT "LocationMetric_fallbackFromLocationId_fkey"
  FOREIGN KEY ("fallbackFromLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LocationMetric" ADD CONSTRAINT "LocationMetric_dataSourceId_fkey"
  FOREIGN KEY ("dataSourceId") REFERENCES "LocationDataSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "LocationMarketSnapshot" (
  "id" TEXT NOT NULL,
  "locationId" TEXT NOT NULL,
  "period" TEXT NOT NULL,
  "selectedMetrics" JSONB NOT NULL,
  "methodologyVersions" JSONB NOT NULL,
  "segmentKey" TEXT NOT NULL DEFAULT '_all',
  "usedFallback" BOOLEAN NOT NULL DEFAULT false,
  "fallbackNotes" TEXT,
  "calculatedAt" TIMESTAMP(3) NOT NULL,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "LocationMarketSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LocationMarketSnapshot_locationId_period_segmentKey_calculatedAt_key"
  ON "LocationMarketSnapshot"("locationId", "period", "segmentKey", "calculatedAt");
CREATE INDEX "LocationMarketSnapshot_locationId_period_idx" ON "LocationMarketSnapshot"("locationId", "period");
CREATE INDEX "LocationMarketSnapshot_calculatedAt_idx" ON "LocationMarketSnapshot"("calculatedAt");

ALTER TABLE "LocationMarketSnapshot" ADD CONSTRAINT "LocationMarketSnapshot_locationId_fkey"
  FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Reuse DataQualityIssue for location-scoped problems
ALTER TABLE "DataQualityIssue" ALTER COLUMN "propertyId" DROP NOT NULL;
ALTER TABLE "DataQualityIssue" ADD COLUMN "locationId" TEXT;
CREATE INDEX "DataQualityIssue_locationId_status_idx" ON "DataQualityIssue"("locationId", "status");
ALTER TABLE "DataQualityIssue" ADD CONSTRAINT "DataQualityIssue_locationId_fkey"
  FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
