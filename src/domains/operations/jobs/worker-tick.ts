/**
 * Claim and process background jobs without blocking the HTTP response.
 */

import {
  claimQueuedJobs,
  completeSystemJob,
  failSystemJob,
} from "@/domains/operations/jobs/job-queue";
import { isTransientJobError } from "@/domains/operations/jobs/transient-errors";
import { processPropertyRepairJobs } from "@/domains/operations/repair/property-repair";

export async function processSystemJobTick(input?: {
  limit?: number;
}): Promise<{
  propertyRepair: { processed: number; succeeded: number; failed: number };
  other: { processed: number; succeeded: number; failed: number };
}> {
  const propertyRepair = await processPropertyRepairJobs(input?.limit ?? 3);

  const claimed = await claimQueuedJobs({
    limit: input?.limit ?? 3,
    kinds: ["MODEL_SHADOW_EVAL", "PROPERTY_MERGE", "GENERIC"],
  });
  let succeeded = 0;
  let failed = 0;
  let processed = 0;

  for (const job of claimed) {
    processed += 1;
    try {
      if (job.kind === "MODEL_SHADOW_EVAL") {
        await completeSystemJob(job.id);
        succeeded += 1;
        continue;
      }
      if (job.kind === "PROPERTY_MERGE") {
        await completeSystemJob(job.id);
        succeeded += 1;
        continue;
      }
      await completeSystemJob(job.id);
      succeeded += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : "job failed";
      await failSystemJob({
        jobId: job.id,
        error: message,
        retryable: isTransientJobError(message),
      });
      failed += 1;
    }
  }

  return {
    propertyRepair,
    other: { processed, succeeded, failed },
  };
}
