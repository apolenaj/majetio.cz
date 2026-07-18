-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "userAgent" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX IF NOT EXISTS "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateTable
CREATE TABLE "ConsentVersion" (
    "id" TEXT NOT NULL,
    "type" "ConsentType" NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "documentUrl" TEXT,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyTypes" "PropertyType"[],
    "minPriceCzk" INTEGER,
    "maxPriceCzk" INTEGER,
    "minAreaSqm" DOUBLE PRECISION,
    "maxAreaSqm" DOUBLE PRECISION,
    "regions" TEXT[],
    "dispositions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "strategies" TEXT[],
    "targetGrossYieldPct" DOUBLE PRECISION,
    "maxRiskLevel" TEXT,
    "holdPeriodYears" INTEGER,
    "financingPreferred" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestmentPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthRateLimit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthRateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConsentVersion_type_version_key" ON "ConsentVersion"("type", "version");
CREATE INDEX "ConsentVersion_type_isCurrent_idx" ON "ConsentVersion"("type", "isCurrent");
CREATE UNIQUE INDEX "PropertyPreference_userId_key" ON "PropertyPreference"("userId");
CREATE UNIQUE INDEX "InvestmentPreference_userId_key" ON "InvestmentPreference"("userId");
CREATE UNIQUE INDEX "AuthRateLimit_key_key" ON "AuthRateLimit"("key");

-- AddForeignKey
ALTER TABLE "PropertyPreference" ADD CONSTRAINT "PropertyPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InvestmentPreference" ADD CONSTRAINT "InvestmentPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed current consent versions (idempotent-ish via unique type+version)
INSERT INTO "ConsentVersion" ("id", "type", "version", "title", "summary", "documentUrl", "isCurrent")
VALUES
  ('cv_terms_v1', 'TERMS', '2026-07-01', 'Obchodní podmínky Majetio', 'Platné obchodní podmínky služby Majetio.cz.', '/obchodni-podminky', true),
  ('cv_privacy_v1', 'PRIVACY', '2026-07-01', 'Ochrana osobních údajů', 'Zásady zpracování osobních údajů.', '/ochrana-osobnich-udaju', true)
ON CONFLICT ("type", "version") DO NOTHING;
