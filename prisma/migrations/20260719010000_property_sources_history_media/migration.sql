-- Prompt 7 Part 2 — Sources, history, media, lifecycle
-- prisma:disable-transaction

-- ── Enums ────────────────────────────────────────────────────────────────────
CREATE TYPE "PropertySourceType" AS ENUM ('MANUAL', 'PARTNER_FEED', 'LICENSED_API', 'PUBLIC_PORTAL', 'USER_SUBMITTED', 'OTHER');
CREATE TYPE "LicenseStatus" AS ENUM ('UNKNOWN', 'OWNED', 'LICENSED', 'PUBLIC_DOMAIN', 'RESTRICTED', 'PROHIBITED');
CREATE TYPE "PriceChangeType" AS ENUM ('INITIAL', 'INCREASED', 'DECREASED', 'CORRECTED', 'REMOVED');
CREATE TYPE "PropertyMediaType" AS ENUM ('PHOTO', 'FLOORPLAN', 'DOCUMENT', 'VIDEO', 'OTHER');
CREATE TYPE "PropertyFreshness" AS ENUM ('FRESH', 'STALE', 'UNAVAILABLE');

ALTER TYPE "PropertyStatus" ADD VALUE IF NOT EXISTS 'UNAVAILABLE';

-- ── Property lifecycle ───────────────────────────────────────────────────────
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "lastFetchedAt" TIMESTAMP(3);
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "freshness" "PropertyFreshness" NOT NULL DEFAULT 'FRESH';
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "staleMarkedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Property_freshness_lastSeenAt_idx" ON "Property"("freshness", "lastSeenAt");

-- ── PropertySource expansion ─────────────────────────────────────────────────
ALTER TABLE "PropertySource" ADD COLUMN IF NOT EXISTS "sourceType" "PropertySourceType" NOT NULL DEFAULT 'OTHER';
ALTER TABLE "PropertySource" ADD COLUMN IF NOT EXISTS "externalPropertyId" TEXT;
ALTER TABLE "PropertySource" ADD COLUMN IF NOT EXISTS "licenseStatus" "LicenseStatus" NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE "PropertySource" ADD COLUMN IF NOT EXISTS "isPrimary" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PropertySource" ADD COLUMN IF NOT EXISTS "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "PropertySource" ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "PropertySource" ADD COLUMN IF NOT EXISTS "lastFetchedAt" TIMESTAMP(3);
ALTER TABLE "PropertySource" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "PropertySource" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "PropertySource"
SET
  "externalPropertyId" = COALESCE("externalPropertyId", "externalId"),
  "lastFetchedAt" = COALESCE("lastFetchedAt", "fetchedAt"),
  "lastSeenAt" = COALESCE("lastSeenAt", "fetchedAt", CURRENT_TIMESTAMP),
  "firstSeenAt" = COALESCE("firstSeenAt", "fetchedAt", CURRENT_TIMESTAMP);

CREATE INDEX IF NOT EXISTS "PropertySource_provider_externalPropertyId_idx" ON "PropertySource"("provider", "externalPropertyId");
CREATE INDEX IF NOT EXISTS "PropertySource_propertyId_sourceType_idx" ON "PropertySource"("propertyId", "sourceType");
CREATE INDEX IF NOT EXISTS "PropertySource_lastSeenAt_idx" ON "PropertySource"("lastSeenAt");

-- ── PropertySourcePayload (move raw JSON out of source row) ──────────────────
CREATE TABLE IF NOT EXISTS "PropertySourcePayload" (
  "id" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "contentType" TEXT NOT NULL DEFAULT 'application/json',
  "byteSize" INTEGER,
  "piiRedacted" BOOLEAN NOT NULL DEFAULT true,
  "storedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PropertySourcePayload_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PropertySourcePayload_sourceId_storedAt_idx" ON "PropertySourcePayload"("sourceId", "storedAt");

ALTER TABLE "PropertySourcePayload" DROP CONSTRAINT IF EXISTS "PropertySourcePayload_sourceId_fkey";
ALTER TABLE "PropertySourcePayload"
  ADD CONSTRAINT "PropertySourcePayload_sourceId_fkey"
  FOREIGN KEY ("sourceId") REFERENCES "PropertySource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "PropertySourcePayload" ("id", "sourceId", "payload", "contentType", "piiRedacted", "storedAt")
SELECT
  'pspay_' || "id",
  "id",
  "rawPayload",
  'application/json',
  true,
  COALESCE("fetchedAt", CURRENT_TIMESTAMP)
FROM "PropertySource"
WHERE "rawPayload" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "PropertySourcePayload" p WHERE p."sourceId" = "PropertySource"."id"
  );

