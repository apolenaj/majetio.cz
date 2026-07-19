-- Prompt 7 Part 5 — Demo flag + property owner (IDOR)

ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "isDemo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "ownerUserId" TEXT;

CREATE INDEX IF NOT EXISTS "Property_isDemo_idx" ON "Property"("isDemo");
CREATE INDEX IF NOT EXISTS "Property_ownerUserId_idx" ON "Property"("ownerUserId");

ALTER TABLE "Property" DROP CONSTRAINT IF EXISTS "Property_ownerUserId_fkey";
ALTER TABLE "Property"
  ADD CONSTRAINT "Property_ownerUserId_fkey"
  FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
