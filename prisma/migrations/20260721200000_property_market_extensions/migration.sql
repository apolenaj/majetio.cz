-- Typed market extensions + localized text (Rules 147–152, 190–192)
-- JSONB bag avoids hundreds of nullable Property columns; hot filters use expression indexes.

ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "marketExtensions" JSONB;

CREATE TABLE IF NOT EXISTS "PropertyLocalizedText" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "originalLocale" TEXT NOT NULL,
    "originalText" TEXT NOT NULL,
    "translatedLocale" TEXT,
    "translatedText" TEXT,
    "translationSource" TEXT NOT NULL DEFAULT 'ORIGINAL',
    "machineGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyLocalizedText_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PropertyLocalizedText_propertyId_field_idx"
  ON "PropertyLocalizedText"("propertyId", "field");

CREATE INDEX IF NOT EXISTS "PropertyLocalizedText_originalLocale_idx"
  ON "PropertyLocalizedText"("originalLocale");

CREATE INDEX IF NOT EXISTS "PropertyLocalizedText_machineGenerated_idx"
  ON "PropertyLocalizedText"("machineGenerated");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PropertyLocalizedText_propertyId_fkey'
  ) THEN
    ALTER TABLE "PropertyLocalizedText"
      ADD CONSTRAINT "PropertyLocalizedText_propertyId_fkey"
      FOREIGN KEY ("propertyId") REFERENCES "Property"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Optional hot-filter expression indexes (AE furnishing / ES energy) — safe if path missing.
CREATE INDEX IF NOT EXISTS "Property_marketExtensions_ae_furnishing_idx"
  ON "Property" ((("marketExtensions" ->> 'furnishing')))
  WHERE "marketCode" = 'AE' AND "marketExtensions" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "Property_marketExtensions_es_energy_idx"
  ON "Property" ((("marketExtensions" ->> 'energyCertificate')))
  WHERE "marketCode" = 'ES' AND "marketExtensions" IS NOT NULL;
