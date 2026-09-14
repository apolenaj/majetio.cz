-- Listing Promotion Engine (Boost) — sponsored placements ONLY
-- FIREWALL: never affects Majetio Score, valuation, risk, or organic ranking

DO $$ BEGIN
  CREATE TYPE "ListingModerationStatus" AS ENUM ('CLEAR', 'RESTRICTED', 'BANNED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ListingBoostProduct" AS ENUM ('BOOST_7_DAYS', 'BOOST_30_DAYS');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ListingBoostStatus" AS ENUM (
    'PENDING_PAYMENT',
    'ACTIVE',
    'EXPIRED',
    'CANCELLED',
    'REVOKED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Property"
  ADD COLUMN IF NOT EXISTS "listingModerationStatus" "ListingModerationStatus" NOT NULL DEFAULT 'CLEAR';

CREATE INDEX IF NOT EXISTS "Property_listingModerationStatus_status_idx"
  ON "Property"("listingModerationStatus", "status");

CREATE TABLE IF NOT EXISTS "ListingBoost" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "organizationId" TEXT,
  "purchasedByUserId" TEXT NOT NULL,
  "orderId" TEXT,
  "product" "ListingBoostProduct" NOT NULL,
  "productKey" TEXT NOT NULL,
  "status" "ListingBoostStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "placementWeight" INTEGER NOT NULL DEFAULT 100,
  "sponsoredLabel" TEXT NOT NULL DEFAULT 'Sponzorováno',
  "eligibilitySnapshot" JSONB,
  "meta" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ListingBoost_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ListingBoost_propertyId_status_endsAt_idx"
  ON "ListingBoost"("propertyId", "status", "endsAt");
CREATE INDEX IF NOT EXISTS "ListingBoost_status_startsAt_endsAt_idx"
  ON "ListingBoost"("status", "startsAt", "endsAt");
CREATE INDEX IF NOT EXISTS "ListingBoost_organizationId_status_idx"
  ON "ListingBoost"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "ListingBoost_orderId_idx" ON "ListingBoost"("orderId");
CREATE INDEX IF NOT EXISTS "ListingBoost_productKey_status_idx"
  ON "ListingBoost"("productKey", "status");

ALTER TABLE "ListingBoost"
  DROP CONSTRAINT IF EXISTS "ListingBoost_propertyId_fkey";
ALTER TABLE "ListingBoost"
  ADD CONSTRAINT "ListingBoost_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ListingBoost"
  DROP CONSTRAINT IF EXISTS "ListingBoost_organizationId_fkey";
ALTER TABLE "ListingBoost"
  ADD CONSTRAINT "ListingBoost_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ListingBoost"
  DROP CONSTRAINT IF EXISTS "ListingBoost_purchasedByUserId_fkey";
ALTER TABLE "ListingBoost"
  ADD CONSTRAINT "ListingBoost_purchasedByUserId_fkey"
  FOREIGN KEY ("purchasedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Commerce products (Boost 7 / Boost 30)
INSERT INTO "PricingPlan" (
  "id", "key", "versionKey", "name", "description", "billingType", "status",
  "priceGrossMinor", "currency", "vatRateBp", "entitlesProductKey",
  "limits", "features", "sortOrder", "activeFrom", "createdAt", "updatedAt"
)
VALUES
(
  'plan_boost_7_v2026_07',
  'boost_7_days',
  'v2026.07',
  'Boost 7 dní',
  'Placená propagace inzerátu na 7 dní. Neovlivňuje Majetio Score ani organický ranking — vždy označené jako Sponzorováno.',
  'ONE_TIME',
  'ACTIVE',
  49900,
  'CZK',
  2100,
  'boost_7_days',
  '{"durationDays": 7, "audience": "listing_boost", "affectsOrganicRanking": false, "affectsMajetioScore": false}'::jsonb,
  '["SPONSORED_PLACEMENT", "SPONSORED_LABEL_REQUIRED"]'::jsonb,
  300,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'plan_boost_30_v2026_07',
  'boost_30_days',
  'v2026.07',
  'Boost 30 dní',
  'Placená propagace inzerátu na 30 dní. Neovlivňuje Majetio Score ani organický ranking — vždy označené jako Sponzorováno.',
  'ONE_TIME',
  'ACTIVE',
  149900,
  'CZK',
  2100,
  'boost_30_days',
  '{"durationDays": 30, "audience": "listing_boost", "affectsOrganicRanking": false, "affectsMajetioScore": false}'::jsonb,
  '["SPONSORED_PLACEMENT", "SPONSORED_LABEL_REQUIRED"]'::jsonb,
  310,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("key", "versionKey") DO NOTHING;
