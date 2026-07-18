/**
 * Import job status helpers (Prompt 7 Part 4).
 * Pure counters — persistence belongs in server actions / workers.
 */

export type ImportJobCounters = {
  processedCount: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
};

export type ImportJobErrorEntry = {
  itemIdempotencyKey?: string;
  externalPropertyId?: string;
  message: string;
  at?: string;
};

export type ImportJobSnapshot = ImportJobCounters & {
  status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED" | "PARTIAL";
  errors: ImportJobErrorEntry[];
};

export function emptyImportCounters(): ImportJobCounters {
  return {
    processedCount: 0,
    successCount: 0,
    errorCount: 0,
    skippedCount: 0,
  };
}

export function applyItemOutcome(
  counters: ImportJobCounters,
  outcome: "success" | "error" | "skipped" | "duplicate",
): ImportJobCounters {
  const next = { ...counters, processedCount: counters.processedCount + 1 };
  if (outcome === "success") next.successCount += 1;
  else if (outcome === "error") next.errorCount += 1;
  else next.skippedCount += 1;
  return next;
}

export function finalizeImportJobStatus(
  counters: ImportJobCounters,
): ImportJobSnapshot["status"] {
  if (counters.processedCount === 0) return "SUCCEEDED";
  if (counters.errorCount === 0) return "SUCCEEDED";
  if (counters.successCount === 0 && counters.skippedCount === 0) return "FAILED";
  if (counters.successCount > 0 || counters.skippedCount > 0) return "PARTIAL";
  return "FAILED";
}

export function appendImportError(
  errors: ImportJobErrorEntry[],
  entry: ImportJobErrorEntry,
  max = 100,
): ImportJobErrorEntry[] {
  const next = [...errors, { ...entry, at: entry.at ?? new Date().toISOString() }];
  return next.slice(-max);
}
