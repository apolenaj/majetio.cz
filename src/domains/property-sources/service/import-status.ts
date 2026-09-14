/**
 * Ops presentation mapping for ImportJobStatus (Prompt 3 labels).
 */

export const OPS_IMPORT_STATUSES = [
  "QUEUED",
  "RUNNING",
  "COMPLETED_WITH_WARNINGS",
  "FAILED",
  "SUCCEEDED",
  "CANCELLED",
] as const;

export type OpsImportJobStatus = (typeof OPS_IMPORT_STATUSES)[number];

export function presentImportJobStatus(status: string): OpsImportJobStatus {
  switch (status) {
    case "PENDING":
    case "QUEUED":
      return "QUEUED";
    case "PARTIAL":
    case "COMPLETED_WITH_WARNINGS":
      return "COMPLETED_WITH_WARNINGS";
    case "RUNNING":
    case "FAILED":
    case "SUCCEEDED":
    case "CANCELLED":
      return status;
    default:
      return "QUEUED";
  }
}

/**
 * Prefer Prompt 3 terminal statuses when finalizing counters.
 * Keeps PARTIAL/PENDING readable via presentImportJobStatus for old rows.
 */
export function finalizeOpsImportJobStatus(counters: {
  processedCount: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
}): "SUCCEEDED" | "FAILED" | "COMPLETED_WITH_WARNINGS" {
  if (counters.processedCount === 0) return "SUCCEEDED";
  if (counters.errorCount === 0) return "SUCCEEDED";
  if (counters.successCount === 0 && counters.skippedCount === 0) {
    return "FAILED";
  }
  if (counters.successCount > 0 || counters.skippedCount > 0) {
    return "COMPLETED_WITH_WARNINGS";
  }
  return "FAILED";
}
