-- Phase 4: B2B CRM / Broker Dashboard — analytics, SLA, CRM expected value

ALTER TABLE "OrganizationMember" ADD COLUMN IF NOT EXISTS "displayName" TEXT;
ALTER TABLE "OrganizationMember" ADD COLUMN IF NOT EXISTS "phonePublic" TEXT;
ALTER TABLE "OrganizationMember" ADD COLUMN IF NOT EXISTS "bio" TEXT;
ALTER TABLE "OrganizationMember" ADD COLUMN IF NOT EXISTS "onboardingStep" TEXT DEFAULT 'profile';
ALTER TABLE "OrganizationMember" ADD COLUMN IF NOT EXISTS "onboardingCompletedAt" TIMESTAMP(3);

ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "ownerUserId" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "expectedValueMinor" INTEGER;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "expectedValueCurrency" TEXT NOT NULL DEFAULT 'CZK';
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "expectedValueNote" TEXT;

CREATE INDEX IF NOT EXISTS "Lead_ownerUserId_status_nextActionDueAt_idx"
  ON "Lead"("ownerUserId", "status", "nextActionDueAt");

DO $$ BEGIN
  ALTER TABLE "Lead" ADD CONSTRAINT "Lead_ownerUserId_fkey"
    FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "QualifiedBuyerLead" ADD COLUMN IF NOT EXISTS "slaDueAt" TIMESTAMP(3);
ALTER TABLE "QualifiedBuyerLead" ADD COLUMN IF NOT EXISTS "firstResponseAt" TIMESTAMP(3);
ALTER TABLE "QualifiedBuyerLead" ADD COLUMN IF NOT EXISTS "slaBreachedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "QualifiedBuyerLead_organizationId_slaDueAt_idx"
  ON "QualifiedBuyerLead"("organizationId", "slaDueAt");
CREATE INDEX IF NOT EXISTS "QualifiedBuyerLead_agentUserId_slaDueAt_idx"
  ON "QualifiedBuyerLead"("agentUserId", "slaDueAt");

CREATE TABLE IF NOT EXISTS "ListingAnalyticsDaily" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "day" DATE NOT NULL,
  "impressions" INTEGER NOT NULL DEFAULT 0,
  "saves" INTEGER NOT NULL DEFAULT 0,
  "inquiries" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ListingAnalyticsDaily_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ListingAnalyticsDaily_propertyId_day_key"
  ON "ListingAnalyticsDaily"("propertyId", "day");
CREATE INDEX IF NOT EXISTS "ListingAnalyticsDaily_organizationId_day_idx"
  ON "ListingAnalyticsDaily"("organizationId", "day");
CREATE INDEX IF NOT EXISTS "ListingAnalyticsDaily_propertyId_day_idx"
  ON "ListingAnalyticsDaily"("propertyId", "day");

DO $$ BEGIN
  ALTER TABLE "ListingAnalyticsDaily" ADD CONSTRAINT "ListingAnalyticsDaily_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ListingAnalyticsDaily" ADD CONSTRAINT "ListingAnalyticsDaily_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
