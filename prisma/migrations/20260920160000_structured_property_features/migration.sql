-- Structured property features: Ano / Ne / Nevyplněno (null).
-- Historical default false was not an explicit "Ne" — reset to NULL and mark active listings.

ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "parametersNeedCompletion" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "PropertyFeatures" ADD COLUMN IF NOT EXISTS "details" JSONB;

ALTER TABLE "PropertyFeatures" ALTER COLUMN "balcony" DROP DEFAULT;
ALTER TABLE "PropertyFeatures" ALTER COLUMN "loggia" DROP DEFAULT;
ALTER TABLE "PropertyFeatures" ALTER COLUMN "terrace" DROP DEFAULT;
ALTER TABLE "PropertyFeatures" ALTER COLUMN "garden" DROP DEFAULT;
ALTER TABLE "PropertyFeatures" ALTER COLUMN "cellar" DROP DEFAULT;
ALTER TABLE "PropertyFeatures" ALTER COLUMN "garage" DROP DEFAULT;
ALTER TABLE "PropertyFeatures" ALTER COLUMN "parking" DROP DEFAULT;
ALTER TABLE "PropertyFeatures" ALTER COLUMN "elevator" DROP DEFAULT;
ALTER TABLE "PropertyFeatures" ALTER COLUMN "furnished" DROP DEFAULT;
ALTER TABLE "PropertyFeatures" ALTER COLUMN "barrierFree" DROP DEFAULT;
ALTER TABLE "PropertyFeatures" ALTER COLUMN "airConditioning" DROP DEFAULT;
ALTER TABLE "PropertyFeatures" ALTER COLUMN "fireplace" DROP DEFAULT;
ALTER TABLE "PropertyFeatures" ALTER COLUMN "pool" DROP DEFAULT;
ALTER TABLE "PropertyFeatures" ALTER COLUMN "alarm" DROP DEFAULT;
ALTER TABLE "PropertyFeatures" ALTER COLUMN "internet" DROP DEFAULT;
ALTER TABLE "PropertyFeatures" ALTER COLUMN "cableTv" DROP DEFAULT;
ALTER TABLE "PropertyFeatures" ALTER COLUMN "washingMachine" DROP DEFAULT;
ALTER TABLE "PropertyFeatures" ALTER COLUMN "dishwasher" DROP DEFAULT;

ALTER TABLE "PropertyFeatures" ALTER COLUMN "balcony" DROP NOT NULL;
ALTER TABLE "PropertyFeatures" ALTER COLUMN "loggia" DROP NOT NULL;
ALTER TABLE "PropertyFeatures" ALTER COLUMN "terrace" DROP NOT NULL;
ALTER TABLE "PropertyFeatures" ALTER COLUMN "garden" DROP NOT NULL;
ALTER TABLE "PropertyFeatures" ALTER COLUMN "cellar" DROP NOT NULL;
ALTER TABLE "PropertyFeatures" ALTER COLUMN "garage" DROP NOT NULL;
ALTER TABLE "PropertyFeatures" ALTER COLUMN "parking" DROP NOT NULL;
ALTER TABLE "PropertyFeatures" ALTER COLUMN "elevator" DROP NOT NULL;
ALTER TABLE "PropertyFeatures" ALTER COLUMN "furnished" DROP NOT NULL;
ALTER TABLE "PropertyFeatures" ALTER COLUMN "barrierFree" DROP NOT NULL;
ALTER TABLE "PropertyFeatures" ALTER COLUMN "airConditioning" DROP NOT NULL;
ALTER TABLE "PropertyFeatures" ALTER COLUMN "fireplace" DROP NOT NULL;
ALTER TABLE "PropertyFeatures" ALTER COLUMN "pool" DROP NOT NULL;
ALTER TABLE "PropertyFeatures" ALTER COLUMN "alarm" DROP NOT NULL;
ALTER TABLE "PropertyFeatures" ALTER COLUMN "internet" DROP NOT NULL;
ALTER TABLE "PropertyFeatures" ALTER COLUMN "cableTv" DROP NOT NULL;
ALTER TABLE "PropertyFeatures" ALTER COLUMN "washingMachine" DROP NOT NULL;
ALTER TABLE "PropertyFeatures" ALTER COLUMN "dishwasher" DROP NOT NULL;

-- Default false was not confirmed "Ne". Explicit true stays true; false → unknown.
UPDATE "PropertyFeatures" SET
  "balcony" = CASE WHEN "balcony" IS TRUE THEN TRUE ELSE NULL END,
  "loggia" = CASE WHEN "loggia" IS TRUE THEN TRUE ELSE NULL END,
  "terrace" = CASE WHEN "terrace" IS TRUE THEN TRUE ELSE NULL END,
  "garden" = CASE WHEN "garden" IS TRUE THEN TRUE ELSE NULL END,
  "cellar" = CASE WHEN "cellar" IS TRUE THEN TRUE ELSE NULL END,
  "garage" = CASE WHEN "garage" IS TRUE THEN TRUE ELSE NULL END,
  "parking" = CASE WHEN "parking" IS TRUE THEN TRUE ELSE NULL END,
  "elevator" = CASE WHEN "elevator" IS TRUE THEN TRUE ELSE NULL END,
  "furnished" = CASE WHEN "furnished" IS TRUE THEN TRUE ELSE NULL END,
  "barrierFree" = CASE WHEN "barrierFree" IS TRUE THEN TRUE ELSE NULL END,
  "airConditioning" = CASE WHEN "airConditioning" IS TRUE THEN TRUE ELSE NULL END,
  "fireplace" = CASE WHEN "fireplace" IS TRUE THEN TRUE ELSE NULL END,
  "pool" = CASE WHEN "pool" IS TRUE THEN TRUE ELSE NULL END,
  "alarm" = CASE WHEN "alarm" IS TRUE THEN TRUE ELSE NULL END,
  "internet" = CASE WHEN "internet" IS TRUE THEN TRUE ELSE NULL END,
  "cableTv" = CASE WHEN "cableTv" IS TRUE THEN TRUE ELSE NULL END,
  "washingMachine" = CASE WHEN "washingMachine" IS TRUE THEN TRUE ELSE NULL END,
  "dishwasher" = CASE WHEN "dishwasher" IS TRUE THEN TRUE ELSE NULL END;

UPDATE "Property" AS p
SET "parametersNeedCompletion" = true
WHERE p."status" IN ('ACTIVE', 'RESERVED', 'DRAFT')
  AND p."isDemo" = false
  AND EXISTS (
    SELECT 1 FROM "PropertyFeatures" f
    WHERE f."propertyId" = p."id"
      AND (
        f."balcony" IS NULL OR f."loggia" IS NULL OR f."terrace" IS NULL
        OR f."cellar" IS NULL OR f."garage" IS NULL OR f."parking" IS NULL
        OR f."elevator" IS NULL OR f."barrierFree" IS NULL
      )
  );
