-- Professional services, Partner Marketplace, PropertyTransaction (PROTECTED)

DO $$ BEGIN
  CREATE TYPE "ProfessionalServiceKind" AS ENUM ('EXPERT_REVIEW', 'INVESTMENT_AUDIT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ProfessionalServiceStatus" AS ENUM (
    'DRAFT',
    'WAITING_FOR_INPUTS',
    'SUBMITTED',
    'ASSIGNED',
    'IN_REVIEW',
    'NEEDS_CLARIFICATION',
    'DELIVERED',
    'CLOSED',
    'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PartnerServiceCategory" AS ENUM (
    'INSPECTION',
    'LEGAL',
    'CERTIFICATE',
    'VALUATION',
    'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PartnerCompensationModel" AS ENUM ('FIXED', 'REVENUE_SHARE', 'HYBRID');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PartnerAgreementStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUSPENDED', 'TERMINATED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PropertyTransactionStatus" AS ENUM (
    'EXPLORING',
    'OFFER_DRAFT',
    'OFFER_SUBMITTED',
    'UNDER_NEGOTIATION',
    'AGREEMENT_REACHED',
    'DUE_DILIGENCE',
    'CLOSING',
    'CLOSED',
    'FALLEN_THROUGH',
    'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "DataSensitivityClass" AS ENUM (
    'PUBLIC',
    'AUTHENTICATED',
    'SENSITIVE',
    'PROTECTED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Partner" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "Partner" ADD COLUMN IF NOT EXISTS "primaryCategory" "PartnerServiceCategory";
ALTER TABLE "Partner" ADD COLUMN IF NOT EXISTS "website" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Partner_slug_key" ON "Partner"("slug");

CREATE TABLE IF NOT EXISTS "PartnerCommercialAgreement" (
  "id" TEXT NOT NULL,
  "partnerId" TEXT NOT NULL,
  "serviceCategory" "PartnerServiceCategory" NOT NULL,
  "compensationModel" "PartnerCompensationModel" NOT NULL,
  "fixedFeeMinor" INTEGER,
  "revenueShareBps" INTEGER,
  "currency" TEXT NOT NULL DEFAULT 'CZK',
  "status" "PartnerAgreementStatus" NOT NULL DEFAULT 'DRAFT',
  "termsVersion" TEXT NOT NULL,
  "activeFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "activeTo" TIMESTAMP(3),
  "meta" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PartnerCommercialAgreement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PartnerCommercialAgreement_partnerId_status_idx"
  ON "PartnerCommercialAgreement"("partnerId", "status");
CREATE INDEX IF NOT EXISTS "PartnerCommercialAgreement_serviceCategory_status_idx"
  ON "PartnerCommercialAgreement"("serviceCategory", "status");
CREATE INDEX IF NOT EXISTS "PartnerCommercialAgreement_compensationModel_idx"
  ON "PartnerCommercialAgreement"("compensationModel");

ALTER TABLE "PartnerCommercialAgreement" DROP CONSTRAINT IF EXISTS "PartnerCommercialAgreement_partnerId_fkey";
ALTER TABLE "PartnerCommercialAgreement"
  ADD CONSTRAINT "PartnerCommercialAgreement_partnerId_fkey"
  FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "PartnerServiceOffering" (
  "id" TEXT NOT NULL,
  "partnerId" TEXT NOT NULL,
  "agreementId" TEXT,
  "category" "PartnerServiceCategory" NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 100,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PartnerServiceOffering_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PartnerServiceOffering_partnerId_active_category_idx"
  ON "PartnerServiceOffering"("partnerId", "active", "category");
CREATE INDEX IF NOT EXISTS "PartnerServiceOffering_agreementId_idx"
  ON "PartnerServiceOffering"("agreementId");

ALTER TABLE "PartnerServiceOffering" DROP CONSTRAINT IF EXISTS "PartnerServiceOffering_partnerId_fkey";
ALTER TABLE "PartnerServiceOffering"
  ADD CONSTRAINT "PartnerServiceOffering_partnerId_fkey"
  FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PartnerServiceOffering" DROP CONSTRAINT IF EXISTS "PartnerServiceOffering_agreementId_fkey";
ALTER TABLE "PartnerServiceOffering"
  ADD CONSTRAINT "PartnerServiceOffering_agreementId_fkey"
  FOREIGN KEY ("agreementId") REFERENCES "PartnerCommercialAgreement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "ProfessionalServiceRequest" (
  "id" TEXT NOT NULL,
  "kind" "ProfessionalServiceKind" NOT NULL,
  "status" "ProfessionalServiceStatus" NOT NULL DEFAULT 'DRAFT',
  "propertyId" TEXT,
  "analysisId" TEXT,
  "requesterUserId" TEXT NOT NULL,
  "assigneeUserId" TEXT,
  "orderId" TEXT,
  "inputsChecklist" JSONB,
  "inputsReceivedAt" TIMESTAMP(3),
  "assignedAt" TIMESTAMP(3),
  "reviewStartedAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "deliverySummary" TEXT,
  "internalNotes" TEXT,
  "meta" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProfessionalServiceRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProfessionalServiceRequest_kind_status_createdAt_idx"
  ON "ProfessionalServiceRequest"("kind", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "ProfessionalServiceRequest_requesterUserId_createdAt_idx"
  ON "ProfessionalServiceRequest"("requesterUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "ProfessionalServiceRequest_assigneeUserId_status_idx"
  ON "ProfessionalServiceRequest"("assigneeUserId", "status");
CREATE INDEX IF NOT EXISTS "ProfessionalServiceRequest_propertyId_kind_idx"
  ON "ProfessionalServiceRequest"("propertyId", "kind");

ALTER TABLE "ProfessionalServiceRequest" DROP CONSTRAINT IF EXISTS "ProfessionalServiceRequest_propertyId_fkey";
ALTER TABLE "ProfessionalServiceRequest"
  ADD CONSTRAINT "ProfessionalServiceRequest_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProfessionalServiceRequest" DROP CONSTRAINT IF EXISTS "ProfessionalServiceRequest_requesterUserId_fkey";
ALTER TABLE "ProfessionalServiceRequest"
  ADD CONSTRAINT "ProfessionalServiceRequest_requesterUserId_fkey"
  FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProfessionalServiceRequest" DROP CONSTRAINT IF EXISTS "ProfessionalServiceRequest_assigneeUserId_fkey";
ALTER TABLE "ProfessionalServiceRequest"
  ADD CONSTRAINT "ProfessionalServiceRequest_assigneeUserId_fkey"
  FOREIGN KEY ("assigneeUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "ProfessionalServiceActivity" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "note" TEXT,
  "actorUserId" TEXT,
  "meta" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProfessionalServiceActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProfessionalServiceActivity_requestId_createdAt_idx"
  ON "ProfessionalServiceActivity"("requestId", "createdAt");

ALTER TABLE "ProfessionalServiceActivity" DROP CONSTRAINT IF EXISTS "ProfessionalServiceActivity_requestId_fkey";
ALTER TABLE "ProfessionalServiceActivity"
  ADD CONSTRAINT "ProfessionalServiceActivity_requestId_fkey"
  FOREIGN KEY ("requestId") REFERENCES "ProfessionalServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "PropertyTransaction" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "buyerUserId" TEXT,
  "agentUserId" TEXT,
  "organizationId" TEXT,
  "status" "PropertyTransactionStatus" NOT NULL DEFAULT 'EXPLORING',
  "sensitivityClass" "DataSensitivityClass" NOT NULL DEFAULT 'PROTECTED',
  "currency" TEXT NOT NULL DEFAULT 'CZK',
  "agreedPriceMinor" INTEGER,
  "agreedPriceSetAt" TIMESTAMP(3),
  "conciergeEnabled" BOOLEAN NOT NULL DEFAULT false,
  "closedAt" TIMESTAMP(3),
  "meta" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PropertyTransaction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PropertyTransaction_propertyId_status_idx"
  ON "PropertyTransaction"("propertyId", "status");
CREATE INDEX IF NOT EXISTS "PropertyTransaction_buyerUserId_status_idx"
  ON "PropertyTransaction"("buyerUserId", "status");
CREATE INDEX IF NOT EXISTS "PropertyTransaction_organizationId_status_idx"
  ON "PropertyTransaction"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "PropertyTransaction_sensitivityClass_status_idx"
  ON "PropertyTransaction"("sensitivityClass", "status");
CREATE INDEX IF NOT EXISTS "PropertyTransaction_status_updatedAt_idx"
  ON "PropertyTransaction"("status", "updatedAt");

ALTER TABLE "PropertyTransaction" DROP CONSTRAINT IF EXISTS "PropertyTransaction_propertyId_fkey";
ALTER TABLE "PropertyTransaction"
  ADD CONSTRAINT "PropertyTransaction_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PropertyTransaction" DROP CONSTRAINT IF EXISTS "PropertyTransaction_buyerUserId_fkey";
ALTER TABLE "PropertyTransaction"
  ADD CONSTRAINT "PropertyTransaction_buyerUserId_fkey"
  FOREIGN KEY ("buyerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PropertyTransaction" DROP CONSTRAINT IF EXISTS "PropertyTransaction_agentUserId_fkey";
ALTER TABLE "PropertyTransaction"
  ADD CONSTRAINT "PropertyTransaction_agentUserId_fkey"
  FOREIGN KEY ("agentUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PropertyTransaction" DROP CONSTRAINT IF EXISTS "PropertyTransaction_organizationId_fkey";
ALTER TABLE "PropertyTransaction"
  ADD CONSTRAINT "PropertyTransaction_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "PropertyTransactionAccessLog" (
  "id" TEXT NOT NULL,
  "transactionId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "action" TEXT NOT NULL,
  "fieldsAccessed" TEXT[],
  "ip" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PropertyTransactionAccessLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PropertyTransactionAccessLog_transactionId_createdAt_idx"
  ON "PropertyTransactionAccessLog"("transactionId", "createdAt");
CREATE INDEX IF NOT EXISTS "PropertyTransactionAccessLog_actorUserId_createdAt_idx"
  ON "PropertyTransactionAccessLog"("actorUserId", "createdAt");

ALTER TABLE "PropertyTransactionAccessLog" DROP CONSTRAINT IF EXISTS "PropertyTransactionAccessLog_transactionId_fkey";
ALTER TABLE "PropertyTransactionAccessLog"
  ADD CONSTRAINT "PropertyTransactionAccessLog_transactionId_fkey"
  FOREIGN KEY ("transactionId") REFERENCES "PropertyTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
