-- CreateEnum
CREATE TYPE "RenovationAnalysisType" AS ENUM ('AUTOMATIC', 'USER_DEFINED', 'ANALYST_ADJUSTED', 'PROFESSIONAL');

-- CreateEnum
CREATE TYPE "RenovationAnalysisStatus" AS ENUM ('DRAFT', 'CALCULATED', 'PARTIAL', 'FAILED', 'STALE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "RenovationAnalysis" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT,
    "analysisId" TEXT,
    "scenarioId" TEXT,
    "type" "RenovationAnalysisType" NOT NULL DEFAULT 'AUTOMATIC',
    "status" "RenovationAnalysisStatus" NOT NULL DEFAULT 'DRAFT',
    "scopeVersion" TEXT NOT NULL,
    "costModelVersion" TEXT NOT NULL,
    "locationCostVersion" TEXT NOT NULL,
    "estimatedLow" INTEGER,
    "estimatedBase" INTEGER,
    "estimatedHigh" INTEGER,
    "contingencyAmount" INTEGER,
    "estimatedDuration" INTEGER,
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "calculatedAt" TIMESTAMP(3),

    CONSTRAINT "RenovationAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RenovationAnalysis_propertyId_status_updatedAt_idx" ON "RenovationAnalysis"("propertyId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "RenovationAnalysis_analysisId_idx" ON "RenovationAnalysis"("analysisId");

-- CreateIndex
CREATE INDEX "RenovationAnalysis_scenarioId_idx" ON "RenovationAnalysis"("scenarioId");

-- CreateIndex
CREATE INDEX "RenovationAnalysis_status_calculatedAt_idx" ON "RenovationAnalysis"("status", "calculatedAt");

-- CreateIndex
CREATE INDEX "RenovationAnalysis_scopeVersion_idx" ON "RenovationAnalysis"("scopeVersion");

-- CreateIndex
CREATE INDEX "RenovationAnalysis_costModelVersion_locationCostVersion_idx" ON "RenovationAnalysis"("costModelVersion", "locationCostVersion");

-- AddForeignKey
ALTER TABLE "RenovationAnalysis" ADD CONSTRAINT "RenovationAnalysis_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RenovationAnalysis" ADD CONSTRAINT "RenovationAnalysis_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "PropertyAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RenovationAnalysis" ADD CONSTRAINT "RenovationAnalysis_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "AnalysisScenario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
