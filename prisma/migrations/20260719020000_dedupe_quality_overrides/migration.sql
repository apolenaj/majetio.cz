-- Prompt 7 Part 3 — Deduplication, data quality, field overrides

CREATE TYPE "DuplicateCandidateStatus" AS ENUM ('PENDING', 'MERGED', 'NOT_DUPLICATE');
CREATE TYPE "DataQualitySeverity" AS ENUM ('CRITICAL', 'WARNING', 'INFO');
CREATE TYPE "DataQualityIssueStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'IGNORED');

CREATE TABLE "PropertyDuplicateCandidate" (
    "id" TEXT NOT NULL,
    "propertyAId" TEXT NOT NULL,
    "propertyBId" TEXT NOT NULL,
    "similarityScore" DOUBLE PRECISION NOT NULL,
    "scoreBreakdown" JSONB,
    "status" "DuplicateCandidateStatus" NOT NULL DEFAULT 'PENDING',
    "mergeIntoPropertyId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PropertyDuplicateCandidate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PropertyDuplicateCandidate_propertyAId_propertyBId_key"
  ON "PropertyDuplicateCandidate"("propertyAId", "propertyBId");
CREATE INDEX "PropertyDuplicateCandidate_status_similarityScore_idx"
  ON "PropertyDuplicateCandidate"("status", "similarityScore");
CREATE INDEX "PropertyDuplicateCandidate_mergeIntoPropertyId_idx"
  ON "PropertyDuplicateCandidate"("mergeIntoPropertyId");

ALTER TABLE "PropertyDuplicateCandidate"
  ADD CONSTRAINT "PropertyDuplicateCandidate_propertyAId_fkey"
  FOREIGN KEY ("propertyAId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PropertyDuplicateCandidate"
  ADD CONSTRAINT "PropertyDuplicateCandidate_propertyBId_fkey"
  FOREIGN KEY ("propertyBId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PropertyDuplicateCandidate"
  ADD CONSTRAINT "PropertyDuplicateCandidate_mergeIntoPropertyId_fkey"
  FOREIGN KEY ("mergeIntoPropertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PropertyDuplicateCandidate"
  ADD CONSTRAINT "PropertyDuplicateCandidate_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "DataQualityIssue" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "ruleCode" TEXT NOT NULL,
    "severity" "DataQualitySeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "field" TEXT,
    "status" "DataQualityIssueStatus" NOT NULL DEFAULT 'OPEN',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DataQualityIssue_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DataQualityIssue_propertyId_status_idx" ON "DataQualityIssue"("propertyId", "status");
CREATE INDEX "DataQualityIssue_ruleCode_severity_idx" ON "DataQualityIssue"("ruleCode", "severity");
CREATE INDEX "DataQualityIssue_detectedAt_idx" ON "DataQualityIssue"("detectedAt");

ALTER TABLE "DataQualityIssue"
  ADD CONSTRAINT "DataQualityIssue_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "DataCompletenessScore" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "breakdown" JSONB NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DataCompletenessScore_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DataCompletenessScore_propertyId_key" ON "DataCompletenessScore"("propertyId");

ALTER TABLE "DataCompletenessScore"
  ADD CONSTRAINT "DataCompletenessScore_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "PropertyFieldOverride" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "valueType" "PropertyAttributeValueType" NOT NULL DEFAULT 'STRING',
    "locked" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PropertyFieldOverride_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PropertyFieldOverride_propertyId_fieldKey_key"
  ON "PropertyFieldOverride"("propertyId", "fieldKey");
CREATE INDEX "PropertyFieldOverride_locked_idx" ON "PropertyFieldOverride"("locked");

ALTER TABLE "PropertyFieldOverride"
  ADD CONSTRAINT "PropertyFieldOverride_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PropertyFieldOverride"
  ADD CONSTRAINT "PropertyFieldOverride_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PropertyFieldOverride"
  ADD CONSTRAINT "PropertyFieldOverride_updatedById_fkey"
  FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
