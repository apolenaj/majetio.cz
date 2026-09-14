-- Decision Workspace: SavedSearchMatch + lastCheckedAt

ALTER TABLE "SavedSearch" ADD COLUMN IF NOT EXISTS "lastCheckedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "SavedSearchMatch" (
  "id" TEXT NOT NULL,
  "savedSearchId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "firstMatchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastMatchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notifiedAt" TIMESTAMP(3),
  CONSTRAINT "SavedSearchMatch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SavedSearchMatch_savedSearchId_propertyId_key"
  ON "SavedSearchMatch"("savedSearchId", "propertyId");
CREATE INDEX IF NOT EXISTS "SavedSearchMatch_savedSearchId_notifiedAt_idx"
  ON "SavedSearchMatch"("savedSearchId", "notifiedAt");
CREATE INDEX IF NOT EXISTS "SavedSearchMatch_savedSearchId_firstMatchedAt_idx"
  ON "SavedSearchMatch"("savedSearchId", "firstMatchedAt");
CREATE INDEX IF NOT EXISTS "SavedSearchMatch_propertyId_idx"
  ON "SavedSearchMatch"("propertyId");

ALTER TABLE "SavedSearchMatch"
  DROP CONSTRAINT IF EXISTS "SavedSearchMatch_savedSearchId_fkey";
ALTER TABLE "SavedSearchMatch"
  ADD CONSTRAINT "SavedSearchMatch_savedSearchId_fkey"
  FOREIGN KEY ("savedSearchId") REFERENCES "SavedSearch"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SavedSearchMatch"
  DROP CONSTRAINT IF EXISTS "SavedSearchMatch_propertyId_fkey";
ALTER TABLE "SavedSearchMatch"
  ADD CONSTRAINT "SavedSearchMatch_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
