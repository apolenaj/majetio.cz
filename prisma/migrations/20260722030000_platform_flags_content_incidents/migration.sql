-- Prompt 6: Feature flags, CMS content, incidents, regulatory review metadata

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FeatureFlagScope') THEN
    CREATE TYPE "FeatureFlagScope" AS ENUM ('GLOBAL', 'MARKET', 'USER_PERCENTAGE');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CmsContentKind') THEN
    CREATE TYPE "CmsContentKind" AS ENUM ('GUIDE', 'FAQ', 'METHODOLOGY', 'REGULATORY');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CmsContentStatus') THEN
    CREATE TYPE "CmsContentStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ContentTranslationStatus') THEN
    CREATE TYPE "ContentTranslationStatus" AS ENUM ('MACHINE_DRAFT', 'REVIEWED', 'APPROVED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'IncidentCategory') THEN
    CREATE TYPE "IncidentCategory" AS ENUM ('DATA', 'SECURITY', 'PAYMENTS', 'AVAILABILITY');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'IncidentStatus') THEN
    CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'MITIGATED', 'RESOLVED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'IncidentSeverity') THEN
    CREATE TYPE "IncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
  END IF;
END $$;

ALTER TABLE "AppConfiguration" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'BUSINESS_LIMIT';

ALTER TABLE "RegulatoryRule" ADD COLUMN IF NOT EXISTS "reviewRequiredAt" TIMESTAMP(3);
ALTER TABLE "RegulatoryRule" ADD COLUMN IF NOT EXISTS "sourceUrl" TEXT;
ALTER TABLE "RegulatoryRule" ADD COLUMN IF NOT EXISTS "sourceLabel" TEXT;
CREATE INDEX IF NOT EXISTS "RegulatoryRule_reviewRequiredAt_idx" ON "RegulatoryRule"("reviewRequiredAt");

CREATE TABLE IF NOT EXISTS "FeatureFlag" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "scope" "FeatureFlagScope" NOT NULL DEFAULT 'GLOBAL',
  "marketCode" TEXT NOT NULL DEFAULT '',
  "percentage" INTEGER,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "isKillSwitch" BOOLEAN NOT NULL DEFAULT false,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "FeatureFlag_key_scope_marketCode_key"
  ON "FeatureFlag"("key", "scope", "marketCode");
CREATE INDEX IF NOT EXISTS "FeatureFlag_isKillSwitch_enabled_idx" ON "FeatureFlag"("isKillSwitch", "enabled");
CREATE INDEX IF NOT EXISTS "FeatureFlag_scope_marketCode_idx" ON "FeatureFlag"("scope", "marketCode");
CREATE INDEX IF NOT EXISTS "FeatureFlag_key_idx" ON "FeatureFlag"("key");

CREATE TABLE IF NOT EXISTS "FeatureFlagChange" (
  "id" TEXT NOT NULL,
  "featureFlagId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "reason" TEXT NOT NULL,
  "oldEnabled" BOOLEAN NOT NULL,
  "newEnabled" BOOLEAN NOT NULL,
  "oldValueJson" JSONB,
  "newValueJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FeatureFlagChange_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FeatureFlagChange_featureFlagId_createdAt_idx"
  ON "FeatureFlagChange"("featureFlagId", "createdAt");
CREATE INDEX IF NOT EXISTS "FeatureFlagChange_actorUserId_createdAt_idx"
  ON "FeatureFlagChange"("actorUserId", "createdAt");
DO $$ BEGIN
  ALTER TABLE "FeatureFlagChange"
    ADD CONSTRAINT "FeatureFlagChange_featureFlagId_fkey"
    FOREIGN KEY ("featureFlagId") REFERENCES "FeatureFlag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "CmsContent" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "kind" "CmsContentKind" NOT NULL,
  "status" "CmsContentStatus" NOT NULL DEFAULT 'DRAFT',
  "title" TEXT NOT NULL,
  "bodyMarkdown" TEXT NOT NULL,
  "marketCode" TEXT NOT NULL DEFAULT 'CZ',
  "locale" TEXT NOT NULL DEFAULT 'cs-CZ',
  "isRegulatory" BOOLEAN NOT NULL DEFAULT false,
  "sourceLabel" TEXT,
  "sourceUrl" TEXT,
  "reviewRequiredAt" TIMESTAMP(3),
  "lastReviewedAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "createdByUserId" TEXT,
  "updatedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CmsContent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CmsContent_slug_locale_marketCode_key"
  ON "CmsContent"("slug", "locale", "marketCode");
CREATE INDEX IF NOT EXISTS "CmsContent_status_kind_idx" ON "CmsContent"("status", "kind");
CREATE INDEX IF NOT EXISTS "CmsContent_isRegulatory_reviewRequiredAt_idx"
  ON "CmsContent"("isRegulatory", "reviewRequiredAt");
CREATE INDEX IF NOT EXISTS "CmsContent_marketCode_status_idx" ON "CmsContent"("marketCode", "status");

CREATE TABLE IF NOT EXISTS "ContentTranslation" (
  "id" TEXT NOT NULL,
  "contentId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "status" "ContentTranslationStatus" NOT NULL DEFAULT 'MACHINE_DRAFT',
  "title" TEXT NOT NULL,
  "bodyMarkdown" TEXT NOT NULL,
  "reviewedAt" TIMESTAMP(3),
  "reviewedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContentTranslation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ContentTranslation_contentId_locale_key"
  ON "ContentTranslation"("contentId", "locale");
CREATE INDEX IF NOT EXISTS "ContentTranslation_status_idx" ON "ContentTranslation"("status");
DO $$ BEGIN
  ALTER TABLE "ContentTranslation"
    ADD CONSTRAINT "ContentTranslation_contentId_fkey"
    FOREIGN KEY ("contentId") REFERENCES "CmsContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "PlatformIncident" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "category" "IncidentCategory" NOT NULL,
  "severity" "IncidentSeverity" NOT NULL DEFAULT 'MEDIUM',
  "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
  "marketCode" TEXT,
  "openedByUserId" TEXT,
  "ownerUserId" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlatformIncident_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PlatformIncident_status_severity_idx" ON "PlatformIncident"("status", "severity");
CREATE INDEX IF NOT EXISTS "PlatformIncident_category_status_idx" ON "PlatformIncident"("category", "status");
CREATE INDEX IF NOT EXISTS "PlatformIncident_createdAt_idx" ON "PlatformIncident"("createdAt");

-- Seed global kill switches (disabled = platform healthy)
INSERT INTO "FeatureFlag" ("id", "key", "scope", "marketCode", "enabled", "isKillSwitch", "description", "updatedAt")
VALUES
  ('ff_kill_payments', 'kill.payments', 'GLOBAL', '', false, true, 'Emergency: pause all payments / checkout', CURRENT_TIMESTAMP),
  ('ff_kill_listings', 'kill.new_listings', 'GLOBAL', '', false, true, 'Emergency: pause new listings', CURRENT_TIMESTAMP),
  ('ff_kill_valuation', 'kill.valuations', 'GLOBAL', '', false, true, 'Emergency: pause valuations', CURRENT_TIMESTAMP),
  ('ff_kill_markets', 'kill.markets', 'GLOBAL', '', false, true, 'Emergency: pause non-home market surfaces', CURRENT_TIMESTAMP)
ON CONFLICT ("key", "scope", "marketCode") DO NOTHING;
