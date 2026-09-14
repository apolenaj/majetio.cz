-- Regulatory isDemo + Due Diligence checklist packs

ALTER TABLE "RegulatoryRule" ADD COLUMN IF NOT EXISTS "isDemo" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "RegulatoryRule_isDemo_idx" ON "RegulatoryRule"("isDemo");

CREATE TABLE IF NOT EXISTS "DueDiligenceChecklistPack" (
    "id" TEXT NOT NULL,
    "marketCode" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "items" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DueDiligenceChecklistPack_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DueDiligenceChecklistPack_marketCode_version_key"
  ON "DueDiligenceChecklistPack"("marketCode", "version");

CREATE INDEX IF NOT EXISTS "DueDiligenceChecklistPack_marketCode_isDemo_idx"
  ON "DueDiligenceChecklistPack"("marketCode", "isDemo");

CREATE INDEX IF NOT EXISTS "DueDiligenceChecklistPack_reviewedAt_idx"
  ON "DueDiligenceChecklistPack"("reviewedAt");
