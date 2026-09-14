-- Prompt 13/10: Immutable lead context snapshots + retention metadata

ALTER TABLE "Lead" ADD COLUMN "retentionExpiresAt" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN "piiRedactedAt" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN "deletionRequestedAt" TIMESTAMP(3);

CREATE INDEX "Lead_email_type_createdAt_idx" ON "Lead"("email", "type", "createdAt");
CREATE INDEX "Lead_retentionExpiresAt_idx" ON "Lead"("retentionExpiresAt");

CREATE TABLE "MortgageLeadContextSnapshot" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "schemaVersion" TEXT NOT NULL DEFAULT 'mortgage-lead-snapshot.v1',
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "propertyId" TEXT,
  "propertySlug" TEXT,
  "propertyUrl" TEXT,
  "propertyTitle" TEXT,
  "askingPriceCzk" INTEGER,
  "valuationCzk" INTEGER,
  "requestedLoanCzk" INTEGER,
  "availableEquityCzk" INTEGER,
  "ltvOnAskingPricePct" DOUBLE PRECISION,
  "nominalInterestRatePp" DOUBLE PRECISION,
  "aprPp" DOUBLE PRECISION,
  "termYears" INTEGER,
  "estimatedMonthlyPaymentCzk" INTEGER,
  "snapshotJson" JSONB NOT NULL,

  CONSTRAINT "MortgageLeadContextSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MortgageLeadContextSnapshot_leadId_key" ON "MortgageLeadContextSnapshot"("leadId");

ALTER TABLE "MortgageLeadContextSnapshot" ADD CONSTRAINT "MortgageLeadContextSnapshot_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
