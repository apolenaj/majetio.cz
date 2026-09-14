-- HypotekaJasne integration — mortgage offers & rate history (Prompt 13 Part 1)

-- CreateEnum
CREATE TYPE "MortgageOfferStatus" AS ENUM ('ACTIVE', 'REVIEW_REQUIRED', 'INACTIVE', 'STALE');

-- CreateEnum
CREATE TYPE "MortgageDataTier" AS ENUM ('LIVE', 'CACHED', 'VERIFIED');

-- CreateTable
CREATE TABLE "MortgageOffer" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "bankName" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "interestRateFrom" DOUBLE PRECISION NOT NULL,
    "aprFrom" DOUBLE PRECISION,
    "fixationYears" INTEGER,
    "ltvMaxPct" DOUBLE PRECISION,
    "ltvMinPct" DOUBLE PRECISION,
    "arrangementFeeCzk" INTEGER,
    "valuationFeeCzk" INTEGER,
    "monthlyFeeCzk" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'hypotekajasne',
    "status" "MortgageOfferStatus" NOT NULL DEFAULT 'ACTIVE',
    "dataTier" "MortgageDataTier" NOT NULL DEFAULT 'CACHED',
    "retrievedAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "staleMarkedAt" TIMESTAMP(3),
    "schemaVersion" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "anomalyFlags" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MortgageOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MortgageRateHistory" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "interestRateFrom" DOUBLE PRECISION NOT NULL,
    "aprFrom" DOUBLE PRECISION,
    "fixationYears" INTEGER,
    "previousInterestRateFrom" DOUBLE PRECISION,
    "previousAprFrom" DOUBLE PRECISION,
    "changeDetectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL,
    "ingestionRunId" TEXT,

    CONSTRAINT "MortgageRateHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MortgageOffer_externalId_key" ON "MortgageOffer"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "MortgageOffer_dedupeKey_key" ON "MortgageOffer"("dedupeKey");

-- CreateIndex
CREATE INDEX "MortgageOffer_status_dataTier_idx" ON "MortgageOffer"("status", "dataTier");

-- CreateIndex
CREATE INDEX "MortgageOffer_retrievedAt_idx" ON "MortgageOffer"("retrievedAt");

-- CreateIndex
CREATE INDEX "MortgageOffer_bankName_idx" ON "MortgageOffer"("bankName");

-- CreateIndex
CREATE INDEX "MortgageRateHistory_offerId_changeDetectedAt_idx" ON "MortgageRateHistory"("offerId", "changeDetectedAt");

-- CreateIndex
CREATE INDEX "MortgageRateHistory_ingestionRunId_idx" ON "MortgageRateHistory"("ingestionRunId");

-- AddForeignKey
ALTER TABLE "MortgageRateHistory" ADD CONSTRAINT "MortgageRateHistory_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "MortgageOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
