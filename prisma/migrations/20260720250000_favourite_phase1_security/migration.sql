-- Decision Workspace Phase 1: Favourite statuses (BOD 83), rejection reasons,
-- archive, Comparison.version (BOD 152), Restrict on Property delete.

-- 1) Remap FavouriteStatus enum
CREATE TYPE "FavouriteStatus_new" AS ENUM (
  'CONSIDERING', 'VIEWING', 'FAVORITE', 'REJECTED'
);

ALTER TABLE "Favourite" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Favourite"
  ALTER COLUMN "status" TYPE "FavouriteStatus_new"
  USING (
    CASE "status"::text
      WHEN 'SAVED' THEN 'CONSIDERING'
      WHEN 'ANALYZING' THEN 'CONSIDERING'
      WHEN 'VIEWING_PLANNED' THEN 'VIEWING'
      WHEN 'SHORTLISTED' THEN 'FAVORITE'
      WHEN 'REJECTED' THEN 'REJECTED'
      WHEN 'CONSIDERING' THEN 'CONSIDERING'
      WHEN 'VIEWING' THEN 'VIEWING'
      WHEN 'FAVORITE' THEN 'FAVORITE'
      ELSE 'CONSIDERING'
    END::"FavouriteStatus_new"
  );

DROP TYPE "FavouriteStatus";
ALTER TYPE "FavouriteStatus_new" RENAME TO "FavouriteStatus";

ALTER TABLE "Favourite"
  ALTER COLUMN "status" SET DEFAULT 'CONSIDERING'::"FavouriteStatus";

-- 2) Rejection reason enum + columns
CREATE TYPE "FavouriteRejectionReason" AS ENUM (
  'TOO_EXPENSIVE', 'LOCATION', 'CONDITION', 'FINANCING',
  'LAYOUT', 'COMPETITION', 'TIMING', 'OTHER'
);

ALTER TABLE "Favourite"
  ADD COLUMN IF NOT EXISTS "rejectionReason" "FavouriteRejectionReason",
  ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Favourite_userId_folder_idx"
  ON "Favourite"("userId", "folder");
CREATE INDEX IF NOT EXISTS "Favourite_userId_status_archivedAt_idx"
  ON "Favourite"("userId", "status", "archivedAt");
CREATE INDEX IF NOT EXISTS "Favourite_userId_rejectionReason_idx"
  ON "Favourite"("userId", "rejectionReason");

-- 3) Property hard-delete must not silently wipe private favourites
ALTER TABLE "Favourite" DROP CONSTRAINT IF EXISTS "Favourite_propertyId_fkey";
ALTER TABLE "Favourite"
  ADD CONSTRAINT "Favourite_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4) Optimistic concurrency for Comparison (BOD 152)
ALTER TABLE "Comparison" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
