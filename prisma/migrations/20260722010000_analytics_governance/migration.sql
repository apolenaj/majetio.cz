-- Analytics governance: valuation lifecycle, MAE/MAPE, assumptions/catalog approval, mortgage feed

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ValuationModelLifecycleStatus') THEN
    CREATE TYPE "ValuationModelLifecycleStatus" AS ENUM ('DRAFT', 'TESTING', 'APPROVED', 'ACTIVE');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AnalyticsConfigApprovalStatus') THEN
    CREATE TYPE "AnalyticsConfigApprovalStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'REJECTED');
  END IF;
END $$;

ALTER TABLE "ValuationModelRegistry" ADD COLUMN IF NOT EXISTS "lifecycleStatus" "ValuationModelLifecycleStatus" NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "ValuationModelRegistry" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);
ALTER TABLE "ValuationModelRegistry" ADD COLUMN IF NOT EXISTS "approvedByUserId" TEXT;
ALTER TABLE "ValuationModelRegistry" ADD COLUMN IF NOT EXISTS "activatedAt" TIMESTAMP(3);
ALTER TABLE "ValuationModelRegistry" ADD COLUMN IF NOT EXISTS "activatedByUserId" TEXT;
CREATE INDEX IF NOT EXISTS "ValuationModelRegistry_lifecycleStatus_idx" ON "ValuationModelRegistry"("lifecycleStatus");
CREATE INDEX IF NOT EXISTS "ValuationModelRegistry_marketCode_lifecycleStatus_idx" ON "ValuationModelRegistry"("marketCode", "lifecycleStatus");

CREATE TABLE IF NOT EXISTS "ValuationModelPerformanceSnapshot" (
  "id" TEXT NOT NULL,
  "modelRegistryId" TEXT NOT NULL,
  "marketCode" TEXT NOT NULL DEFAULT 'CZ',
  "segmentKey" TEXT NOT NULL DEFAULT 'ALL',
  "sampleSize" INTEGER NOT NULL,
  "mae" DOUBLE PRECISION NOT NULL,
  "mape" DOUBLE PRECISION NOT NULL,
  "previousMae" DOUBLE PRECISION,
  "previousMape" DOUBLE PRECISION,
  "regressionAlert" BOOLEAN NOT NULL DEFAULT false,
  "regressionNote" TEXT,
  "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "meta" JSONB,
  CONSTRAINT "ValuationModelPerformanceSnapshot_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ValuationModelPerformanceSnapshot_modelRegistryId_computedAt_idx"
  ON "ValuationModelPerformanceSnapshot"("modelRegistryId", "computedAt");
CREATE INDEX IF NOT EXISTS "ValuationModelPerformanceSnapshot_marketCode_segmentKey_idx"
  ON "ValuationModelPerformanceSnapshot"("marketCode", "segmentKey");
CREATE INDEX IF NOT EXISTS "ValuationModelPerformanceSnapshot_regressionAlert_idx"
  ON "ValuationModelPerformanceSnapshot"("regressionAlert");

DO $$ BEGIN
  ALTER TABLE "ValuationModelPerformanceSnapshot"
    ADD CONSTRAINT "ValuationModelPerformanceSnapshot_modelRegistryId_fkey"
    FOREIGN KEY ("modelRegistryId") REFERENCES "ValuationModelRegistry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "AssumptionConfigVersion" ADD COLUMN IF NOT EXISTS "approvalStatus" "AnalyticsConfigApprovalStatus" NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "AssumptionConfigVersion" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);
ALTER TABLE "AssumptionConfigVersion" ADD COLUMN IF NOT EXISTS "approvedByUserId" TEXT;
ALTER TABLE "AssumptionConfigVersion" ADD COLUMN IF NOT EXISTS "changeReason" TEXT;
CREATE INDEX IF NOT EXISTS "AssumptionConfigVersion_approvalStatus_idx" ON "AssumptionConfigVersion"("approvalStatus");

CREATE TABLE IF NOT EXISTS "RenovationCostCatalogVersion" (
  "id" TEXT NOT NULL,
  "versionKey" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "marketCode" TEXT NOT NULL DEFAULT 'CZ',
  "approvalStatus" "AnalyticsConfigApprovalStatus" NOT NULL DEFAULT 'DRAFT',
  "isCurrent" BOOLEAN NOT NULL DEFAULT false,
  "catalogJson" JSONB NOT NULL,
  "previousVersionKey" TEXT,
  "changeReason" TEXT,
  "anomalyFlags" JSONB,
  "approvedAt" TIMESTAMP(3),
  "approvedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RenovationCostCatalogVersion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "RenovationCostCatalogVersion_versionKey_key" ON "RenovationCostCatalogVersion"("versionKey");
CREATE INDEX IF NOT EXISTS "RenovationCostCatalogVersion_isCurrent_idx" ON "RenovationCostCatalogVersion"("isCurrent");
CREATE INDEX IF NOT EXISTS "RenovationCostCatalogVersion_approvalStatus_idx" ON "RenovationCostCatalogVersion"("approvalStatus");
CREATE INDEX IF NOT EXISTS "RenovationCostCatalogVersion_marketCode_idx" ON "RenovationCostCatalogVersion"("marketCode");

CREATE TABLE IF NOT EXISTS "MortgageFeedControl" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "autoPublishEnabled" BOOLEAN NOT NULL DEFAULT true,
  "blockedReason" TEXT,
  "blockedAt" TIMESTAMP(3),
  "blockedByUserId" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MortgageFeedControl_pkey" PRIMARY KEY ("id")
);
