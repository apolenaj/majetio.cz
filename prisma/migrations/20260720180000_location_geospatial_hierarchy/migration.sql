-- Location & Market Intelligence — geographic hierarchy + boundaries (foundation)
-- PostGIS: enable later with CREATE EXTENSION postgis; migrate boundary to geometry column.

CREATE TYPE "LocationType" AS ENUM (
  'COUNTRY',
  'REGION',
  'DISTRICT',
  'MUNICIPALITY',
  'CITY',
  'CITY_DISTRICT',
  'NEIGHBORHOOD',
  'MICRO_LOCATION'
);

CREATE TYPE "LocationResolutionConfidence" AS ENUM (
  'EXACT',
  'HIGH',
  'MEDIUM',
  'LOW',
  'UNKNOWN'
);

CREATE TYPE "LocationBoundaryFormat" AS ENUM (
  'GEOJSON',
  'POSTGIS'
);

ALTER TABLE "Location" ADD COLUMN "type" "LocationType" NOT NULL DEFAULT 'MUNICIPALITY';
ALTER TABLE "Location" ADD COLUMN "parentId" TEXT;
ALTER TABLE "Location" ADD COLUMN "countryCode" TEXT NOT NULL DEFAULT 'CZ';
ALTER TABLE "Location" ADD COLUMN "publicLabel" TEXT;
ALTER TABLE "Location" ADD COLUMN "officialCode" TEXT;
ALTER TABLE "Location" ADD COLUMN "ruianCode" TEXT;
ALTER TABLE "Location" ADD COLUMN "lauCode" TEXT;
ALTER TABLE "Location" ADD COLUMN "nutsCode" TEXT;
ALTER TABLE "Location" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "Location" ADD COLUMN "longitude" DOUBLE PRECISION;
ALTER TABLE "Location" ADD COLUMN "centroidLat" DOUBLE PRECISION;
ALTER TABLE "Location" ADD COLUMN "centroidLon" DOUBLE PRECISION;
ALTER TABLE "Location" ADD COLUMN "boundary" JSONB;
ALTER TABLE "Location" ADD COLUMN "boundaryFormat" "LocationBoundaryFormat" NOT NULL DEFAULT 'GEOJSON';
ALTER TABLE "Location" ADD COLUMN "population" INTEGER;
ALTER TABLE "Location" ADD COLUMN "areaSqKm" DOUBLE PRECISION;

UPDATE "Location" SET "publicLabel" = "publicName" WHERE "publicLabel" IS NULL AND "publicName" IS NOT NULL;
UPDATE "Location" SET "countryCode" = COALESCE("country", 'CZ');

ALTER TABLE "Property" ADD COLUMN "locationResolutionConfidence" "LocationResolutionConfidence";
ALTER TABLE "Property" ADD COLUMN "locationResolutionMeta" JSONB;

CREATE INDEX "Location_type_countryCode_idx" ON "Location"("type", "countryCode");
CREATE INDEX "Location_parentId_idx" ON "Location"("parentId");
CREATE INDEX "Location_officialCode_idx" ON "Location"("officialCode");
CREATE INDEX "Location_ruianCode_idx" ON "Location"("ruianCode");
CREATE INDEX "Location_lauCode_idx" ON "Location"("lauCode");
CREATE INDEX "Location_nutsCode_idx" ON "Location"("nutsCode");
CREATE INDEX "Location_countryCode_name_idx" ON "Location"("countryCode", "name");

CREATE UNIQUE INDEX "Location_type_countryCode_slug_key" ON "Location"("type", "countryCode", "slug");

ALTER TABLE "Location" ADD CONSTRAINT "Location_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Optional PostGIS path (run manually when extension available):
-- CREATE EXTENSION IF NOT EXISTS postgis;
-- ALTER TABLE "Location" ADD COLUMN "boundaryGeom" geometry(MultiPolygon, 4326);
-- CREATE INDEX "Location_boundaryGeom_idx" ON "Location" USING GIST ("boundaryGeom");
