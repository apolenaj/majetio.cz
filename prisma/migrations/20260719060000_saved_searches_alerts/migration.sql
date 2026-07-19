-- Prompt 8 Part 4 — Saved searches + alert foundation

CREATE TYPE "SavedSearchAlertFrequency" AS ENUM ('OFF', 'INSTANT', 'WEEKLY');
CREATE TYPE "PropertyAlertType" AS ENUM ('PRICE_DROP', 'NEW_PROPERTY', 'SAVED_SEARCH_MATCH');

ALTER TABLE "SavedSearch" ADD COLUMN IF NOT EXISTS "filters" JSONB;
ALTER TABLE "SavedSearch" ADD COLUMN IF NOT EXISTS "sort" TEXT;
ALTER TABLE "SavedSearch" ADD COLUMN IF NOT EXISTS "filtersVersion" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "SavedSearch" ADD COLUMN IF NOT EXISTS "alertFrequency" "SavedSearchAlertFrequency" NOT NULL DEFAULT 'OFF';
ALTER TABLE "SavedSearch" ADD COLUMN IF NOT EXISTS "lastAlertedAt" TIMESTAMP(3);

-- Backfill filters from legacy criteria
UPDATE "SavedSearch"
SET "filters" = COALESCE("filters", "criteria", '{}'::jsonb)
WHERE "filters" IS NULL;

ALTER TABLE "SavedSearch" ALTER COLUMN "filters" SET NOT NULL;
ALTER TABLE "SavedSearch" ALTER COLUMN "criteria" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "SavedSearch_userId_updatedAt_idx" ON "SavedSearch"("userId", "updatedAt");
CREATE INDEX IF NOT EXISTS "SavedSearch_userId_alertFrequency_idx" ON "SavedSearch"("userId", "alertFrequency");

CREATE TABLE IF NOT EXISTS "PropertyAlertSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "savedSearchId" TEXT,
    "alertType" "PropertyAlertType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PropertyAlertSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PropertyAlertSubscription_userId_savedSearchId_alertType_channel_key"
  ON "PropertyAlertSubscription"("userId", "savedSearchId", "alertType", "channel");
CREATE INDEX IF NOT EXISTS "PropertyAlertSubscription_userId_enabled_idx"
  ON "PropertyAlertSubscription"("userId", "enabled");
CREATE INDEX IF NOT EXISTS "PropertyAlertSubscription_alertType_enabled_idx"
  ON "PropertyAlertSubscription"("alertType", "enabled");

ALTER TABLE "PropertyAlertSubscription" DROP CONSTRAINT IF EXISTS "PropertyAlertSubscription_userId_fkey";
ALTER TABLE "PropertyAlertSubscription"
  ADD CONSTRAINT "PropertyAlertSubscription_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PropertyAlertSubscription" DROP CONSTRAINT IF EXISTS "PropertyAlertSubscription_savedSearchId_fkey";
ALTER TABLE "PropertyAlertSubscription"
  ADD CONSTRAINT "PropertyAlertSubscription_savedSearchId_fkey"
  FOREIGN KEY ("savedSearchId") REFERENCES "SavedSearch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "PropertyAlertEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "savedSearchId" TEXT,
    "propertyId" TEXT,
    "alertType" "PropertyAlertType" NOT NULL,
    "payload" JSONB,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PropertyAlertEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PropertyAlertEvent_userId_createdAt_idx" ON "PropertyAlertEvent"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "PropertyAlertEvent_alertType_deliveredAt_idx" ON "PropertyAlertEvent"("alertType", "deliveredAt");
CREATE INDEX IF NOT EXISTS "PropertyAlertEvent_propertyId_idx" ON "PropertyAlertEvent"("propertyId");
