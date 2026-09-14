-- Prompt 17.3: Property taxonomy (VILLA/TOWNHOUSE), listing channel, off-plan

ALTER TYPE "PropertyType" ADD VALUE IF NOT EXISTS 'VILLA';
ALTER TYPE "PropertyType" ADD VALUE IF NOT EXISTS 'TOWNHOUSE';

DO $$ BEGIN
  CREATE TYPE "ListingMarketChannel" AS ENUM ('PRIMARY_NEW_BUILD', 'SECONDARY_RESALE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "OffPlanConstructionStatus" AS ENUM (
    'ANNOUNCED',
    'UNDER_CONSTRUCTION',
    'COMPLETED',
    'HANDED_OVER',
    'UNKNOWN'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Property"
  ADD COLUMN IF NOT EXISTS "marketCode" TEXT NOT NULL DEFAULT 'CZ',
  ADD COLUMN IF NOT EXISTS "listingMarketChannel" "ListingMarketChannel" NOT NULL DEFAULT 'SECONDARY_RESALE',
  ADD COLUMN IF NOT EXISTS "isOffPlan" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "constructionStatus" "OffPlanConstructionStatus" NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN IF NOT EXISTS "expectedCompletion" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "developerName" TEXT,
  ADD COLUMN IF NOT EXISTS "projectName" TEXT,
  ADD COLUMN IF NOT EXISTS "constructionProgressPct" INTEGER;

CREATE INDEX IF NOT EXISTS "Property_marketCode_status_idx" ON "Property"("marketCode", "status");
CREATE INDEX IF NOT EXISTS "Property_listingMarketChannel_isOffPlan_idx" ON "Property"("listingMarketChannel", "isOffPlan");
CREATE INDEX IF NOT EXISTS "Property_marketCode_propertyType_listingMarketChannel_idx" ON "Property"("marketCode", "propertyType", "listingMarketChannel");
