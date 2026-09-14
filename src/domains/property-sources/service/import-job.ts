/**
 * Import job status helpers (Prompt 7 Part 4 / Admin Prompt 3).
 * Pure counters — persistence belongs in server actions / workers.
 */

import { finalizeOpsImportJobStatus } from "@/domains/property-sources/service/import-status";

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
  status:
    | "PENDING"
    | "QUEUED"
    | "RUNNING"
    | "SUCCEEDED"
    | "FAILED"
    | "CANCELLED"
    | "PARTIAL"
    | "COMPLETED_WITH_WARNINGS";
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

/**
 * Finalize job status from counters (Prompt 3: COMPLETED_WITH_WARNINGS).
 */
export function finalizeImportJobStatus(
  counters: ImportJobCounters,
): ImportJobSnapshot["status"] {
  return finalizeOpsImportJobStatus(counters);
}

export function appendImportError(
  errors: ImportJobErrorEntry[],
  entry: ImportJobErrorEntry,
  max = 100,
): ImportJobErrorEntry[] {
  const next = [...errors, { ...entry, at: entry.at ?? new Date().toISOString() }];
  return next.slice(-max);
}