ALTER TABLE "PropertySource" DROP COLUMN IF EXISTS "rawPayload";

-- ── Field provenance ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "PropertyFieldProvenance" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "fieldKey" TEXT NOT NULL,
  "sourceId" TEXT,
  "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "confidence" DOUBLE PRECISION,
  "valueSnapshot" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PropertyFieldProvenance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PropertyFieldProvenance_propertyId_fieldKey_key"
  ON "PropertyFieldProvenance"("propertyId", "fieldKey");
CREATE INDEX IF NOT EXISTS "PropertyFieldProvenance_sourceId_idx" ON "PropertyFieldProvenance"("sourceId");
CREATE INDEX IF NOT EXISTS "PropertyFieldProvenance_fieldKey_idx" ON "PropertyFieldProvenance"("fieldKey");

ALTER TABLE "PropertyFieldProvenance" DROP CONSTRAINT IF EXISTS "PropertyFieldProvenance_propertyId_fkey";
ALTER TABLE "PropertyFieldProvenance"
  ADD CONSTRAINT "PropertyFieldProvenance_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PropertyFieldProvenance" DROP CONSTRAINT IF EXISTS "PropertyFieldProvenance_sourceId_fkey";
ALTER TABLE "PropertyFieldProvenance"
  ADD CONSTRAINT "PropertyFieldProvenance_sourceId_fkey"
  FOREIGN KEY ("sourceId") REFERENCES "PropertySource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── PropertyMedia ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "PropertyMedia" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "sourceId" TEXT,
  "url" TEXT NOT NULL,
  "type" "PropertyMediaType" NOT NULL DEFAULT 'PHOTO',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "licenseStatus" "LicenseStatus" NOT NULL DEFAULT 'UNKNOWN',
  "alt" TEXT,
  "title" TEXT,
  "mimeType" TEXT,
  "width" INTEGER,
  "height" INTEGER,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "isPlaceholder" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PropertyMedia_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PropertyMedia_propertyId_type_sortOrder_idx"
  ON "PropertyMedia"("propertyId", "type", "sortOrder");
CREATE INDEX IF NOT EXISTS "PropertyMedia_sourceId_idx" ON "PropertyMedia"("sourceId");

ALTER TABLE "PropertyMedia" DROP CONSTRAINT IF EXISTS "PropertyMedia_propertyId_fkey";
ALTER TABLE "PropertyMedia"
  ADD CONSTRAINT "PropertyMedia_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PropertyMedia" DROP CONSTRAINT IF EXISTS "PropertyMedia_sourceId_fkey";
ALTER TABLE "PropertyMedia"
  ADD CONSTRAINT "PropertyMedia_sourceId_fkey"
  FOREIGN KEY ("sourceId") REFERENCES "PropertySource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill media from legacy images as PHOTO
INSERT INTO "PropertyMedia" (
  "id", "propertyId", "url", "type", "sortOrder", "licenseStatus", "alt", "isPrimary", "isPlaceholder", "createdAt", "updatedAt"
)
SELECT
  'pmedia_' || "id",
  "propertyId",
  "url",
  'PHOTO',
  "sortOrder",
  'UNKNOWN',
  "alt",
  "isPrimary",
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "PropertyImage" pi
WHERE NOT EXISTS (
  SELECT 1 FROM "PropertyMedia" pm WHERE pm."id" = 'pmedia_' || pi."id"
);

