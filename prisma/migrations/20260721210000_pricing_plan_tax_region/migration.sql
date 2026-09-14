-- PricingPlan tax region + multi-market commerce indexes

ALTER TABLE "PricingPlan" ADD COLUMN IF NOT EXISTS "taxRegion" TEXT NOT NULL DEFAULT 'CZ';

CREATE INDEX IF NOT EXISTS "PricingPlan_marketCode_taxRegion_status_idx"
  ON "PricingPlan"("marketCode", "taxRegion", "status");
