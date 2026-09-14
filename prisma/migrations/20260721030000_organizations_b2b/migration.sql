-- B2B Organizations: agents, agencies, developers + listing quota on downgrade

DO $$ BEGIN
  CREATE TYPE "OrganizationType" AS ENUM (
    'REAL_ESTATE_AGENT',
    'AGENCY',
    'DEVELOPER',
    'PARTNER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "OrganizationMemberRole" AS ENUM ('OWNER', 'ADMIN', 'AGENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ListingVerificationStatus" AS ENUM (
    'UNVERIFIED',
    'IDENTITY_VERIFIED',
    'ORGANIZATION_VERIFIED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ListingQuotaState" AS ENUM ('WITHIN_LIMIT', 'OVER_LIMIT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ListingOwnerKind" AS ENUM ('AGENT', 'AGENCY', 'DEVELOPER', 'PARTNER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "OrganizationPlanStatus" AS ENUM (
    'TRIAL',
    'ACTIVE',
    'PAST_DUE',
    'CANCELLED',
    'EXPIRED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "OrganizationPlanChangeType" AS ENUM (
    'INITIAL',
    'UPGRADE',
    'DOWNGRADE',
    'RENEWAL',
    'CANCEL'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Organization" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "OrganizationType" NOT NULL,
  "verificationStatus" "ListingVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
  "identityVerifiedAt" TIMESTAMP(3),
  "organizationVerifiedAt" TIMESTAMP(3),
  "planKey" TEXT NOT NULL DEFAULT 'agent_free',
  "planStatus" "OrganizationPlanStatus" NOT NULL DEFAULT 'ACTIVE',
  "pricingPlanId" TEXT,
  "planPeriodStart" TIMESTAMP(3),
  "planPeriodEnd" TIMESTAMP(3),
  "listingsLimit" INTEGER NOT NULL DEFAULT 5,
  "seatsLimit" INTEGER NOT NULL DEFAULT 1,
  "billingEmail" TEXT,
  "ico" TEXT,
  "dic" TEXT,
  "website" TEXT,
  "meta" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Organization_slug_key" ON "Organization"("slug");
CREATE INDEX IF NOT EXISTS "Organization_type_planKey_idx" ON "Organization"("type", "planKey");
CREATE INDEX IF NOT EXISTS "Organization_planStatus_idx" ON "Organization"("planStatus");
CREATE INDEX IF NOT EXISTS "Organization_verificationStatus_idx" ON "Organization"("verificationStatus");
CREATE INDEX IF NOT EXISTS "Organization_pricingPlanId_idx" ON "Organization"("pricingPlanId");

ALTER TABLE "Organization"
  DROP CONSTRAINT IF EXISTS "Organization_pricingPlanId_fkey";
ALTER TABLE "Organization"
  ADD CONSTRAINT "Organization_pricingPlanId_fkey"
  FOREIGN KEY ("pricingPlanId") REFERENCES "PricingPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "OrganizationMember" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "OrganizationMemberRole" NOT NULL DEFAULT 'AGENT',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "joinedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "OrganizationMember_organizationId_userId_key"
  ON "OrganizationMember"("organizationId", "userId");
CREATE INDEX IF NOT EXISTS "OrganizationMember_userId_active_idx"
  ON "OrganizationMember"("userId", "active");
CREATE INDEX IF NOT EXISTS "OrganizationMember_organizationId_role_idx"
  ON "OrganizationMember"("organizationId", "role");

ALTER TABLE "OrganizationMember"
  DROP CONSTRAINT IF EXISTS "OrganizationMember_organizationId_fkey";
ALTER TABLE "OrganizationMember"
  ADD CONSTRAINT "OrganizationMember_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrganizationMember"
  DROP CONSTRAINT IF EXISTS "OrganizationMember_userId_fkey";
ALTER TABLE "OrganizationMember"
  ADD CONSTRAINT "OrganizationMember_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "OrganizationPlanChange" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "changeType" "OrganizationPlanChangeType" NOT NULL,
  "fromPlanKey" TEXT,
  "toPlanKey" TEXT NOT NULL,
  "fromListingsLimit" INTEGER,
  "toListingsLimit" INTEGER,
  "activeListingsAtChange" INTEGER NOT NULL DEFAULT 0,
  "listingsMarkedOverLimit" INTEGER NOT NULL DEFAULT 0,
  "listingsRestoredWithinLimit" INTEGER NOT NULL DEFAULT 0,
  "actorUserId" TEXT,
  "actionRequired" JSONB,
  "meta" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrganizationPlanChange_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "OrganizationPlanChange_organizationId_createdAt_idx"
  ON "OrganizationPlanChange"("organizationId", "createdAt");
CREATE INDEX IF NOT EXISTS "OrganizationPlanChange_changeType_createdAt_idx"
  ON "OrganizationPlanChange"("changeType", "createdAt");

ALTER TABLE "OrganizationPlanChange"
  DROP CONSTRAINT IF EXISTS "OrganizationPlanChange_organizationId_fkey";
ALTER TABLE "OrganizationPlanChange"
  ADD CONSTRAINT "OrganizationPlanChange_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrganizationPlanChange"
  DROP CONSTRAINT IF EXISTS "OrganizationPlanChange_actorUserId_fkey";
ALTER TABLE "OrganizationPlanChange"
  ADD CONSTRAINT "OrganizationPlanChange_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Property listing ownership + verification + quota
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "listedByUserId" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "listingOwnerKind" "ListingOwnerKind";
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "listingVerificationStatus" "ListingVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED';
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "listingQuotaState" "ListingQuotaState" NOT NULL DEFAULT 'WITHIN_LIMIT';
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "overLimitAt" TIMESTAMP(3);
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "overLimitReason" TEXT;

CREATE INDEX IF NOT EXISTS "Property_organizationId_listingQuotaState_idx"
  ON "Property"("organizationId", "listingQuotaState");
CREATE INDEX IF NOT EXISTS "Property_organizationId_status_idx"
  ON "Property"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "Property_listedByUserId_idx" ON "Property"("listedByUserId");
CREATE INDEX IF NOT EXISTS "Property_listingVerificationStatus_idx"
  ON "Property"("listingVerificationStatus");
CREATE INDEX IF NOT EXISTS "Property_listingQuotaState_status_idx"
  ON "Property"("listingQuotaState", "status");

ALTER TABLE "Property"
  DROP CONSTRAINT IF EXISTS "Property_organizationId_fkey";
ALTER TABLE "Property"
  ADD CONSTRAINT "Property_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Property"
  DROP CONSTRAINT IF EXISTS "Property_listedByUserId_fkey";
ALTER TABLE "Property"
  ADD CONSTRAINT "Property_listedByUserId_fkey"
  FOREIGN KEY ("listedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- B2B PricingPlan seeds
INSERT INTO "PricingPlan" (
  "id", "key", "versionKey", "name", "description", "billingType", "status",
  "priceGrossMinor", "currency", "vatRateBp", "entitlesProductKey",
  "limits", "features", "sortOrder", "activeFrom", "createdAt", "updatedAt"
)
VALUES
(
  'plan_agent_free_v2026_07',
  'agent_free',
  'v2026.07',
  'Agent Free',
  'Základní B2B tarif pro makléře — až 5 aktivních nabídek.',
  'SUBSCRIPTION',
  'ACTIVE',
  0,
  'CZK',
  2100,
  'agent_free',
  '{"maxActiveListings": 5, "seats": 1, "audience": "b2b"}'::jsonb,
  '["LISTING_BASIC", "LEAD_INBOX"]'::jsonb,
  200,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'plan_agent_pro_v2026_07',
  'agent_pro',
  'v2026.07',
  'Agent Pro',
  'Pro makléře s vyšším limitem nabídek a ověřením identity.',
  'SUBSCRIPTION',
  'ACTIVE',
  149900,
  'CZK',
  2100,
  'agent_pro',
  '{"maxActiveListings": 40, "seats": 1, "audience": "b2b"}'::jsonb,
  '["LISTING_BASIC", "LISTING_PROMO", "LEAD_INBOX", "IDENTITY_BADGE"]'::jsonb,
  210,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'plan_agency_growth_v2026_07',
  'agency_growth',
  'v2026.07',
  'Agency Growth',
  'Růstový tarif pro realitní kanceláře — více seatů a nabídek.',
  'SUBSCRIPTION',
  'ACTIVE',
  499900,
  'CZK',
  2100,
  'agency_growth',
  '{"maxActiveListings": 200, "seats": 15, "audience": "b2b"}'::jsonb,
  '["LISTING_BASIC", "LISTING_PROMO", "LEAD_INBOX", "ORG_BADGE", "TEAM_ROLES"]'::jsonb,
  220,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'plan_developer_standard_v2026_07',
  'developer_standard',
  'v2026.07',
  'Developer Standard',
  'Model pro developery — projekty a jednotky pod jednou organizací.',
  'SUBSCRIPTION',
  'ACTIVE',
  999900,
  'CZK',
  2100,
  'developer_standard',
  '{"maxActiveListings": 500, "seats": 25, "audience": "b2b", "projectsMax": 20}'::jsonb,
  '["LISTING_BASIC", "LISTING_PROMO", "LEAD_INBOX", "ORG_BADGE", "PROJECT_UNITS"]'::jsonb,
  230,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("key", "versionKey") DO NOTHING;
