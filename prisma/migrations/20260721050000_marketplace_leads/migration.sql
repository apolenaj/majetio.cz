-- Marketplace Inquiry vs QualifiedBuyerLead + agent privacy consent

DO $$ BEGIN
  ALTER TYPE "ConsentType" ADD VALUE IF NOT EXISTS 'AGENT_BUYER_PROFILE_SHARE';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'OPEN', 'CLOSED', 'SPAM', 'CONVERTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "QualifiedBuyerLeadStatus" AS ENUM (
    'PENDING_AGENT_REVIEW',
    'ACCEPTED',
    'DECLINED',
    'EXPIRED',
    'WITHDRAWN'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "BuyerFinancingStance" AS ENUM (
    'UNKNOWN',
    'CASH',
    'MORTGAGE_PREAPPROVED',
    'MORTGAGE_EXPLORING',
    'MIXED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ContactVerificationLevel" AS ENUM (
    'UNVERIFIED',
    'EMAIL_VERIFIED',
    'PHONE_VERIFIED',
    'EMAIL_AND_PHONE_VERIFIED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Inquiry" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "organizationId" TEXT,
  "agentUserId" TEXT,
  "buyerUserId" TEXT,
  "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
  "buyerName" TEXT,
  "buyerEmail" TEXT,
  "buyerPhone" TEXT,
  "message" TEXT,
  "source" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Inquiry_propertyId_status_createdAt_idx"
  ON "Inquiry"("propertyId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "Inquiry_organizationId_status_createdAt_idx"
  ON "Inquiry"("organizationId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "Inquiry_agentUserId_status_idx"
  ON "Inquiry"("agentUserId", "status");
CREATE INDEX IF NOT EXISTS "Inquiry_buyerUserId_createdAt_idx"
  ON "Inquiry"("buyerUserId", "createdAt");

ALTER TABLE "Inquiry" DROP CONSTRAINT IF EXISTS "Inquiry_propertyId_fkey";
ALTER TABLE "Inquiry"
  ADD CONSTRAINT "Inquiry_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Inquiry" DROP CONSTRAINT IF EXISTS "Inquiry_organizationId_fkey";
ALTER TABLE "Inquiry"
  ADD CONSTRAINT "Inquiry_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Inquiry" DROP CONSTRAINT IF EXISTS "Inquiry_agentUserId_fkey";
ALTER TABLE "Inquiry"
  ADD CONSTRAINT "Inquiry_agentUserId_fkey"
  FOREIGN KEY ("agentUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Inquiry" DROP CONSTRAINT IF EXISTS "Inquiry_buyerUserId_fkey";
ALTER TABLE "Inquiry"
  ADD CONSTRAINT "Inquiry_buyerUserId_fkey"
  FOREIGN KEY ("buyerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "QualifiedBuyerLead" (
  "id" TEXT NOT NULL,
  "inquiryId" TEXT,
  "propertyId" TEXT NOT NULL,
  "organizationId" TEXT,
  "agentUserId" TEXT,
  "buyerUserId" TEXT NOT NULL,
  "status" "QualifiedBuyerLeadStatus" NOT NULL DEFAULT 'PENDING_AGENT_REVIEW',
  "qualificationRuleVersion" TEXT NOT NULL,
  "qualifiedAt" TIMESTAMP(3),
  "contactVerification" "ContactVerificationLevel" NOT NULL DEFAULT 'UNVERIFIED',
  "contactVerified" BOOLEAN NOT NULL DEFAULT false,
  "budgetKnown" BOOLEAN NOT NULL DEFAULT false,
  "budgetBandMinCzk" INTEGER,
  "budgetBandMaxCzk" INTEGER,
  "financingStance" "BuyerFinancingStance" NOT NULL DEFAULT 'UNKNOWN',
  "timelineBand" TEXT,
  "anonymizedProfileSnapshot" JSONB,
  "profileShareConsentId" TEXT,
  "agentAcceptedAt" TIMESTAMP(3),
  "agentDeclinedAt" TIMESTAMP(3),
  "fullProfileRevealedAt" TIMESTAMP(3),
  "declineReason" TEXT,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QualifiedBuyerLead_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "QualifiedBuyerLead_inquiryId_key"
  ON "QualifiedBuyerLead"("inquiryId");
CREATE UNIQUE INDEX IF NOT EXISTS "QualifiedBuyerLead_profileShareConsentId_key"
  ON "QualifiedBuyerLead"("profileShareConsentId");
CREATE INDEX IF NOT EXISTS "QualifiedBuyerLead_propertyId_status_createdAt_idx"
  ON "QualifiedBuyerLead"("propertyId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "QualifiedBuyerLead_organizationId_status_createdAt_idx"
  ON "QualifiedBuyerLead"("organizationId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "QualifiedBuyerLead_agentUserId_status_idx"
  ON "QualifiedBuyerLead"("agentUserId", "status");
CREATE INDEX IF NOT EXISTS "QualifiedBuyerLead_buyerUserId_createdAt_idx"
  ON "QualifiedBuyerLead"("buyerUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "QualifiedBuyerLead_status_expiresAt_idx"
  ON "QualifiedBuyerLead"("status", "expiresAt");

ALTER TABLE "QualifiedBuyerLead" DROP CONSTRAINT IF EXISTS "QualifiedBuyerLead_inquiryId_fkey";
ALTER TABLE "QualifiedBuyerLead"
  ADD CONSTRAINT "QualifiedBuyerLead_inquiryId_fkey"
  FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "QualifiedBuyerLead" DROP CONSTRAINT IF EXISTS "QualifiedBuyerLead_propertyId_fkey";
ALTER TABLE "QualifiedBuyerLead"
  ADD CONSTRAINT "QualifiedBuyerLead_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QualifiedBuyerLead" DROP CONSTRAINT IF EXISTS "QualifiedBuyerLead_organizationId_fkey";
ALTER TABLE "QualifiedBuyerLead"
  ADD CONSTRAINT "QualifiedBuyerLead_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "QualifiedBuyerLead" DROP CONSTRAINT IF EXISTS "QualifiedBuyerLead_agentUserId_fkey";
ALTER TABLE "QualifiedBuyerLead"
  ADD CONSTRAINT "QualifiedBuyerLead_agentUserId_fkey"
  FOREIGN KEY ("agentUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "QualifiedBuyerLead" DROP CONSTRAINT IF EXISTS "QualifiedBuyerLead_buyerUserId_fkey";
ALTER TABLE "QualifiedBuyerLead"
  ADD CONSTRAINT "QualifiedBuyerLead_buyerUserId_fkey"
  FOREIGN KEY ("buyerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "QualifiedBuyerLeadActivity" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "note" TEXT,
  "meta" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QualifiedBuyerLeadActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "QualifiedBuyerLeadActivity_leadId_createdAt_idx"
  ON "QualifiedBuyerLeadActivity"("leadId", "createdAt");

ALTER TABLE "QualifiedBuyerLeadActivity" DROP CONSTRAINT IF EXISTS "QualifiedBuyerLeadActivity_leadId_fkey";
ALTER TABLE "QualifiedBuyerLeadActivity"
  ADD CONSTRAINT "QualifiedBuyerLeadActivity_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "QualifiedBuyerLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
