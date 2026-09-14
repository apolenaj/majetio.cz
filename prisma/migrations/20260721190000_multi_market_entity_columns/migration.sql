-- Multi-market entity columns + CZ backfill (safe, non-destructive).
-- Rules: explicit marketCode; existing CZ rows → marketCode='CZ' without data loss.

-- ── Property: countryCode (marketCode + currency already from prior migrations) ──
ALTER TABLE "Property"
  ADD COLUMN IF NOT EXISTS "countryCode" TEXT NOT NULL DEFAULT 'CZ';

UPDATE "Property"
SET
  "marketCode" = COALESCE(NULLIF(UPPER(TRIM("marketCode")), ''), 'CZ'),
  "countryCode" = COALESCE(NULLIF(UPPER(TRIM("countryCode")), ''), 'CZ'),
  "currency" = COALESCE(NULLIF(UPPER(TRIM("currency")), ''), 'CZK')
WHERE TRUE;

CREATE INDEX IF NOT EXISTS "Property_marketCode_countryCode_idx"
  ON "Property"("marketCode", "countryCode");

-- ── Lead: marketCode / countryCode / currency ──
ALTER TABLE "Lead"
  ADD COLUMN IF NOT EXISTS "marketCode" TEXT NOT NULL DEFAULT 'CZ',
  ADD COLUMN IF NOT EXISTS "countryCode" TEXT NOT NULL DEFAULT 'CZ',
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'CZK';

-- Backfill from legacy marketCountry when present; never invent from expectedValueCurrency alone.
UPDATE "Lead"
SET
  "marketCode" = COALESCE(
    NULLIF(UPPER(TRIM("marketCountry")), ''),
    NULLIF(UPPER(TRIM("marketCode")), ''),
    'CZ'
  ),
  "countryCode" = COALESCE(
    NULLIF(UPPER(TRIM("marketCountry")), ''),
    NULLIF(UPPER(TRIM("countryCode")), ''),
    'CZ'
  ),
  "currency" = COALESCE(NULLIF(UPPER(TRIM("currency")), ''), 'CZK');

CREATE INDEX IF NOT EXISTS "Lead_marketCode_status_createdAt_idx"
  ON "Lead"("marketCode", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "Lead_marketCode_countryCode_idx"
  ON "Lead"("marketCode", "countryCode");

-- ── Organization ──
ALTER TABLE "Organization"
  ADD COLUMN IF NOT EXISTS "marketCode" TEXT NOT NULL DEFAULT 'CZ',
  ADD COLUMN IF NOT EXISTS "countryCode" TEXT NOT NULL DEFAULT 'CZ',
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'CZK';

UPDATE "Organization"
SET
  "marketCode" = COALESCE(NULLIF(UPPER(TRIM("marketCode")), ''), 'CZ'),
  "countryCode" = COALESCE(NULLIF(UPPER(TRIM("countryCode")), ''), 'CZ'),
  "currency" = COALESCE(NULLIF(UPPER(TRIM("currency")), ''), 'CZK')
WHERE TRUE;

CREATE INDEX IF NOT EXISTS "Organization_marketCode_type_idx"
  ON "Organization"("marketCode", "type");
CREATE INDEX IF NOT EXISTS "Organization_marketCode_countryCode_idx"
  ON "Organization"("marketCode", "countryCode");

-- ── PricingPlan ──
ALTER TABLE "PricingPlan"
  ADD COLUMN IF NOT EXISTS "marketCode" TEXT NOT NULL DEFAULT 'CZ',
  ADD COLUMN IF NOT EXISTS "countryCode" TEXT NOT NULL DEFAULT 'CZ';

UPDATE "PricingPlan"
SET
  "marketCode" = COALESCE(NULLIF(UPPER(TRIM("marketCode")), ''), 'CZ'),
  "countryCode" = COALESCE(NULLIF(UPPER(TRIM("countryCode")), ''), 'CZ'),
  "currency" = COALESCE(NULLIF(UPPER(TRIM("currency")), ''), 'CZK')
WHERE TRUE;

CREATE INDEX IF NOT EXISTS "PricingPlan_marketCode_status_idx"
  ON "PricingPlan"("marketCode", "status");
CREATE INDEX IF NOT EXISTS "PricingPlan_marketCode_countryCode_idx"
  ON "PricingPlan"("marketCode", "countryCode");

-- ── Seed Market registry mirror (idempotent) — CZ active, others stubs ──
INSERT INTO "Market" (
  "id", "marketCode", "countryCode", "displayNameEn", "displayNameLocal",
  "defaultLocale", "supportedLocales", "defaultCurrency", "timezone",
  "measurementSystem", "enabled", "launchStatus", "regulatoryConfigVersion",
  "hasMinimumPublicData", "createdAt", "updatedAt"
)
VALUES
  (
    'mkt_cz_seed', 'CZ', 'CZ', 'Czech Republic', 'Česko',
    'cs-CZ', ARRAY['cs-CZ','en-GB']::TEXT[], 'CZK', 'Europe/Prague',
    'METRIC', true, 'LIVE', 'cz-reg.v2026.07',
    true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'mkt_sk_seed', 'SK', 'SK', 'Slovakia', 'Slovensko',
    'sk-SK', ARRAY['sk-SK','cs-CZ','en-GB']::TEXT[], 'EUR', 'Europe/Bratislava',
    'METRIC', false, 'RESEARCH', 'sk-reg.draft',
    false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'mkt_es_seed', 'ES', 'ES', 'Spain', 'España',
    'es-ES', ARRAY['es-ES','en-GB']::TEXT[], 'EUR', 'Europe/Madrid',
    'METRIC', false, 'PLANNED', 'es-reg.planned',
    false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'mkt_it_seed', 'IT', 'IT', 'Italy', 'Italia',
    'it-IT', ARRAY['it-IT','en-GB']::TEXT[], 'EUR', 'Europe/Rome',
    'METRIC', false, 'PLANNED', 'it-reg.planned',
    false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'mkt_hr_seed', 'HR', 'HR', 'Croatia', 'Hrvatska',
    'hr-HR', ARRAY['hr-HR','en-GB']::TEXT[], 'EUR', 'Europe/Zagreb',
    'METRIC', false, 'PLANNED', 'hr-reg.planned',
    false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'mkt_ae_seed', 'AE', 'AE', 'United Arab Emirates', 'الإمارات',
    'en-AE', ARRAY['en-AE','ar-AE']::TEXT[], 'AED', 'Asia/Dubai',
    'METRIC', false, 'RESEARCH', 'ae-reg.research',
    false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'mkt_sa_seed', 'SA', 'SA', 'Saudi Arabia', 'المملكة العربية السعودية',
    'ar-SA', ARRAY['ar-SA','en-GB']::TEXT[], 'SAR', 'Asia/Riyadh',
    'METRIC', false, 'PLANNED', 'sa-reg.planned',
    false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'mkt_id_seed', 'ID', 'ID', 'Indonesia', 'Indonesia',
    'id-ID', ARRAY['id-ID','en-ID','en-GB']::TEXT[], 'IDR', 'Asia/Jakarta',
    'METRIC', false, 'RESEARCH', 'id-reg.research',
    false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  )
ON CONFLICT ("marketCode") DO UPDATE SET
  "updatedAt" = CURRENT_TIMESTAMP;
