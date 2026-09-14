-- Watched locations + location alert types

ALTER TYPE "PropertyAlertType" ADD VALUE IF NOT EXISTS 'LOCATION_WATCH_CREATED';
ALTER TYPE "PropertyAlertType" ADD VALUE IF NOT EXISTS 'LOCATION_METRIC_CHANGE';

CREATE TABLE IF NOT EXISTS "WatchedLocation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "locationSlug" TEXT NOT NULL,
  "locationLabel" TEXT,
  "alertEnabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WatchedLocation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WatchedLocation_userId_locationSlug_key"
  ON "WatchedLocation"("userId", "locationSlug");

CREATE INDEX IF NOT EXISTS "WatchedLocation_userId_createdAt_idx"
  ON "WatchedLocation"("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "WatchedLocation_locationSlug_idx"
  ON "WatchedLocation"("locationSlug");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'WatchedLocation_userId_fkey'
  ) THEN
    ALTER TABLE "WatchedLocation"
      ADD CONSTRAINT "WatchedLocation_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
