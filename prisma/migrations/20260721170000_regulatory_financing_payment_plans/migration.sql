-- Prompt 17.4: Regulatory rules, tenure, payment plans, financing providers, valuation market scope

DO $$ BEGIN
  CREATE TYPE "CanonicalTenureType" AS ENUM (
    'FREEHOLD', 'LEASEHOLD', 'USUFRUCT', 'COOPERATIVE_RIGHT',
    'COMPANY_OWNED', 'OTHER', 'UNKNOWN'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "RegulatoryRuleKind" AS ENUM (
    'FOREIGN_OWNERSHIP', 'LTV_LIMIT', 'SHORT_TERM_RENTAL', 'TRANSACTION_COST',
    'TAX', 'TENURE', 'DISCLAIMER', 'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "RegulatoryRuleStatus" AS ENUM (
    'DRAFT', 'ACTIVE', 'SUPERSEDED', 'RETIRED'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentPlanPhaseKind" AS ENUM (
    'BOOKING', 'DOWN_PAYMENT', 'CONSTRUCTION', 'HANDOVER', 'POST_HANDOVER', 'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "FinancingProviderKind" AS ENUM (
    'DIRECT_INTEGRATION', 'PARTNER_HANDOFF', 'MANUAL_ONLY', 'UNAVAILABLE'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Property"
  ADD COLUMN IF NOT EXISTS "tenureType" "CanonicalTenureType" NOT NULL DEFAULT 'UNKNOWN';

ALTER TABLE "ValuationModelRegistry"
  ADD COLUMN IF NOT EXISTS "marketCode" TEXT NOT NULL DEFAULT 'CZ';

CREATE INDEX IF NOT EXISTS "ValuationModelRegistry_marketCode_isActive_idx"
  ON "ValuationModelRegistry"("marketCode", "isActive");

CREATE TABLE IF NOT EXISTS "RegulatoryRule" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "marketCode" TEXT NOT NULL,
  "kind" "RegulatoryRuleKind" NOT NULL,
  "version" TEXT NOT NULL,
  "status" "RegulatoryRuleStatus" NOT NULL DEFAULT 'DRAFT',
  "validFrom" TIMESTAMP(3) NOT NULL,
  "validTo" TIMESTAMP(3),
  "verifiedAt" TIMESTAMP(3),
  "verifiedBy" TEXT,
  "titleEn" TEXT NOT NULL,
  "summaryEn" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "requiresLegalVerificationNotice" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RegulatoryRule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RegulatoryRule_marketCode_code_version_key"
  ON "RegulatoryRule"("marketCode", "code", "version");
CREATE INDEX IF NOT EXISTS "RegulatoryRule_marketCode_kind_status_idx"
  ON "RegulatoryRule"("marketCode", "kind", "status");
CREATE INDEX IF NOT EXISTS "RegulatoryRule_validFrom_validTo_idx"
  ON "RegulatoryRule"("validFrom", "validTo");

CREATE TABLE IF NOT EXISTS "PropertyPaymentPlan" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT,
  "marketCode" TEXT NOT NULL,
  "currency" TEXT NOT NULL,
  "totalPriceMinor" BIGINT NOT NULL,
  "developerName" TEXT,
  "projectName" TEXT,
  "version" TEXT NOT NULL DEFAULT '1',
  "fxSnapshotId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PropertyPaymentPlan_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PropertyPaymentPlan_propertyId_idx" ON "PropertyPaymentPlan"("propertyId");
CREATE INDEX IF NOT EXISTS "PropertyPaymentPlan_marketCode_idx" ON "PropertyPaymentPlan"("marketCode");

CREATE TABLE IF NOT EXISTS "PropertyPaymentPlanPhase" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "kind" "PaymentPlanPhaseKind" NOT NULL,
  "labelEn" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL,
  "amountBps" INTEGER NOT NULL DEFAULT 0,
  "amountMinorOverride" BIGINT,
  "dueDate" TIMESTAMP(3),
  "constructionPctTrigger" INTEGER,
  "notesEn" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PropertyPaymentPlanPhase_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PropertyPaymentPlanPhase_planId_sequence_idx"
  ON "PropertyPaymentPlanPhase"("planId", "sequence");

CREATE TABLE IF NOT EXISTS "FinancingProvider" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "displayNameEn" TEXT NOT NULL,
  "marketCodes" TEXT[],
  "kind" "FinancingProviderKind" NOT NULL DEFAULT 'UNAVAILABLE',
  "leadHandoffEnabled" BOOLEAN NOT NULL DEFAULT false,
  "ratePackId" TEXT,
  "regulatoryConfigVersion" TEXT,
  "notesEn" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FinancingProvider_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FinancingProvider_code_key" ON "FinancingProvider"("code");
CREATE INDEX IF NOT EXISTS "FinancingProvider_isActive_idx" ON "FinancingProvider"("isActive");

DO $$ BEGIN
  ALTER TABLE "PropertyPaymentPlan"
    ADD CONSTRAINT "PropertyPaymentPlan_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "PropertyPaymentPlanPhase"
    ADD CONSTRAINT "PropertyPaymentPlanPhase_planId_fkey"
    FOREIGN KEY ("planId") REFERENCES "PropertyPaymentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
