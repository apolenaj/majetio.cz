-- Prompt 5: users privacy, org KYC, impersonation, pricing governance

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserAccountStatus') THEN
    CREATE TYPE "UserAccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETION_REQUESTED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrganizationKycStatus') THEN
    CREATE TYPE "OrganizationKycStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
  END IF;
END $$;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accountStatus" "UserAccountStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "suspendedReason" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "suspendedByUserId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deletionRequestedAt" TIMESTAMP(3);

ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "kycStatus" "OrganizationKycStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "kycDecisionReason" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "kycReviewedAt" TIMESTAMP(3);
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "kycReviewedByUserId" TEXT;
CREATE INDEX IF NOT EXISTS "Organization_kycStatus_idx" ON "Organization"("kycStatus");

CREATE TABLE IF NOT EXISTS "OrganizationVerificationDocument" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "sensitivity" "DataSensitivityClass" NOT NULL DEFAULT 'PROTECTED',
  "uploadedByUserId" TEXT,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "notes" TEXT,
  CONSTRAINT "OrganizationVerificationDocument_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "OrganizationVerificationDocument_organizationId_uploadedAt_idx"
  ON "OrganizationVerificationDocument"("organizationId", "uploadedAt");
DO $$ BEGIN
  ALTER TABLE "OrganizationVerificationDocument"
    ADD CONSTRAINT "OrganizationVerificationDocument_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "AdminImpersonationSession" (
  "id" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "targetUserId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" TIMESTAMP(3),
  "tokenHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminImpersonationSession_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AdminImpersonationSession_tokenHash_key" ON "AdminImpersonationSession"("tokenHash");
CREATE INDEX IF NOT EXISTS "AdminImpersonationSession_actorUserId_endedAt_idx" ON "AdminImpersonationSession"("actorUserId", "endedAt");
CREATE INDEX IF NOT EXISTS "AdminImpersonationSession_targetUserId_endedAt_idx" ON "AdminImpersonationSession"("targetUserId", "endedAt");

ALTER TABLE "PricingPlan" ADD COLUMN IF NOT EXISTS "changeReason" TEXT;
ALTER TABLE "PricingPlan" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);
ALTER TABLE "PricingPlan" ADD COLUMN IF NOT EXISTS "approvedByUserId" TEXT;
ALTER TABLE "PricingPlan" ADD COLUMN IF NOT EXISTS "previewJson" JSONB;
