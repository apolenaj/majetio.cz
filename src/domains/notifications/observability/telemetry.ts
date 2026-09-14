/**
 * Property alert observability (BOD 143).
 * Never logs PII, financing amounts, or raw e-mail bodies.
 */

export type AlertTelemetryEvent =
  | {
      type: "alert_delivered";
      channel: "IN_APP" | "EMAIL";
      alertType: string;
      status: "SENT" | "PENDING" | "SUPPRESSED" | "DEDUPED" | "FAILED";
    }
  | {
      type: "alert_duplicate_suppressed";
      alertType: string;
      reason: "dedupe_key" | "fatigue" | "corrected_price" | "frequency_off";
    }
  | {
      type: "alert_failed";
      channel: "IN_APP" | "EMAIL";
      alertType: string;
      code: string;
      retryable: boolean;
    }
  | {
      type: "alert_job_completed";
      job: "digest_daily" | "digest_weekly" | "email_retry" | "reverse_match_batch";
      status: "SUCCEEDED" | "FAILED" | "PARTIAL";
      processed: number;
      failed: number;
      latencyMs: number;
    }
  | {
      type: "alert_volume";
      window: "day";
      delivered: number;
      suppressed: number;
      failed: number;
    };

export type AlertTelemetrySink = (event: AlertTelemetryEvent) => void;

const sinks: AlertTelemetrySink[] = [];

/** In-memory counters for tests / process lifetime. */
export const alertMetrics = {
  delivered: 0,
  suppressed: 0,
  failed: 0,
  duplicates: 0,
  jobFailures: 0,
};

export function resetAlertMetricsForTests(): void {
  alertMetrics.delivered = 0;
  alertMetrics.suppressed = 0;
  alertMetrics.failed = 0;
  alertMetrics.duplicates = 0;
  alertMetrics.jobFailures = 0;
}

export function registerAlertTelemetrySink(
  sink: AlertTelemetrySink,
): () => void {
  sinks.push(sink);
  return () => {
    const i = sinks.indexOf(sink);
    if (i >= 0) sinks.splice(i, 1);
  };
}

export function emitAlertTelemetry(event: AlertTelemetryEvent): void {
  switch (event.type) {
    case "alert_delivered":
      if (event.status === "SENT" || event.status === "PENDING") {
        alertMetrics.delivered += 1;
      } else if (event.status === "SUPPRESSED" || event.status === "DEDUPED") {
        alertMetrics.suppressed += 1;
      } else if (event.status === "FAILED") {
        alertMetrics.failed += 1;
      }
      break;
    case "alert_duplicate_suppressed":
      alertMetrics.duplicates += 1;
      alertMetrics.suppressed += 1;
      break;
    case "alert_failed":
      alertMetrics.failed += 1;
      break;
    case "alert_job_completed":
      if (event.status === "FAILED") alertMetrics.jobFailures += 1;
      break;
    default:
      break;
  }

  if (process.env.NODE_ENV === "development") {
    console.debug("[alert-telemetry]", event.type, event);
  }
  if (event.type === "alert_failed" || event.type === "alert_job_completed") {
    if (event.type === "alert_failed" || event.status === "FAILED") {
      console.error("[alert-telemetry:error]", event);
    }
  }

  for (const sink of sinks) {
    try {
      sink(event);
    } catch {
      // never break request path
    }
  }
}
