-- Prompt 13/9: CRM foundation + market routing metadata

CREATE TYPE "MortgageLeadCrmNextAction" AS ENUM (
  'AWAIT_PARTNER_RESPONSE',
  'CONTACT_CLIENT',
  'REQUEST_DOCUMENTS',
  'FOLLOW_UP',
  'NONE'
);

ALTER TABLE "Lead" ADD COLUMN "marketCountry" TEXT DEFAULT 'CZ';

CREATE TABLE "MortgageLeadCrm" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "ownerUserId" TEXT,
  "nextAction" "MortgageLeadCrmNextAction" NOT NULL DEFAULT 'AWAIT_PARTNER_RESPONSE',
  "assignedToUserId" TEXT,
  "assignedAt" TIMESTAMP(3),
  "routingCountry" TEXT NOT NULL DEFAULT 'CZ',
  "routingPartner" TEXT NOT NULL DEFAULT 'hypotekajasne',
  "routingRuleKey" TEXT NOT NULL DEFAULT 'cz-default-hypotekajasne',
  "regulatoryConfigVersion" TEXT,
  "estimatedLoanAmountCzk" INTEGER,
  "estimatedCommissionCzk" INTEGER,
  "valueMetricsUpdatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MortgageLeadCrm_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MortgageLeadCrm_leadId_key" ON "MortgageLeadCrm"("leadId");
CREATE INDEX "MortgageLeadCrm_routingPartner_routingCountry_idx" ON "MortgageLeadCrm"("routingPartner", "routingCountry");
CREATE INDEX "MortgageLeadCrm_ownerUserId_idx" ON "MortgageLeadCrm"("ownerUserId");
CREATE INDEX "MortgageLeadCrm_assignedToUserId_nextAction_idx" ON "MortgageLeadCrm"("assignedToUserId", "nextAction");

ALTER TABLE "MortgageLeadCrm" ADD CONSTRAINT "MortgageLeadCrm_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MortgageLeadCrm" ADD CONSTRAINT "MortgageLeadCrm_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MortgageLeadCrm" ADD CONSTRAINT "MortgageLeadCrm_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
