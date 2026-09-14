-- Prompt 17.1 — Market Registry persistence mirror

CREATE TYPE "MarketLaunchStatus" AS ENUM ('PLANNED', 'RESEARCH', 'BETA', 'LIVE', 'PAUSED');

CREATE TYPE "MarketMeasurementSystem" AS ENUM ('METRIC', 'IMPERIAL');

CREATE TABLE "Market" (
    "id" TEXT NOT NULL,
    "marketCode" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "displayNameEn" TEXT NOT NULL,
    "displayNameLocal" TEXT NOT NULL,
    "defaultLocale" TEXT NOT NULL,
    "supportedLocales" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "defaultCurrency" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "measurementSystem" "MarketMeasurementSystem" NOT NULL DEFAULT 'METRIC',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "launchStatus" "MarketLaunchStatus" NOT NULL DEFAULT 'PLANNED',
    "regulatoryConfigVersion" TEXT NOT NULL,
    "hasMinimumPublicData" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Market_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Market_marketCode_key" ON "Market"("marketCode");

CREATE INDEX "Market_launchStatus_enabled_idx" ON "Market"("launchStatus", "enabled");

CREATE INDEX "Market_countryCode_idx" ON "Market"("countryCode");
