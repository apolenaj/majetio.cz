-- Cached investment metrics for discovery filters.
-- All metric columns are nullable: missing calculation stays NULL, never a placeholder number.

CREATE TABLE "PropertyInvestmentSnapshot" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "grossYieldPct" DOUBLE PRECISION,
    "netYieldPct" DOUBLE PRECISION,
    "estimatedRentMonthlyCzk" INTEGER,
    "rentPerSqm" DOUBLE PRECISION,
    "monthlyCashflowCzk" INTEGER,
    "cashOnCashPct" DOUBLE PRECISION,
    "paybackYears" DOUBLE PRECISION,
    "renovationCostMinCzk" INTEGER,
    "renovationCostMaxCzk" INTEGER,
    "renovationLevel" TEXT,
    "yieldAfterRenovationPct" DOUBLE PRECISION,
    "allInCostCzk" INTEGER,
    "estimatedValueMinCzk" INTEGER,
    "estimatedValueMaxCzk" INTEGER,
    "discountToEstimatedValuePct" DOUBLE PRECISION,
    "tenantDemandScore" INTEGER,
    "estimatedOccupancyMinPct" DOUBLE PRECISION,
    "estimatedOccupancyMaxPct" DOUBLE PRECISION,
    "estimatedVacancyDaysPerYear" INTEGER,
    "investmentRisk" TEXT,
    "locationRisk" TEXT,
    "tenantRisk" TEXT,
    "renovationRisk" TEXT,
    "financialRisk" TEXT,
    "dataRisk" TEXT,
    "majetioScore" DOUBLE PRECISION,
    "dataConfidencePct" DOUBLE PRECISION,
    "methodVersion" TEXT NOT NULL DEFAULT '1.3.0',
    "calculatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyInvestmentSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PropertyInvestmentSnapshot_propertyId_key" ON "PropertyInvestmentSnapshot"("propertyId");
CREATE INDEX "PropertyInvestmentSnapshot_grossYieldPct_idx" ON "PropertyInvestmentSnapshot"("grossYieldPct");
CREATE INDEX "PropertyInvestmentSnapshot_netYieldPct_idx" ON "PropertyInvestmentSnapshot"("netYieldPct");
CREATE INDEX "PropertyInvestmentSnapshot_monthlyCashflowCzk_idx" ON "PropertyInvestmentSnapshot"("monthlyCashflowCzk");
CREATE INDEX "PropertyInvestmentSnapshot_cashOnCashPct_idx" ON "PropertyInvestmentSnapshot"("cashOnCashPct");
CREATE INDEX "PropertyInvestmentSnapshot_paybackYears_idx" ON "PropertyInvestmentSnapshot"("paybackYears");
CREATE INDEX "PropertyInvestmentSnapshot_majetioScore_idx" ON "PropertyInvestmentSnapshot"("majetioScore");
CREATE INDEX "PropertyInvestmentSnapshot_dataConfidencePct_idx" ON "PropertyInvestmentSnapshot"("dataConfidencePct");
CREATE INDEX "PropertyInvestmentSnapshot_tenantDemandScore_idx" ON "PropertyInvestmentSnapshot"("tenantDemandScore");
CREATE INDEX "PropertyInvestmentSnapshot_discountToEstimatedValuePct_idx" ON "PropertyInvestmentSnapshot"("discountToEstimatedValuePct");
CREATE INDEX "PropertyInvestmentSnapshot_calculatedAt_idx" ON "PropertyInvestmentSnapshot"("calculatedAt");

ALTER TABLE "PropertyInvestmentSnapshot"
ADD CONSTRAINT "PropertyInvestmentSnapshot_propertyId_fkey"
FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Property_energyRating_idx" ON "Property"("energyRating");
CREATE INDEX IF NOT EXISTS "Property_constructionType_idx" ON "Property"("constructionType");
CREATE INDEX IF NOT EXISTS "Property_yearBuilt_idx" ON "Property"("yearBuilt");
CREATE INDEX IF NOT EXISTS "Property_floor_idx" ON "Property"("floor");
CREATE INDEX IF NOT EXISTS "Property_listingOwnerKind_idx" ON "Property"("listingOwnerKind");
