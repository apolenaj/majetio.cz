-- Property Operations: moderation statuses, override expiry, merge events

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'PropertyStatus' AND e.enumlabel = 'PENDING_REVIEW') THEN
    ALTER TYPE "PropertyStatus" ADD VALUE 'PENDING_REVIEW';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'PropertyStatus' AND e.enumlabel = 'REJECTED') THEN
    ALTER TYPE "PropertyStatus" ADD VALUE 'REJECTED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'PropertyStatus' AND e.enumlabel = 'SUSPENDED') THEN
    ALTER TYPE "PropertyStatus" ADD VALUE 'SUSPENDED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'DuplicateCandidateStatus' AND e.enumlabel = 'REVERTED') THEN
    ALTER TYPE "DuplicateCandidateStatus" ADD VALUE 'REVERTED';
  END IF;
END $$;

ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "moderationReason" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "userFacingModerationMessage" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "moderatedAt" TIMESTAMP(3);
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "moderatedByUserId" TEXT;

ALTER TABLE "PropertyFieldOverride" ADD COLUMN IF NOT EXISTS "manualTag" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "PropertyFieldOverride" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "PropertyFieldOverride_expiresAt_idx" ON "PropertyFieldOverride"("expiresAt");

CREATE TABLE IF NOT EXISTS "PropertyMergeEvent" (
  "id" TEXT NOT NULL,
  "candidateId" TEXT,
  "canonicalPropertyId" TEXT NOT NULL,
  "secondaryPropertyId" TEXT NOT NULL,
  "planJson" JSONB NOT NULL,
  "secondarySnapshot" JSONB NOT NULL,
  "secondaryPriorStatus" TEXT NOT NULL,
  "reversedAt" TIMESTAMP(3),
  "reversedByUserId" TEXT,
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PropertyMergeEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PropertyMergeEvent_canonicalPropertyId_createdAt_idx"
  ON "PropertyMergeEvent"("canonicalPropertyId", "createdAt");
CREATE INDEX IF NOT EXISTS "PropertyMergeEvent_secondaryPropertyId_idx"
  ON "PropertyMergeEvent"("secondaryPropertyId");
CREATE INDEX IF NOT EXISTS "PropertyMergeEvent_candidateId_idx"
  ON "PropertyMergeEvent"("candidateId");
