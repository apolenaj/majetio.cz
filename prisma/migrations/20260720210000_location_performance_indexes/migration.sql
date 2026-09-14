-- Performance indexes for Location Intelligence queries

CREATE INDEX IF NOT EXISTS "LocationMetric_locationId_metricKey_period_idx"
  ON "LocationMetric"("locationId", "metricKey", "period");

CREATE INDEX IF NOT EXISTS "LocationMetric_calculatedAt_idx"
  ON "LocationMetric"("calculatedAt");

CREATE INDEX IF NOT EXISTS "LocationMetric_segmentKey_period_idx"
  ON "LocationMetric"("segmentKey", "period");

CREATE INDEX IF NOT EXISTS "LocationMetric_publishedAt_idx"
  ON "LocationMetric"("publishedAt");

-- Approximate geo lookups (centroid); PostGIS GIST comes later
CREATE INDEX IF NOT EXISTS "Location_centroidLat_centroidLon_idx"
  ON "Location"("centroidLat", "centroidLon");

CREATE INDEX IF NOT EXISTS "LocationMarketSnapshot_locationId_segmentKey_period_idx"
  ON "LocationMarketSnapshot"("locationId", "segmentKey", "period");
