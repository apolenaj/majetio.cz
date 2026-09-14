/**
 * Idempotency for Location Intelligence cron / precompute jobs.
 * Same period + methodology → same key → no duplicate aggregates.
 */

import { createHash } from "node:crypto";

export function buildLocationJobIdempotencyKey(input: {
  job: "metric_aggregation" | "data_refresh" | "anomaly_check";
  period: string;
  methodologyVersion: string;
  /** Optional scope — locationId or "all". */
  scope?: string;
}): string {
  const scope = (input.scope ?? "all").trim().toLowerCase();
  const raw = [
    input.job,
    input.period.trim(),
    input.methodologyVersion.trim(),
    scope,
  ].join("|");
  const hash = createHash("sha256").update(raw).digest("hex").slice(0, 20);
  return `locjob:${input.job}:${input.period}:${hash}`;
}
