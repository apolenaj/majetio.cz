-- Comparison Engine: ComparisonItem → ComparisonProperty (+ addedAt)

ALTER TABLE "ComparisonItem" RENAME TO "ComparisonProperty";

ALTER TABLE "ComparisonProperty" ADD COLUMN IF NOT EXISTS "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Rename FK constraint if present (Postgres)
DO $$ BEGIN
  ALTER INDEX IF EXISTS "ComparisonItem_comparisonId_propertyId_key" RENAME TO "ComparisonProperty_comparisonId_propertyId_key";
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "ComparisonProperty_comparisonId_sortOrder_idx"
  ON "ComparisonProperty"("comparisonId", "sortOrder");

CREATE INDEX IF NOT EXISTS "Comparison_userId_updatedAt_idx"
  ON "Comparison"("userId", "updatedAt");
