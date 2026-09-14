-- Part 2/B: scenario ownership, variants, analyst workflow, assumption config versions

CREATE TYPE "AnalysisScenarioProfile" AS ENUM ('USER', 'ANALYST', 'SYSTEM_NEUTRAL');
CREATE TYPE "AnalysisScenarioVariant" AS ENUM ('CONSERVATIVE', 'REALISTIC', 'OPTIMISTIC', 'CUSTOM');
CREATE TYPE "AnalystReviewStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'REVIEWED', 'APPROVED', 'REJECTED');

ALTER TABLE "AnalysisScenario" ADD COLUMN IF NOT EXISTS "ownerUserId" TEXT;
ALTER TABLE "AnalysisScenario" ADD COLUMN IF NOT EXISTS "profile" "AnalysisScenarioProfile" NOT NULL DEFAULT 'USER';
ALTER TABLE "AnalysisScenario" ADD COLUMN IF NOT EXISTS "variant" "AnalysisScenarioVariant" NOT NULL DEFAULT 'REALISTIC';
ALTER TABLE "AnalysisScenario" ADD COLUMN IF NOT EXISTS "assumptionConfigVersion" TEXT NOT NULL DEFAULT 'assumptions.v1';
ALTER TABLE "AnalysisScenario" ADD COLUMN IF NOT EXISTS "baseCurrency" TEXT NOT NULL DEFAULT 'CZK';
ALTER TABLE "AnalysisScenario" ADD COLUMN IF NOT EXISTS "exchangeRateSnapshot" JSONB;
ALTER TABLE "AnalysisScenario" ADD COLUMN IF NOT EXISTS "isPublicShareEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AnalysisScenario" ADD COLUMN IF NOT EXISTS "clonedFromId" TEXT;
ALTER TABLE "AnalysisScenario" ADD COLUMN IF NOT EXISTS "analystReviewStatus" "AnalystReviewStatus";
ALTER TABLE "AnalysisScenario" ADD COLUMN IF NOT EXISTS "analystReviewReason" TEXT;
ALTER TABLE "AnalysisScenario" ADD COLUMN IF NOT EXISTS "reviewedByUserId" TEXT;
ALTER TABLE "AnalysisScenario" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
ALTER TABLE "AnalysisScenario" ADD COLUMN IF NOT EXISTS "approvedByUserId" TEXT;
ALTER TABLE "AnalysisScenario" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AnalysisScenario_ownerUserId_fkey') THEN
    ALTER TABLE "AnalysisScenario"
      ADD CONSTRAINT "AnalysisScenario_ownerUserId_fkey"
      FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AnalysisScenario_reviewedByUserId_fkey') THEN
    ALTER TABLE "AnalysisScenario"
      ADD CONSTRAINT "AnalysisScenario_reviewedByUserId_fkey"
      FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AnalysisScenario_approvedByUserId_fkey') THEN
    ALTER TABLE "AnalysisScenario"
      ADD CONSTRAINT "AnalysisScenario_approvedByUserId_fkey"
      FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AnalysisScenario_clonedFromId_fkey') THEN
    ALTER TABLE "AnalysisScenario"
      ADD CONSTRAINT "AnalysisScenario_clonedFromId_fkey"
      FOREIGN KEY ("clonedFromId") REFERENCES "AnalysisScenario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "AnalysisScenario_ownerUserId_status_updatedAt_idx"
  ON "AnalysisScenario"("ownerUserId", "status", "updatedAt");
CREATE INDEX IF NOT EXISTS "AnalysisScenario_profile_analystReviewStatus_idx"
  ON "AnalysisScenario"("profile", "analystReviewStatus");
CREATE INDEX IF NOT EXISTS "AnalysisScenario_assumptionConfigVersion_idx"
  ON "AnalysisScenario"("assumptionConfigVersion");

CREATE TABLE IF NOT EXISTS "AssumptionConfigVersion" (
  "id" TEXT NOT NULL,
  "versionKey" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "effectiveFrom" TIMESTAMP(3) NOT NULL,
  "effectiveTo" TIMESTAMP(3),
  "isCurrent" BOOLEAN NOT NULL DEFAULT false,
  "config" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssumptionConfigVersion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AssumptionConfigVersion_versionKey_key"
  ON "AssumptionConfigVersion"("versionKey");
CREATE INDEX IF NOT EXISTS "AssumptionConfigVersion_isCurrent_idx"
  ON "AssumptionConfigVersion"("isCurrent");
CREATE INDEX IF NOT EXISTS "AssumptionConfigVersion_effectiveFrom_idx"
  ON "AssumptionConfigVersion"("effectiveFrom");
