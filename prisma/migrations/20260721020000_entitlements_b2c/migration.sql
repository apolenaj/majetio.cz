-- B2C EntitlementService: lifecycle statuses, kinds, UsageRecord

DO $$ BEGIN
  CREATE TYPE "EntitlementKind" AS ENUM (
    'FREE_TIER',
    'DEEP_ANALYSIS',
    'BUYER_PASS',
    'INVESTOR_PRO',
    'LEGACY_PRODUCT'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EntitlementBillingInterval" AS ENUM ('NONE', 'MONTHLY', 'ANNUAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Extend EntitlementStatus
ALTER TYPE "EntitlementStatus" ADD VALUE IF NOT EXISTS 'TRIAL';
ALTER TYPE "EntitlementStatus" ADD VALUE IF NOT EXISTS 'PAST_DUE';
ALTER TYPE "EntitlementStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

ALTER TABLE "Entitlement" ADD COLUMN IF NOT EXISTS "propertyId" TEXT;
ALTER TABLE "Entitlement" ADD COLUMN IF NOT EXISTS "kind" "EntitlementKind" NOT NULL DEFAULT 'LEGACY_PRODUCT';
ALTER TABLE "Entitlement" ADD COLUMN IF NOT EXISTS "featureKeys" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Entitlement" ADD COLUMN IF NOT EXISTS "contentVersionKey" TEXT;
ALTER TABLE "Entitlement" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);
ALTER TABLE "Entitlement" ADD COLUMN IF NOT EXISTS "refreshAfter" TIMESTAMP(3);
ALTER TABLE "Entitlement" ADD COLUMN IF NOT EXISTS "gracePeriodEndsAt" TIMESTAMP(3);
ALTER TABLE "Entitlement" ADD COLUMN IF NOT EXISTS "billingInterval" "EntitlementBillingInterval" NOT NULL DEFAULT 'NONE';
ALTER TABLE "Entitlement" ADD COLUMN IF NOT EXISTS "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Entitlement" ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3);
ALTER TABLE "Entitlement" ADD COLUMN IF NOT EXISTS "currentPeriodStart" TIMESTAMP(3);
ALTER TABLE "Entitlement" ADD COLUMN IF NOT EXISTS "currentPeriodEnd" TIMESTAMP(3);
ALTER TABLE "Entitlement" ADD COLUMN IF NOT EXISTS "meta" JSONB;

CREATE INDEX IF NOT EXISTS "Entitlement_userId_kind_status_idx" ON "Entitlement"("userId", "kind", "status");
CREATE INDEX IF NOT EXISTS "Entitlement_userId_propertyId_kind_idx" ON "Entitlement"("userId", "propertyId", "kind");
CREATE INDEX IF NOT EXISTS "Entitlement_userId_status_expiresAt_idx" ON "Entitlement"("userId", "status", "expiresAt");
CREATE INDEX IF NOT EXISTS "Entitlement_status_gracePeriodEndsAt_idx" ON "Entitlement"("status", "gracePeriodEndsAt");

ALTER TABLE "Entitlement"
  DROP CONSTRAINT IF EXISTS "Entitlement_propertyId_fkey";
ALTER TABLE "Entitlement"
  ADD CONSTRAINT "Entitlement_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "UsageRecord" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "featureKey" TEXT NOT NULL,
  "metricKey" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "propertyId" TEXT,
  "scopeKey" TEXT NOT NULL DEFAULT '_',
  "windowKey" TEXT NOT NULL,
  "meta" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UsageRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UsageRecord_userId_featureKey_metricKey_windowKey_scopeKey_key"
  ON "UsageRecord"("userId", "featureKey", "metricKey", "windowKey", "scopeKey");
CREATE INDEX IF NOT EXISTS "UsageRecord_userId_featureKey_windowKey_idx"
  ON "UsageRecord"("userId", "featureKey", "windowKey");
CREATE INDEX IF NOT EXISTS "UsageRecord_userId_createdAt_idx"
  ON "UsageRecord"("userId", "createdAt");

ALTER TABLE "UsageRecord"
  DROP CONSTRAINT IF EXISTS "UsageRecord_userId_fkey";
ALTER TABLE "UsageRecord"
  ADD CONSTRAINT "UsageRecord_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UsageRecord"
  DROP CONSTRAINT IF EXISTS "UsageRecord_propertyId_fkey";
ALTER TABLE "UsageRecord"
  ADD CONSTRAINT "UsageRecord_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- B2C catalog plans (idempotent)
INSERT INTO "PricingPlan" (
  "id", "key", "versionKey", "name", "description", "billingType", "status",
  "priceGrossMinor", "currency", "vatRateBp", "entitlesProductKey",
  "limits", "features", "sortOrder", "activeFrom", "createdAt", "updatedAt"
)
VALUES
(
  'plan_deep_v2026_07',
  'deep_analysis',
  'v2026.07',
  'Deep Analysis',
  'Jednorázová hluboká analýza konkrétní nemovitosti (časově omezený refresh).',
  'ONE_TIME',
  'ACTIVE',
  499000,
  'CZK',
  2100,
  'deep_analysis',
  '{"refreshDays": 90, "propertiesPerPurchase": 1}'::jsonb,
  '["DEEP_ANALYSIS", "BASIC_SCORE", "BASIC_RISKS", "FULL_SCENARIOS"]'::jsonb,
  25,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'plan_buyer_pass_v2026_07',
  'buyer_pass',
  'v2026.07',
  'Buyer Pass',
  'Časově omezený přístup pro kupující — není automatické předplatné.',
  'ONE_TIME',
  'ACTIVE',
  149900,
  'CZK',
  2100,
  'buyer_pass',
  '{"durationDays": 30, "propertyViewsPerDay": 40, "exportsPerDay": 5, "deepAnalysesIncluded": 2}'::jsonb,
  '["DEEP_ANALYSIS", "ADVANCED_COMPARISON", "BASIC_SCORE", "BASIC_RISKS", "FULL_SCENARIOS"]'::jsonb,
  30,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'plan_investor_pro_m_v2026_07',
  'investor_pro_monthly',
  'v2026.07',
  'Investor Pro (měsíční)',
  'Členství Investor Pro — lifecycle active/trial/past_due/cancelled/expired.',
  'SUBSCRIPTION',
  'ACTIVE',
  99900,
  'CZK',
  2100,
  'investor_pro',
  '{"billingInterval": "MONTHLY", "trialDays": 7, "graceDays": 3, "propertyViewsPerDay": 200}'::jsonb,
  '["DEEP_ANALYSIS", "ADVANCED_COMPARISON", "INVESTOR_TOOLS", "BASIC_SCORE", "BASIC_RISKS", "FULL_SCENARIOS"]'::jsonb,
  40,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'plan_investor_pro_y_v2026_07',
  'investor_pro_annual',
  'v2026.07',
  'Investor Pro (roční)',
  'Roční Investor Pro s grace period.',
  'SUBSCRIPTION',
  'ACTIVE',
  999000,
  'CZK',
  2100,
  'investor_pro',
  '{"billingInterval": "ANNUAL", "trialDays": 14, "graceDays": 7, "propertyViewsPerDay": 200}'::jsonb,
  '["DEEP_ANALYSIS", "ADVANCED_COMPARISON", "INVESTOR_TOOLS", "BASIC_SCORE", "BASIC_RISKS", "FULL_SCENARIOS"]'::jsonb,
  45,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("key", "versionKey") DO NOTHING;
