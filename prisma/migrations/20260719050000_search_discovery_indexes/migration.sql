-- Prompt 8 Part 1 — Discovery search indexes

CREATE INDEX IF NOT EXISTS "Property_status_propertyType_askingPrice_idx"
  ON "Property"("status", "propertyType", "askingPrice");
CREATE INDEX IF NOT EXISTS "Property_status_publicCity_propertyType_idx"
  ON "Property"("status", "publicCity", "propertyType");
CREATE INDEX IF NOT EXISTS "Property_status_condition_idx"
  ON "Property"("status", "condition");
CREATE INDEX IF NOT EXISTS "Property_status_ownershipType_idx"
  ON "Property"("status", "ownershipType");
CREATE INDEX IF NOT EXISTS "Property_status_publishedAt_idx"
  ON "Property"("status", "publishedAt");
CREATE INDEX IF NOT EXISTS "Property_status_layout_askingPrice_idx"
  ON "Property"("status", "layout", "askingPrice");
CREATE INDEX IF NOT EXISTS "Property_layout_idx" ON "Property"("layout");
CREATE INDEX IF NOT EXISTS "Property_usableArea_idx" ON "Property"("usableArea");
CREATE INDEX IF NOT EXISTS "Property_landArea_idx" ON "Property"("landArea");
