-- Prompt 17.5: UserMarketProfile, privacy market scope, programmatic SEO docs

ALTER TABLE "ConsentVersion"
  ADD COLUMN IF NOT EXISTS "marketCode" TEXT NOT NULL DEFAULT 'CZ',
  ADD COLUMN IF NOT EXISTS "locale" TEXT NOT NULL DEFAULT 'cs-CZ';

-- Replace unique (type, version) with (type, version, marketCode)
DROP INDEX IF EXISTS "ConsentVersion_type_version_key";
CREATE UNIQUE INDEX IF NOT EXISTS "ConsentVersion_type_version_marketCode_key"
  ON "ConsentVersion"("type", "version", "marketCode");
CREATE INDEX IF NOT EXISTS "ConsentVersion_marketCode_type_isCurrent_idx"
  ON "ConsentVersion"("marketCode", "type", "isCurrent");

CREATE TABLE IF NOT EXISTS "UserMarketProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "marketCode" TEXT NOT NULL,
  "preferredLocale" TEXT NOT NULL,
  "preferredCurrency" TEXT NOT NULL,
  "goal" TEXT,
  "preferredLocationSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "maxBudgetMinor" BIGINT,
  "availableEquityMinor" BIGINT,
  "monthlyIncomeMinor" BIGINT,
  "monthlyLiabilitiesMinor" BIGINT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserMarketProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserMarketProfile_userId_marketCode_key"
  ON "UserMarketProfile"("userId", "marketCode");
CREATE INDEX IF NOT EXISTS "UserMarketProfile_marketCode_idx"
  ON "UserMarketProfile"("marketCode");

DO $$ BEGIN
  ALTER TABLE "UserMarketProfile"
    ADD CONSTRAINT "UserMarketProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "ProgrammaticSeoDocument" (
  "id" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "marketCode" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "hasRealData" BOOLEAN NOT NULL DEFAULT false,
  "sampleCount" INTEGER,
  "publishedAt" TIMESTAMP(3),
  "reviewRequiredAt" TIMESTAMP(3),
  "lastReviewedAt" TIMESTAMP(3),
  "isDemo" BOOLEAN NOT NULL DEFAULT false,
  "title" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProgrammaticSeoDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProgrammaticSeoDocument_marketCode_path_key"
  ON "ProgrammaticSeoDocument"("marketCode", "path");
CREATE INDEX IF NOT EXISTS "ProgrammaticSeoDocument_marketCode_kind_idx"
  ON "ProgrammaticSeoDocument"("marketCode", "kind");
CREATE INDEX IF NOT EXISTS "ProgrammaticSeoDocument_reviewRequiredAt_idx"
  ON "ProgrammaticSeoDocument"("reviewRequiredAt");
