-- Prompt 7 Part 4 — Import jobs, source uniqueness, search indexes

CREATE TYPE "ImportJobStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'PARTIAL');
CREATE TYPE "ImportJobItemStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'SKIPPED', 'DUPLICATE');

-- Search / filter indexes on Property
CREATE INDEX IF NOT EXISTS "Property_pricePerSqm_idx" ON "Property"("pricePerSqm");
CREATE INDEX IF NOT EXISTS "Property_publicCity_publicDistrict_idx" ON "Property"("publicCity", "publicDistrict");
CREATE INDEX IF NOT EXISTS "Property_publicRegion_idx" ON "Property"("publicRegion");
CREATE INDEX IF NOT EXISTS "Property_latitude_longitude_idx" ON "Property"("latitude", "longitude");
CREATE INDEX IF NOT EXISTS "Property_status_askingPrice_idx" ON "Property"("status", "askingPrice");
CREATE INDEX IF NOT EXISTS "Property_status_publicCity_askingPrice_idx" ON "Property"("status", "publicCity", "askingPrice");
CREATE INDEX IF NOT EXISTS "Property_transactionType_status_askingPrice_idx" ON "Property"("transactionType", "status", "askingPrice");

-- Idempotent source identity (NULLs allowed multiple times in Postgres UNIQUE)
DROP INDEX IF EXISTS "PropertySource_provider_externalPropertyId_idx";
CREATE UNIQUE INDEX IF NOT EXISTS "PropertySource_provider_externalPropertyId_key"
  ON "PropertySource"("provider", "externalPropertyId");

CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "sourceType" "PropertySourceType" NOT NULL DEFAULT 'OTHER',
    "status" "ImportJobStatus" NOT NULL DEFAULT 'PENDING',
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "meta" JSONB,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ImportJob_idempotencyKey_key" ON "ImportJob"("idempotencyKey");
CREATE INDEX "ImportJob_provider_status_idx" ON "ImportJob"("provider", "status");
CREATE INDEX "ImportJob_createdAt_idx" ON "ImportJob"("createdAt");

CREATE TABLE "ImportJobItem" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "externalPropertyId" TEXT,
    "propertyId" TEXT,
    "status" "ImportJobItemStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "payloadHash" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ImportJobItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ImportJobItem_idempotencyKey_key" ON "ImportJobItem"("idempotencyKey");
CREATE INDEX "ImportJobItem_jobId_status_idx" ON "ImportJobItem"("jobId", "status");
CREATE INDEX "ImportJobItem_propertyId_idx" ON "ImportJobItem"("propertyId");
CREATE INDEX "ImportJobItem_externalPropertyId_idx" ON "ImportJobItem"("externalPropertyId");

ALTER TABLE "ImportJobItem"
  ADD CONSTRAINT "ImportJobItem_jobId_fkey"
  FOREIGN KEY ("jobId") REFERENCES "ImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
