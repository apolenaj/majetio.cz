/**
 * Scheduled daily mortgage rate ingestion.
 * Wire to cron / Vercel Cron / GitHub Actions in deployment.
 */

import { ingestMortgageRates } from "../service/rate-ingestion-service";

export async function runDailyMortgageRateIngestion(): Promise<{
  ok: boolean;
  runId: string;
  offerCount: number;
  historyRowsCreated: number;
  usedFallback: boolean;
}> {
  const result = await ingestMortgageRates({
    runId: `daily-${new Date().toISOString().slice(0, 10)}`,
  });

  return {
    ok: result.sourceStatus !== "unavailable" || result.usedFallback,
    runId: result.runId,
    offerCount: result.stored.length,
    historyRowsCreated: result.historyRowsCreated,
    usedFallback: result.usedFallback,
  };
}
