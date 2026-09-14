#!/usr/bin/env tsx
/**
 * Daily mortgage rate ingestion job (Prompt 13 / Part 1).
 * Usage: npm run hj:ingest-rates
 */

import { runDailyMortgageRateIngestion } from "../src/integrations/hypotekajasne/jobs/daily-rate-ingestion";

async function main() {
  const result = await runDailyMortgageRateIngestion();
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
