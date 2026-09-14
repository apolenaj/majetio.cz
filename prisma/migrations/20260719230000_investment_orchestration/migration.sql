-- Investment orchestration: AnalysisScenario + InvestmentCalculation evolution

CREATE TYPE "AnalysisScenarioType" AS ENUM (
  'LONG_TERM_RENTAL',
  'CASH_PURCHASE',
  'SHORT_TERM_RENTAL',
  'FLIP',
  'RENOVATION_RENT',
  'BASE_METRICS'
);

CREATE TYPE "AnalysisScenarioStatus" AS ENUM (
  'DRAFT',
  'CALCULATED',
  'PARTIAL',
  'STALE',
  'FAILED',
  'ARCHIVED'
);

-- AnalysisScenario: evolve stub → versioned orchestration model
ALTER TABLE "AnalysisScenario" ADD COLUMN IF NOT EXISTS "propertyId" TEXT;
ALTER TABLE "AnalysisScenario" ADD COLUMN IF NOT EXISTS "scenarioType" "AnalysisScenarioType" NOT NULL DEFAULT 'BASE_METRICS';
ALTER TABLE "AnalysisScenario" ADD COLUMN IF NOT EXISTS "status" "AnalysisScenarioStatus" NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "AnalysisScenario" ADD COLUMN IF NOT EXISTS "inputSnapshot" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "AnalysisScenario" ADD COLUMN IF NOT EXISTS "calculationEngineVersion" TEXT NOT NULL DEFAULT '0.0.0-legacy';
ALTER TABLE "AnalysisScenario" ADD COLUMN IF NOT EXISTS "formulaRegistryVersion" TEXT NOT NULL DEFAULT '0.0.0';
ALTER TABLE "AnalysisScenario" ADD COLUMN IF NOT EXISTS "inputHash" TEXT NOT NULL DEFAULT '';
ALTER TABLE "AnalysisScenario" ADD COLUMN IF NOT EXISTS "calculatedAt" TIMESTAMP(3);
ALTER TABLE "AnalysisScenario" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Rename assumptions → assumptionSet (keep data)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'AnalysisScenario' AND column_name = 'assumptions'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'AnalysisScenario' AND column_name = 'assumptionSet'
  ) THEN
    ALTER TABLE "AnalysisScenario" RENAME COLUMN "assumptions" TO "assumptionSet";
  END IF;
END $$;

ALTER TABLE "AnalysisScenario" ADD COLUMN IF NOT EXISTS "assumptionSet" JSONB NOT NULL DEFAULT '{}';

-- Make analysisId / name optional
ALTER TABLE "AnalysisScenario" ALTER COLUMN "analysisId" DROP NOT NULL;
ALTER TABLE "AnalysisScenario" ALTER COLUMN "name" DROP NOT NULL;

-- Drop old FK if it required NOT NULL cascade-only path; re-add property FK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AnalysisScenario_propertyId_fkey'
  ) THEN
    ALTER TABLE "AnalysisScenario"
      ADD CONSTRAINT "AnalysisScenario_propertyId_fkey"
      FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "AnalysisScenario_propertyId_scenarioType_status_idx"
  ON "AnalysisScenario"("propertyId", "scenarioType", "status");
CREATE INDEX IF NOT EXISTS "AnalysisScenario_analysisId_idx" ON "AnalysisScenario"("analysisId");
CREATE INDEX IF NOT EXISTS "AnalysisScenario_inputHash_idx" ON "AnalysisScenario"("inputHash");
CREATE INDEX IF NOT EXISTS "AnalysisScenario_calculationEngineVersion_idx"
  ON "AnalysisScenario"("calculationEngineVersion");
CREATE INDEX IF NOT EXISTS "AnalysisScenario_status_calculatedAt_idx"
  ON "AnalysisScenario"("status", "calculatedAt");

-- InvestmentCalculation: add versioning, hash, optional FKs
ALTER TABLE "InvestmentCalculation" ADD COLUMN IF NOT EXISTS "scenarioId" TEXT;
ALTER TABLE "InvestmentCalculation" ADD COLUMN IF NOT EXISTS "propertyId" TEXT;
ALTER TABLE "InvestmentCalculation" ADD COLUMN IF NOT EXISTS "formulaRegistryVersion" TEXT NOT NULL DEFAULT '0.0.0';
ALTER TABLE "InvestmentCalculation" ADD COLUMN IF NOT EXISTS "inputHash" TEXT NOT NULL DEFAULT '';

ALTER TABLE "InvestmentCalculation" ALTER COLUMN "analysisId" DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'InvestmentCalculation_scenarioId_fkey'
  ) THEN
    ALTER TABLE "InvestmentCalculation"
      ADD CONSTRAINT "InvestmentCalculation_scenarioId_fkey"
      FOREIGN KEY ("scenarioId") REFERENCES "AnalysisScenario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'InvestmentCalculation_propertyId_fkey'
  ) THEN
    ALTER TABLE "InvestmentCalculation"
      ADD CONSTRAINT "InvestmentCalculation_propertyId_fkey"
      FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "InvestmentCalculation_inputHash_engineVersion_idx"
  ON "InvestmentCalculation"("inputHash", "engineVersion");
CREATE INDEX IF NOT EXISTS "InvestmentCalculation_analysisId_idx" ON "InvestmentCalculation"("analysisId");
CREATE INDEX IF NOT EXISTS "InvestmentCalculation_scenarioId_idx" ON "InvestmentCalculation"("scenarioId");
CREATE INDEX IF NOT EXISTS "InvestmentCalculation_propertyId_createdAt_idx"
  ON "InvestmentCalculation"("propertyId", "createdAt");
