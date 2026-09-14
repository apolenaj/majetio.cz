-- Privacy Architecture: LegalDocument, ConsentRecord, PrivacyExportToken

CREATE TYPE "LegalDocumentType" AS ENUM ('TERMS', 'PRIVACY', 'COOKIES', 'LEGAL_NOTICE');
CREATE TYPE "LegalDocumentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "ConsentPurpose" AS ENUM (
  'COOKIE_NECESSARY',
  'COOKIE_PREFERENCES',
  'COOKIE_ANALYTICS',
  'COOKIE_MARKETING',
  'MARKETING_COMMUNICATION',
  'PARTNER_DATA_SHARE',
  'LEGAL_TERMS',
  'LEGAL_PRIVACY'
);
CREATE TYPE "PrivacyExportStatus" AS ENUM ('PENDING', 'READY', 'CONSUMED', 'EXPIRED', 'FAILED');

CREATE TABLE "LegalDocument" (
    "id" TEXT NOT NULL,
    "type" "LegalDocumentType" NOT NULL,
    "version" TEXT NOT NULL,
    "status" "LegalDocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'cs-CZ',
    "marketCode" TEXT NOT NULL DEFAULT 'CZ',
    "effectiveFrom" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LegalDocument_type_version_marketCode_locale_key"
  ON "LegalDocument"("type", "version", "marketCode", "locale");
CREATE INDEX "LegalDocument_type_status_marketCode_idx"
  ON "LegalDocument"("type", "status", "marketCode");
CREATE INDEX "LegalDocument_status_publishedAt_idx"
  ON "LegalDocument"("status", "publishedAt");

CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "visitorId" TEXT,
    "purpose" "ConsentPurpose" NOT NULL,
    "recipient" TEXT,
    "sharedScope" JSONB,
    "version" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "grantedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "legalDocVersion" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ConsentRecord_userId_purpose_createdAt_idx"
  ON "ConsentRecord"("userId", "purpose", "createdAt");
CREATE INDEX "ConsentRecord_visitorId_purpose_createdAt_idx"
  ON "ConsentRecord"("visitorId", "purpose", "createdAt");
CREATE INDEX "ConsentRecord_purpose_granted_createdAt_idx"
  ON "ConsentRecord"("purpose", "granted", "createdAt");
CREATE INDEX "ConsentRecord_recipient_createdAt_idx"
  ON "ConsentRecord"("recipient", "createdAt");

ALTER TABLE "ConsentRecord"
  ADD CONSTRAINT "ConsentRecord_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "PrivacyExportToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'json',
    "status" "PrivacyExportStatus" NOT NULL DEFAULT 'READY',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrivacyExportToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PrivacyExportToken_tokenHash_key" ON "PrivacyExportToken"("tokenHash");
CREATE INDEX "PrivacyExportToken_userId_status_createdAt_idx"
  ON "PrivacyExportToken"("userId", "status", "createdAt");
CREATE INDEX "PrivacyExportToken_expiresAt_idx" ON "PrivacyExportToken"("expiresAt");

ALTER TABLE "PrivacyExportToken"
  ADD CONSTRAINT "PrivacyExportToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
