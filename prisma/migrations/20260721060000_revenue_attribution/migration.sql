-- B2B lead monetization: billing modes, SuccessFee, RevenueEvent, attribution, disputes

DO $$ BEGIN
  CREATE TYPE "OrganizationLeadBillingMode" AS ENUM ('PAY_PER_LEAD', 'SUCCESS_FEE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SuccessFeeStatus" AS ENUM (
    'POTENTIAL',
    'PENDING_VERIFICATION',
    'VERIFIED',
    'INVOICED',
    'PAID',
    'DISPUTED',
    'CANCELLED',
    'WRITTEN_OFF'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "RevenueEventSourceType" AS ENUM (
    'SUBSCRIPTION',
    'ANALYSIS',
    'LISTING_BOOST',
    'PAY_PER_LEAD',
    'SUCCESS_FEE',
    'MORTGAGE_PARTNER',
    'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "RevenueEventStatus" AS ENUM (
    'PENDING',
    'RECOGNIZED',
    'REVERSED',
    'DISPUTED',
    'EXCLUDED_DOUBLE_COUNT'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "LeadAttributionStatus" AS ENUM (
    'ATTRIBUTED',
    'MULTI_SOURCE_REVIEW',
    'UNATTRIBUTED',
    'REJECTED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "LeadDisputeStatus" AS ENUM (
    'OPEN',
    'EVIDENCE_REQUIRED',
    'UNDER_REVIEW',
    'UPHELD',
    'REJECTED',
    'WITHDRAWN'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "LeadDisputeReason" AS ENUM (
    'DUPLICATE',
    'ALREADY_CLIENT',
    'OUT_OF_AREA',
    'FAKE_CONTACT',
    'NOT_INTERESTED',
    'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Organization"
  ADD COLUMN IF NOT EXISTS "leadBillingMode" "OrganizationLeadBillingMode" NOT NULL DEFAULT 'PAY_PER_LEAD';
ALTER TABLE "Organization"
  ADD COLUMN IF NOT EXISTS "payPerLeadPriceMinor" INTEGER NOT NULL DEFAULT 49900;
ALTER TABLE "Organization"
  ADD COLUMN IF NOT EXISTS "successFeeBps" INTEGER NOT NULL DEFAULT 1000;
ALTER TABLE "Organization"
  ADD COLUMN IF NOT EXISTS "attributionWindowDays" INTEGER NOT NULL DEFAULT 30;

CREATE TABLE IF NOT EXISTS "RevenueEvent" (
  "id" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "sourceType" "RevenueEventSourceType" NOT NULL,
  "sourceEntityType" TEXT NOT NULL,
  "sourceEntityId" TEXT NOT NULL,
  "organizationId" TEXT,
  "userId" TEXT,
  "amountGrossMinor" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'CZK',
  "status" "RevenueEventStatus" NOT NULL DEFAULT 'PENDING',
  "recognizedAt" TIMESTAMP(3),
  "reversedAt" TIMESTAMP(3),
  "reverseReason" TEXT,
  "orderId" TEXT,
  "meta" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RevenueEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RevenueEvent_idempotencyKey_key"
  ON "RevenueEvent"("idempotencyKey");
CREATE UNIQUE INDEX IF NOT EXISTS "RevenueEvent_sourceType_sourceEntityId_key"
  ON "RevenueEvent"("sourceType", "sourceEntityId");
CREATE INDEX IF NOT EXISTS "RevenueEvent_organizationId_status_recognizedAt_idx"
  ON "RevenueEvent"("organizationId", "status", "recognizedAt");
CREATE INDEX IF NOT EXISTS "RevenueEvent_sourceType_status_createdAt_idx"
  ON "RevenueEvent"("sourceType", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "RevenueEvent_orderId_idx" ON "RevenueEvent"("orderId");

ALTER TABLE "RevenueEvent" DROP CONSTRAINT IF EXISTS "RevenueEvent_organizationId_fkey";
ALTER TABLE "RevenueEvent"
  ADD CONSTRAINT "RevenueEvent_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "SuccessFeeRecord" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "qualifiedBuyerLeadId" TEXT,
  "propertyId" TEXT,
  "agentUserId" TEXT,
  "status" "SuccessFeeStatus" NOT NULL DEFAULT 'POTENTIAL',
  "brokerCommissionGrossMinor" INTEGER NOT NULL,
  "feeBps" INTEGER NOT NULL,
  "feeAmountMinor" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'CZK',
  "evidenceMeta" JSONB,
  "verifiedAt" TIMESTAMP(3),
  "verifiedByUserId" TEXT,
  "invoicedAt" TIMESTAMP(3),
  "invoiceRef" TEXT,
  "paidAt" TIMESTAMP(3),
  "revenueEventId" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SuccessFeeRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SuccessFeeRecord_revenueEventId_key"
  ON "SuccessFeeRecord"("revenueEventId");
CREATE INDEX IF NOT EXISTS "SuccessFeeRecord_organizationId_status_createdAt_idx"
  ON "SuccessFeeRecord"("organizationId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "SuccessFeeRecord_qualifiedBuyerLeadId_idx"
  ON "SuccessFeeRecord"("qualifiedBuyerLeadId");
CREATE INDEX IF NOT EXISTS "SuccessFeeRecord_status_verifiedAt_idx"
  ON "SuccessFeeRecord"("status", "verifiedAt");

ALTER TABLE "SuccessFeeRecord" DROP CONSTRAINT IF EXISTS "SuccessFeeRecord_organizationId_fkey";
ALTER TABLE "SuccessFeeRecord"
  ADD CONSTRAINT "SuccessFeeRecord_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SuccessFeeRecord" DROP CONSTRAINT IF EXISTS "SuccessFeeRecord_qualifiedBuyerLeadId_fkey";
ALTER TABLE "SuccessFeeRecord"
  ADD CONSTRAINT "SuccessFeeRecord_qualifiedBuyerLeadId_fkey"
  FOREIGN KEY ("qualifiedBuyerLeadId") REFERENCES "QualifiedBuyerLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SuccessFeeRecord" DROP CONSTRAINT IF EXISTS "SuccessFeeRecord_verifiedByUserId_fkey";
ALTER TABLE "SuccessFeeRecord"
  ADD CONSTRAINT "SuccessFeeRecord_verifiedByUserId_fkey"
  FOREIGN KEY ("verifiedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SuccessFeeRecord" DROP CONSTRAINT IF EXISTS "SuccessFeeRecord_revenueEventId_fkey";
ALTER TABLE "SuccessFeeRecord"
  ADD CONSTRAINT "SuccessFeeRecord_revenueEventId_fkey"
  FOREIGN KEY ("revenueEventId") REFERENCES "RevenueEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "LeadAttribution" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "qualifiedBuyerLeadId" TEXT,
  "mortgageLeadId" TEXT,
  "status" "LeadAttributionStatus" NOT NULL DEFAULT 'UNATTRIBUTED',
  "sources" JSONB NOT NULL,
  "primarySourceKey" TEXT,
  "windowStartsAt" TIMESTAMP(3) NOT NULL,
  "windowEndsAt" TIMESTAMP(3) NOT NULL,
  "attributedAt" TIMESTAMP(3),
  "reviewNotes" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "reviewedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeadAttribution_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LeadAttribution_organizationId_status_createdAt_idx"
  ON "LeadAttribution"("organizationId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "LeadAttribution_qualifiedBuyerLeadId_idx"
  ON "LeadAttribution"("qualifiedBuyerLeadId");
CREATE INDEX IF NOT EXISTS "LeadAttribution_mortgageLeadId_idx"
  ON "LeadAttribution"("mortgageLeadId");
CREATE INDEX IF NOT EXISTS "LeadAttribution_status_windowEndsAt_idx"
  ON "LeadAttribution"("status", "windowEndsAt");

ALTER TABLE "LeadAttribution" DROP CONSTRAINT IF EXISTS "LeadAttribution_organizationId_fkey";
ALTER TABLE "LeadAttribution"
  ADD CONSTRAINT "LeadAttribution_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LeadAttribution" DROP CONSTRAINT IF EXISTS "LeadAttribution_qualifiedBuyerLeadId_fkey";
ALTER TABLE "LeadAttribution"
  ADD CONSTRAINT "LeadAttribution_qualifiedBuyerLeadId_fkey"
  FOREIGN KEY ("qualifiedBuyerLeadId") REFERENCES "QualifiedBuyerLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "LeadDispute" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "qualifiedBuyerLeadId" TEXT NOT NULL,
  "openedByUserId" TEXT NOT NULL,
  "status" "LeadDisputeStatus" NOT NULL DEFAULT 'OPEN',
  "reason" "LeadDisputeReason" NOT NULL,
  "agentStatement" TEXT NOT NULL,
  "evidenceRequired" BOOLEAN NOT NULL DEFAULT true,
  "evidenceSubmittedAt" TIMESTAMP(3),
  "evidenceMeta" JSONB,
  "reviewNotes" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "resolvedByUserId" TEXT,
  "revenueEventId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeadDispute_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LeadDispute_organizationId_status_createdAt_idx"
  ON "LeadDispute"("organizationId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "LeadDispute_qualifiedBuyerLeadId_status_idx"
  ON "LeadDispute"("qualifiedBuyerLeadId", "status");
CREATE INDEX IF NOT EXISTS "LeadDispute_openedByUserId_createdAt_idx"
  ON "LeadDispute"("openedByUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "LeadDispute_status_createdAt_idx"
  ON "LeadDispute"("status", "createdAt");

ALTER TABLE "LeadDispute" DROP CONSTRAINT IF EXISTS "LeadDispute_organizationId_fkey";
ALTER TABLE "LeadDispute"
  ADD CONSTRAINT "LeadDispute_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LeadDispute" DROP CONSTRAINT IF EXISTS "LeadDispute_qualifiedBuyerLeadId_fkey";
ALTER TABLE "LeadDispute"
  ADD CONSTRAINT "LeadDispute_qualifiedBuyerLeadId_fkey"
  FOREIGN KEY ("qualifiedBuyerLeadId") REFERENCES "QualifiedBuyerLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LeadDispute" DROP CONSTRAINT IF EXISTS "LeadDispute_openedByUserId_fkey";
ALTER TABLE "LeadDispute"
  ADD CONSTRAINT "LeadDispute_openedByUserId_fkey"
  FOREIGN KEY ("openedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LeadDispute" DROP CONSTRAINT IF EXISTS "LeadDispute_resolvedByUserId_fkey";
ALTER TABLE "LeadDispute"
  ADD CONSTRAINT "LeadDispute_resolvedByUserId_fkey"
  FOREIGN KEY ("resolvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
