-- Capability matrix ops: org coverage, entitlement marketScope, kill switch, REVIEWED status

ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "marketCoverage" TEXT[] DEFAULT ARRAY['CZ']::TEXT[];
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "serviceType" TEXT NOT NULL DEFAULT 'AGENCY';

CREATE INDEX IF NOT EXISTS "Organization_serviceType_idx" ON "Organization"("serviceType");

ALTER TABLE "Entitlement" ADD COLUMN IF NOT EXISTS "marketScope" TEXT[] DEFAULT ARRAY['CZ']::TEXT[];

CREATE INDEX IF NOT EXISTS "Entitlement_marketScope_idx" ON "Entitlement" USING GIN ("marketScope");

ALTER TABLE "Market" ADD COLUMN IF NOT EXISTS "killSwitch" JSONB;

-- RegulatoryRuleStatus: add REVIEWED (Postgres enum)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'RegulatoryRuleStatus' AND e.enumlabel = 'REVIEWED'
  ) THEN
    ALTER TYPE "RegulatoryRuleStatus" ADD VALUE 'REVIEWED';
  END IF;
END $$;
