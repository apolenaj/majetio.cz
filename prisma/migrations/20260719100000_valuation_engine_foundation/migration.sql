-- Prompt 10 Part 1: production Valuation engine schema
-- Replaces stub Valuation / ValuationComparable from early analysis models.

-- Enums
CREATE TYPE "ValuationType" AS ENUM (
  'AUTOMATED_ESTIMATE',
  'ANALYST_ADJUSTED',
  'PROFESSIONAL_REVIEW',
  'USER_SCENARIO'
);

CREATE TYPE "ValuationStatus" AS ENUM (
  'DRAFT',
  'CALCULATED',
  'APPROVED',
  'OUTDATED',
  'FAILED',
  'SUPERSEDED'
);

CREATE TYPE "ValuationConfidenceLevel" AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'UNKNOWN'
);

-- Drop stub tables if present (no production data expected)
DROP TABLE IF EXISTS "ValuationComparable" CASCADE;
DROP TABLE IF EXISTS "Valuation" CASCADE;

-- Model registry
CREATE TABLE "ValuationModelRegistry" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "algorithmVersion" TEXT NOT NULL,
    "supportedPropertyTypes" "PropertyType"[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ValuationModelRegistry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ValuationModelRegistry_code_key" ON "ValuationModelRegistry"("code");
CREATE INDEX "ValuationModelRegistry_isActive_idx" ON "ValuationModelRegistry"("isActive");
CREATE INDEX "ValuationModelRegistry_algorithmVersion_idx" ON "ValuationModelRegistry"("algorithmVersion");

-- Valuation
CREATE TABLE "Valuation" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "analysisId" TEXT,
    "modelRegistryId" TEXT,
    "type" "ValuationType" NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "status" "ValuationStatus" NOT NULL DEFAULT 'DRAFT',
    "estimatedValue" INTEGER,
    "lowerBound" INTEGER,
    "upperBound" INTEGER,
    "estimatedPricePerSqm" DOUBLE PRECISION,
    "confidenceLevel" "ValuationConfidenceLevel" NOT NULL DEFAULT 'UNKNOWN',
    "confidenceScore" DOUBLE PRECISION,
    "comparableCount" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'CZK',
    "inputSnapshot" JSONB NOT NULL,
    "calculatedAt" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Valuation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Valuation_propertyId_status_idx" ON "Valuation"("propertyId", "status");
CREATE INDEX "Valuation_propertyId_calculatedAt_idx" ON "Valuation"("propertyId", "calculatedAt");
CREATE INDEX "Valuation_type_status_idx" ON "Valuation"("type", "status");
CREATE INDEX "Valuation_modelVersion_idx" ON "Valuation"("modelVersion");
CREATE INDEX "Valuation_modelRegistryId_idx" ON "Valuation"("modelRegistryId");
CREATE INDEX "Valuation_analysisId_idx" ON "Valuation"("analysisId");
CREATE INDEX "Valuation_validUntil_idx" ON "Valuation"("validUntil");

ALTER TABLE "Valuation" ADD CONSTRAINT "Valuation_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Valuation" ADD CONSTRAINT "Valuation_analysisId_fkey"
  FOREIGN KEY ("analysisId") REFERENCES "PropertyAnalysis"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Valuation" ADD CONSTRAINT "Valuation_modelRegistryId_fkey"
  FOREIGN KEY ("modelRegistryId") REFERENCES "ValuationModelRegistry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Valuation" ADD CONSTRAINT "Valuation_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Comparables
CREATE TABLE "ValuationComparable" (
    "id" TEXT NOT NULL,
    "valuationId" TEXT NOT NULL,
    "comparablePropertyId" TEXT,
    "distanceMeters" INTEGER,
    "pricePerSqm" DOUBLE PRECISION,
    "transactionOrAskingPrice" INTEGER,
    "observedAt" TIMESTAMP(3),
    "similarityScore" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "included" BOOLEAN NOT NULL DEFAULT true,
    "exclusionReason" TEXT,
    "label" TEXT,
    "externalRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValuationComparable_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ValuationComparable_valuationId_included_idx" ON "ValuationComparable"("valuationId", "included");
CREATE INDEX "ValuationComparable_comparablePropertyId_idx" ON "ValuationComparable"("comparablePropertyId");
CREATE INDEX "ValuationComparable_valuationId_similarityScore_idx" ON "ValuationComparable"("valuationId", "similarityScore");

ALTER TABLE "ValuationComparable" ADD CONSTRAINT "ValuationComparable_valuationId_fkey"
  FOREIGN KEY ("valuationId") REFERENCES "Valuation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ValuationComparable" ADD CONSTRAINT "ValuationComparable_comparablePropertyId_fkey"
  FOREIGN KEY ("comparablePropertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Adjustment audit
CREATE TABLE "ValuationAdjustmentAudit" (
    "id" TEXT NOT NULL,
    "valuationId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "fieldKey" TEXT NOT NULL,
    "previousValue" JSONB,
    "newValue" JSONB,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValuationAdjustmentAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ValuationAdjustmentAudit_valuationId_createdAt_idx" ON "ValuationAdjustmentAudit"("valuationId", "createdAt");
CREATE INDEX "ValuationAdjustmentAudit_actorUserId_idx" ON "ValuationAdjustmentAudit"("actorUserId");

ALTER TABLE "ValuationAdjustmentAudit" ADD CONSTRAINT "ValuationAdjustmentAudit_valuationId_fkey"
  FOREIGN KEY ("valuationId") REFERENCES "Valuation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ValuationAdjustmentAudit" ADD CONSTRAINT "ValuationAdjustmentAudit_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
