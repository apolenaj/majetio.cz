-- Prompt 7 Part 1 — Canonical Property Model
-- prisma:disable-transaction
-- (needed for ALTER TYPE ... ADD VALUE on PostgreSQL)

-- ── New enums ────────────────────────────────────────────────────────────────
CREATE TYPE "PropertyVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'ACCOUNT_ONLY');
CREATE TYPE "AddressPrecision" AS ENUM ('EXACT', 'APPROXIMATE', 'HIDDEN');
CREATE TYPE "TransactionType" AS ENUM ('SALE', 'RENT');
CREATE TYPE "PropertyCondition" AS ENUM ('NEW', 'EXCELLENT', 'GOOD', 'AVERAGE', 'NEEDS_RENOVATION', 'SHELL', 'UNKNOWN');
CREATE TYPE "ConstructionType" AS ENUM ('BRICK', 'PANEL', 'WOOD', 'STEEL', 'MIXED', 'OTHER', 'UNKNOWN');
CREATE TYPE "OwnershipType" AS ENUM ('PERSONAL', 'COOPERATIVE', 'MUNICIPAL', 'COMPANY', 'OTHER', 'UNKNOWN');
CREATE TYPE "EnergyRating" AS ENUM ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'UNKNOWN');
CREATE TYPE "PropertyAttributeValueType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'JSON');

-- Extend PropertyStatus
ALTER TYPE "PropertyStatus" ADD VALUE IF NOT EXISTS 'RENTED';
ALTER TYPE "PropertyStatus" ADD VALUE IF NOT EXISTS 'WITHDRAWN';

-- ── Location public fields ───────────────────────────────────────────────────
ALTER TABLE "Location" ADD COLUMN IF NOT EXISTS "publicName" TEXT;
ALTER TABLE "Location" ADD COLUMN IF NOT EXISTS "city" TEXT;

-- ── Property canonical columns ───────────────────────────────────────────────
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "canonicalKey" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "visibility" "PropertyVisibility" NOT NULL DEFAULT 'PUBLIC';
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "transactionType" "TransactionType" NOT NULL DEFAULT 'SALE';
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);

ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "condition" "PropertyCondition" NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "constructionType" "ConstructionType" NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "ownershipType" "OwnershipType" NOT NULL DEFAULT 'UNKNOWN';

ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "askingPrice" INTEGER;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "originalAskingPrice" INTEGER;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "pricePerSqm" DOUBLE PRECISION;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "negotiable" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "usableArea" DOUBLE PRECISION;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "floorArea" DOUBLE PRECISION;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "landArea" DOUBLE PRECISION;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "layout" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "roomsCount" INTEGER;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "bedroomsCount" INTEGER;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "bathroomsCount" INTEGER;

ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "floor" INTEGER;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "floorsTotal" INTEGER;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "yearBuilt" INTEGER;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "yearRenovated" INTEGER;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "energyRating" "EnergyRating" NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "parkingSpaces" INTEGER;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "hasElevator" BOOLEAN;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "buildingName" TEXT;

ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "publicLabel" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "addressPrecision" "AddressPrecision" NOT NULL DEFAULT 'APPROXIMATE';
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "publicCity" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "publicDistrict" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "publicRegion" TEXT;

ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "houseNumber" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "orientationNumber" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;

-- Backfill from legacy columns
UPDATE "Property"
SET
  "canonicalKey" = COALESCE("canonicalKey", 'legacy:' || "id"),
  "askingPrice" = COALESCE("askingPrice", "priceCzk"),
  "usableArea" = COALESCE("usableArea", "areaSqm"),
  "layout" = COALESCE("layout", "disposition"),
  "publicCity" = COALESCE("publicCity", "city"),
  "publicLabel" = COALESCE("publicLabel", "city");

ALTER TABLE "Property" ALTER COLUMN "canonicalKey" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Property_canonicalKey_key" ON "Property"("canonicalKey");
CREATE INDEX IF NOT EXISTS "Property_status_visibility_idx" ON "Property"("status", "visibility");
CREATE INDEX IF NOT EXISTS "Property_propertyType_transactionType_idx" ON "Property"("propertyType", "transactionType");
CREATE INDEX IF NOT EXISTS "Property_askingPrice_idx" ON "Property"("askingPrice");
CREATE INDEX IF NOT EXISTS "Property_publicCity_idx" ON "Property"("publicCity");
CREATE INDEX IF NOT EXISTS "Property_locationId_idx" ON "Property"("locationId");

-- ── PropertyFeatures ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "PropertyFeatures" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "balcony" BOOLEAN NOT NULL DEFAULT false,
  "loggia" BOOLEAN NOT NULL DEFAULT false,
  "terrace" BOOLEAN NOT NULL DEFAULT false,
  "garden" BOOLEAN NOT NULL DEFAULT false,
  "cellar" BOOLEAN NOT NULL DEFAULT false,
  "garage" BOOLEAN NOT NULL DEFAULT false,
  "parking" BOOLEAN NOT NULL DEFAULT false,
  "elevator" BOOLEAN NOT NULL DEFAULT false,
  "furnished" BOOLEAN NOT NULL DEFAULT false,
  "barrierFree" BOOLEAN NOT NULL DEFAULT false,
  "airConditioning" BOOLEAN NOT NULL DEFAULT false,
  "fireplace" BOOLEAN NOT NULL DEFAULT false,
  "pool" BOOLEAN NOT NULL DEFAULT false,
  "alarm" BOOLEAN NOT NULL DEFAULT false,
  "internet" BOOLEAN NOT NULL DEFAULT false,
  "cableTv" BOOLEAN NOT NULL DEFAULT false,
  "washingMachine" BOOLEAN NOT NULL DEFAULT false,
  "dishwasher" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PropertyFeatures_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PropertyFeatures_propertyId_key" ON "PropertyFeatures"("propertyId");

ALTER TABLE "PropertyFeatures"
  DROP CONSTRAINT IF EXISTS "PropertyFeatures_propertyId_fkey";
ALTER TABLE "PropertyFeatures"
  ADD CONSTRAINT "PropertyFeatures_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── PropertyAttribute ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "PropertyAttribute" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "valueType" "PropertyAttributeValueType" NOT NULL DEFAULT 'STRING',
  "unit" TEXT,
  "source" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PropertyAttribute_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PropertyAttribute_propertyId_key_key" ON "PropertyAttribute"("propertyId", "key");
CREATE INDEX IF NOT EXISTS "PropertyAttribute_key_idx" ON "PropertyAttribute"("key");

ALTER TABLE "PropertyAttribute"
  DROP CONSTRAINT IF EXISTS "PropertyAttribute_propertyId_fkey";
ALTER TABLE "PropertyAttribute"
  ADD CONSTRAINT "PropertyAttribute_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
