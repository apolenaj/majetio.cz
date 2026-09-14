-- Data Quality Center + Import Ops + Source Management (Prompt 3)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'DataQualityIssueStatus' AND e.enumlabel = 'IN_REVIEW') THEN
    ALTER TYPE "DataQualityIssueStatus" ADD VALUE 'IN_REVIEW';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'DataQualityIssueStatus' AND e.enumlabel = 'FALSE_POSITIVE') THEN
    ALTER TYPE "DataQualityIssueStatus" ADD VALUE 'FALSE_POSITIVE';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DataQualityIssueCategory') THEN
    CREATE TYPE "DataQualityIssueCategory" AS ENUM ('MISSING', 'CONFLICT', 'ANOMALY', 'STALE', 'DUPLICATE');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'ImportJobStatus' AND e.enumlabel = 'QUEUED') THEN
    ALTER TYPE "ImportJobStatus" ADD VALUE 'QUEUED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'ImportJobStatus' AND e.enumlabel = 'COMPLETED_WITH_WARNINGS') THEN
    ALTER TYPE "ImportJobStatus" ADD VALUE 'COMPLETED_WITH_WARNINGS';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SourceHealthStatus') THEN
    CREATE TYPE "SourceHealthStatus" AS ENUM ('HEALTHY', 'DEGRADED', 'UNHEALTHY', 'DISABLED');
  END IF;
END $$;

ALTER TABLE "DataQualityIssue" ADD COLUMN IF NOT EXISTS "ruleVersion" TEXT NOT NULL DEFAULT '1';
ALTER TABLE "DataQualityIssue" ADD COLUMN IF NOT EXISTS "category" "DataQualityIssueCategory" NOT NULL DEFAULT 'ANOMALY';
ALTER TABLE "DataQualityIssue" ADD COLUMN IF NOT EXISTS "explanation" TEXT;
ALTER TABLE "DataQualityIssue" ADD COLUMN IF NOT EXISTS "resolutionReason" TEXT;
ALTER TABLE "DataQualityIssue" ADD COLUMN IF NOT EXISTS "resolvedByUserId" TEXT;
ALTER TABLE "DataQualityIssue" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
ALTER TABLE "DataQualityIssue" ADD COLUMN IF NOT EXISTS "reviewedByUserId" TEXT;

CREATE INDEX IF NOT EXISTS "DataQualityIssue_category_status_idx" ON "DataQualityIssue"("category", "status");
CREATE INDEX IF NOT EXISTS "DataQualityIssue_status_severity_idx" ON "DataQualityIssue"("status", "severity");

ALTER TABLE "PropertySource" ADD COLUMN IF NOT EXISTS "healthStatus" "SourceHealthStatus" NOT NULL DEFAULT 'HEALTHY';
ALTER TABLE "PropertySource" ADD COLUMN IF NOT EXISTS "licenseExpiresAt" TIMESTAMP(3);
ALTER TABLE "PropertySource" ADD COLUMN IF NOT EXISTS "importEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "PropertySource" ADD COLUMN IF NOT EXISTS "frontendVisible" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS "PropertySource_provider_healthStatus_idx" ON "PropertySource"("provider", "healthStatus");
CREATE INDEX IF NOT EXISTS "PropertySource_licenseExpiresAt_idx" ON "PropertySource"("licenseExpiresAt");
CREATE INDEX IF NOT EXISTS "PropertySource_importEnabled_idx" ON "PropertySource"("importEnabled");

CREATE TABLE IF NOT EXISTS "DataSourceProviderConfig" (
  "provider" TEXT NOT NULL,
  "displayName" TEXT,
  "healthStatus" "SourceHealthStatus" NOT NULL DEFAULT 'HEALTHY',
  "licenseStatus" "LicenseStatus" NOT NULL DEFAULT 'UNKNOWN',
  "licenseExpiresAt" TIMESTAMP(3),
  "importEnabled" BOOLEAN NOT NULL DEFAULT true,
  "frontendVisible" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "updatedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DataSourceProviderConfig_pkey" PRIMARY KEY ("provider")
);

CREATE INDEX IF NOT EXISTS "DataSourceProviderConfig_healthStatus_idx" ON "DataSourceProviderConfig"("healthStatus");
CREATE INDEX IF NOT EXISTS "DataSourceProviderConfig_licenseExpiresAt_idx" ON "DataSourceProviderConfig"("licenseExpiresAt");
CREATE INDEX IF NOT EXISTS "DataSourceProviderConfig_importEnabled_idx" ON "DataSourceProviderConfig"("importEnabled");
