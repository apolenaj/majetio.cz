/**
 * CRON entry: Location metric aggregation (precompute from observations).
 *
 * Usage:
 *   npx tsx scripts/location-metric-aggregation.ts --period=2026-Q1
 *   npx tsx scripts/location-metric-aggregation.ts --period=2026-Q1 --force
 */

import { runMetricAggregationJob } from "@/domains/locations/jobs/cron-jobs";

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit?.slice(prefix.length);
}

async function main() {
  const period = arg("period") ?? new Date().toISOString().slice(0, 7);
  const force = process.argv.includes("--force");
  const result = await runMetricAggregationJob({ period, force });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
