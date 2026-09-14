-- Methodology package stamps + listing report / USER_REPORT DQ category

ALTER TYPE "DataQualityIssueCategory" ADD VALUE IF NOT EXISTS 'USER_REPORT';

CREATE TYPE "ListingReportIssueType" AS ENUM (
  'INCORRECT_DATA',
  'DUPLICATE',
  'UNAVAILABLE',
  'MISLEADING',
  'PROHIBITED_CONTENT'
);

CREATE TYPE "ListingReportStatus" AS ENUM (
  'OPEN',
  'IN_REVIEW',
  'RESOLVED',
  'DISMISSED',
  'DUPLICATE_REPORT'
);

ALTER TABLE "PropertyAnalysis"
  ADD COLUMN IF NOT EXISTS "methodologyPackageVersion" TEXT;

ALTER TABLE "AnalysisScenario"
  ADD COLUMN IF NOT EXISTS "methodologyPackageVersion" TEXT;

CREATE INDEX IF NOT EXISTS "AnalysisScenario_methodologyPackageVersion_idx"
  ON "AnalysisScenario"("methodologyPackageVersion");

CREATE TABLE IF NOT EXISTS "ListingReport" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "reporterUserId" TEXT,
  "reporterIpHash" TEXT,
  "issueType" "ListingReportIssueType" NOT NULL,
  "details" TEXT,
  "status" "ListingReportStatus" NOT NULL DEFAULT 'OPEN',
  "dataQualityIssueId" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "reviewedByUserId" TEXT,
  "resolutionNote" TEXT,
  "meta" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ListingReport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ListingReport_dataQualityIssueId_key"
  ON "ListingReport"("dataQualityIssueId");

CREATE INDEX IF NOT EXISTS "ListingReport_propertyId_status_createdAt_idx"
  ON "ListingReport"("propertyId", "status", "createdAt");

CREATE INDEX IF NOT EXISTS "ListingReport_reporterUserId_createdAt_idx"
  ON "ListingReport"("reporterUserId", "createdAt");

CREATE INDEX IF NOT EXISTS "ListingReport_reporterIpHash_createdAt_idx"
  ON "ListingReport"("reporterIpHash", "createdAt");

CREATE INDEX IF NOT EXISTS "ListingReport_issueType_status_idx"
  ON "ListingReport"("issueType", "status");

CREATE INDEX IF NOT EXISTS "ListingReport_status_createdAt_idx"
  ON "ListingReport"("status", "createdAt");

ALTER TABLE "ListingReport"
  ADD CONSTRAINT "ListingReport_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ListingReport"
  ADD CONSTRAINT "ListingReport_reporterUserId_fkey"
  FOREIGN KEY ("reporterUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ListingReport"
  ADD CONSTRAINT "ListingReport_reviewedByUserId_fkey"
  FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ListingReport"
  ADD CONSTRAINT "ListingReport_dataQualityIssueId_fkey"
  FOREIGN KEY ("dataQualityIssueId") REFERENCES "DataQualityIssue"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
