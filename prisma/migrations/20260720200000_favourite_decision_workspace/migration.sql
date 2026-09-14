-- Property Decision Workspace: Favourite status, shortlist, notes, priority

CREATE TYPE "FavouriteStatus" AS ENUM (
  'SAVED',
  'SHORTLISTED',
  'VIEWING_PLANNED',
  'ANALYZING',
  'REJECTED'
);

ALTER TABLE "Favourite"
  ADD COLUMN "status" "FavouriteStatus" NOT NULL DEFAULT 'SAVED',
  ADD COLUMN "folder" TEXT,
  ADD COLUMN "priority" INTEGER,
  ADD COLUMN "note" TEXT,
  ADD COLUMN "priceAtSave" INTEGER,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "Favourite_userId_status_createdAt_idx" ON "Favourite"("userId", "status", "createdAt");
CREATE INDEX "Favourite_userId_priority_idx" ON "Favourite"("userId", "priority");
CREATE INDEX "Favourite_userId_updatedAt_idx" ON "Favourite"("userId", "updatedAt");
