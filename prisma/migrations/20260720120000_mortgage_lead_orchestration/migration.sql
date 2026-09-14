-- Mortgage lead orchestration (Prompt 13/5)

CREATE TYPE "MortgageLeadWorkflowStatus" AS ENUM (
  'CREATED',
  'SUBMITTED',
  'RECEIVED',
  'CONTACTED',
  'QUALIFICATION_IN_PROGRESS',
  'DOCUMENTS_NEEDED',
  'SOLUTION_PROPOSED',
  'APPROVED',
  'REJECTED',
  'WITHDRAWN',
  'CLOSED'
);

ALTER TABLE "Lead"
  ADD COLUMN "analysisId" TEXT,
  ADD COLUMN "source" TEXT,
  ADD COLUMN "partner" TEXT,
  ADD COLUMN "consentId" TEXT,
  ADD COLUMN "correlationId" TEXT,
  ADD COLUMN "idempotencyKey" TEXT;

UPDATE "Lead"
SET "correlationId" = 'ml_legacy_' || "id"
WHERE "correlationId" IS NULL;

ALTER TABLE "Lead"
  ALTER COLUMN "correlationId" SET NOT NULL;

CREATE UNIQUE INDEX "Lead_consentId_key" ON "Lead"("consentId");
CREATE UNIQUE INDEX "Lead_correlationId_key" ON "Lead"("correlationId");
CREATE UNIQUE INDEX "Lead_idempotencyKey_key" ON "Lead"("idempotencyKey");
CREATE INDEX "Lead_userId_propertyId_createdAt_idx" ON "Lead"("userId", "propertyId", "createdAt");
CREATE INDEX "Lead_userId_analysisId_createdAt_idx" ON "Lead"("userId", "analysisId", "createdAt");
CREATE INDEX "Lead_partner_createdAt_idx" ON "Lead"("partner", "createdAt");

ALTER TABLE "Lead"
  ADD CONSTRAINT "Lead_analysisId_fkey"
  FOREIGN KEY ("analysisId") REFERENCES "PropertyAnalysis"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "MortgageLeadProfile" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "workflowStatus" "MortgageLeadWorkflowStatus" NOT NULL DEFAULT 'CREATED',
  "availableEquityCzk" INTEGER,
  "monthlyIncomeCzk" INTEGER,
  "monthlyLiabilitiesCzk" INTEGER,
  "purchasePriceCzk" INTEGER,
  "externalLeadId" TEXT,
  "partnerReference" TEXT,
  "isMockSubmission" BOOLEAN NOT NULL DEFAULT false,
  "submittedAt" TIMESTAMP(3),
  "receivedAt" TIMESTAMP(3),
  "contactedAt" TIMESTAMP(3),
  "lastPartnerSyncAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MortgageLeadProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MortgageLeadProfile_leadId_key" ON "MortgageLeadProfile"("leadId");
CREATE INDEX "MortgageLeadProfile_workflowStatus_updatedAt_idx" ON "MortgageLeadProfile"("workflowStatus", "updatedAt");
CREATE INDEX "MortgageLeadProfile_externalLeadId_idx" ON "MortgageLeadProfile"("externalLeadId");

ALTER TABLE "MortgageLeadProfile"
  ADD CONSTRAINT "MortgageLeadProfile_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