-- ── Price history ────────────────────────────────────────────────────────────
ALTER TABLE "PropertyPriceHistory" ADD COLUMN IF NOT EXISTS "sourceId" TEXT;
ALTER TABLE "PropertyPriceHistory" ADD COLUMN IF NOT EXISTS "amount" INTEGER;
ALTER TABLE "PropertyPriceHistory" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'CZK';
ALTER TABLE "PropertyPriceHistory" ADD COLUMN IF NOT EXISTS "changeType" "PriceChangeType" NOT NULL DEFAULT 'INITIAL';
ALTER TABLE "PropertyPriceHistory" ADD COLUMN IF NOT EXISTS "observedAt" TIMESTAMP(3);
ALTER TABLE "PropertyPriceHistory" ADD COLUMN IF NOT EXISTS "note" TEXT;

UPDATE "PropertyPriceHistory"
SET
  "amount" = COALESCE("amount", "priceCzk"),
  "observedAt" = COALESCE("observedAt", "changedAt", CURRENT_TIMESTAMP);

ALTER TABLE "PropertyPriceHistory" ALTER COLUMN "amount" SET NOT NULL;
ALTER TABLE "PropertyPriceHistory" ALTER COLUMN "observedAt" SET NOT NULL;

-- priceCzk becomes nullable legacy
ALTER TABLE "PropertyPriceHistory" ALTER COLUMN "priceCzk" DROP NOT NULL;

ALTER TABLE "PropertyPriceHistory" DROP CONSTRAINT IF EXISTS "PropertyPriceHistory_sourceId_fkey";
ALTER TABLE "PropertyPriceHistory"
  ADD CONSTRAINT "PropertyPriceHistory_sourceId_fkey"
  FOREIGN KEY ("sourceId") REFERENCES "PropertySource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "PropertyPriceHistory_propertyId_observedAt_idx"
  ON "PropertyPriceHistory"("propertyId", "observedAt");
CREATE INDEX IF NOT EXISTS "PropertyPriceHistory_sourceId_idx" ON "PropertyPriceHistory"("sourceId");

-- Drop obsolete free-text source column if present
ALTER TABLE "PropertyPriceHistory" DROP COLUMN IF EXISTS "source";
ALTER TABLE "PropertyPriceHistory" DROP COLUMN IF EXISTS "changedAt";

-- ── Status history ───────────────────────────────────────────────────────────
ALTER TABLE "PropertyStatusHistory" ADD COLUMN IF NOT EXISTS "sourceId" TEXT;
ALTER TABLE "PropertyStatusHistory" ADD COLUMN IF NOT EXISTS "previousStatus" "PropertyStatus";
ALTER TABLE "PropertyStatusHistory" ADD COLUMN IF NOT EXISTS "newStatus" "PropertyStatus";
ALTER TABLE "PropertyStatusHistory" ADD COLUMN IF NOT EXISTS "reason" TEXT;
ALTER TABLE "PropertyStatusHistory" ADD COLUMN IF NOT EXISTS "note" TEXT;

UPDATE "PropertyStatusHistory"
SET "newStatus" = COALESCE("newStatus", "status")
WHERE "newStatus" IS NULL;

ALTER TABLE "PropertyStatusHistory" ALTER COLUMN "newStatus" SET NOT NULL;
ALTER TABLE "PropertyStatusHistory" ALTER COLUMN "status" DROP NOT NULL;

ALTER TABLE "PropertyStatusHistory" DROP CONSTRAINT IF EXISTS "PropertyStatusHistory_sourceId_fkey";
ALTER TABLE "PropertyStatusHistory"
  ADD CONSTRAINT "PropertyStatusHistory_sourceId_fkey"
  FOREIGN KEY ("sourceId") REFERENCES "PropertySource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "PropertyStatusHistory_propertyId_changedAt_idx"
  ON "PropertyStatusHistory"("propertyId", "changedAt");
CREATE INDEX IF NOT EXISTS "PropertyStatusHistory_sourceId_idx" ON "PropertyStatusHistory"("sourceId");

ALTER TABLE "PropertyStatusHistory" DROP COLUMN IF EXISTS "source";
