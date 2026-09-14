/**
 * Location Intelligence observability — failures and job outcomes.
 * Never logs PII, private addresses, or raw provider payloads.
 */

export type LocationTelemetryEvent =
  | {
      type: "location_job_completed";
      job: "metric_aggregation" | "data_refresh" | "anomaly_check";
      idempotencyKey: string;
      status: "SUCCEEDED" | "SKIPPED_IDEMPOTENT" | "FAILED" | "REVIEW_REQUIRED";
      latencyMs: number;
      recordsProcessed?: number;
    }
  | {
      type: "location_job_failed";
      job: "metric_aggregation" | "data_refresh" | "anomaly_check";
      idempotencyKey: string;
      code: string;
      latencyMs: number;
    }
  | {
      type: "location_query_error";
      service: string;
      code: string;
      latencyMs: number;
    };

export type LocationTelemetrySink = (event: LocationTelemetryEvent) => void;

const sinks: LocationTelemetrySink[] = [];

export function registerLocationTelemetrySink(
  sink: LocationTelemetrySink,
): () => void {
  sinks.push(sink);
  return () => {
    const i = sinks.indexOf(sink);
    if (i >= 0) sinks.splice(i, 1);
  };
}

export function emitLocationTelemetry(event: LocationTelemetryEvent): void {
  if (process.env.NODE_ENV === "development") {
    console.debug("[location-telemetry]", event.type, {
      ...("job" in event ? { job: event.job, status: "status" in event ? event.status : undefined } : {}),
      ...("service" in event ? { service: event.service, code: event.code } : {}),
      ...("code" in event && event.type === "location_job_failed"
        ? { code: event.code }
        : {}),
      latencyMs: event.latencyMs,
      ...("idempotencyKey" in event ? { idempotencyKey: event.idempotencyKey } : {}),
    });
  }
  if (event.type === "location_job_failed" || event.type === "location_query_error") {
    console.error("[location-telemetry:error]", event.type, {
      ...("job" in event ? { job: event.job } : {}),
      ...("service" in event ? { service: event.service } : {}),
      code: "code" in event ? event.code : undefined,
      latencyMs: event.latencyMs,
    });
  }
  for (const sink of sinks) {
    try {
      sink(event);
    } catch {
      // Telemetry must never break request path
    }
  }
}
