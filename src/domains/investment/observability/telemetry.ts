/**
 * Calculation observability — latency, errors, missing-input rate.
 * Never logs PII or raw CZK amounts (Part 2/D).
 */

export type CalculationTelemetryEvent =
  | {
      type: "calculation_completed";
      status: "CALCULATED" | "PARTIAL" | "FAILED";
      latencyMs: number;
      engineVersion: string;
      availableMetricCount: number;
      unavailableMetricCount: number;
      warningCount: number;
      missingInputRate: number;
    }
  | {
      type: "calculation_error";
      category: string;
      code: string;
      latencyMs: number;
      engineVersion: string;
    };

export type CalculationTelemetrySink = (
  event: CalculationTelemetryEvent,
) => void;

const sinks: CalculationTelemetrySink[] = [];

/** Register a sink (tests / future OpenTelemetry adapter). */
export function registerCalculationTelemetrySink(
  sink: CalculationTelemetrySink,
): () => void {
  sinks.push(sink);
  return () => {
    const i = sinks.indexOf(sink);
    if (i >= 0) sinks.splice(i, 1);
  };
}

export function emitCalculationTelemetry(
  event: CalculationTelemetryEvent,
): void {
  if (process.env.NODE_ENV === "development") {
    // Structured console — no amounts / emails
    console.debug("[investment-telemetry]", event.type, {
      ...("status" in event ? { status: event.status } : {}),
      ...("category" in event ? { category: event.category, code: event.code } : {}),
      latencyMs: event.latencyMs,
      engineVersion: event.engineVersion,
      ...("missingInputRate" in event
        ? { missingInputRate: event.missingInputRate }
        : {}),
    });
  }
  for (const sink of sinks) {
    try {
      sink(event);
    } catch {
      // Telemetry must never break calculation path
    }
  }
}

export function computeMissingInputRate(
  available: number,
  unavailable: number,
): number {
  const total = available + unavailable;
  if (total <= 0) return 0;
  return Math.round((unavailable / total) * 1000) / 1000;
}

/**
 * Wrap a pure calculation with latency + status telemetry.
 * Does not persist; safe for client and server.
 */
export function withCalculationTelemetry<T extends {
  status: "CALCULATED" | "PARTIAL" | "FAILED";
  engineVersion: string;
  availableMetrics: unknown[];
  unavailableMetrics: unknown[];
  warnings?: unknown[];
  resultWarnings?: unknown[];
  issues?: Array<{ category: string; code: string }>;
}>(run: () => T): T {
  const started = performance.now();
  try {
    const result = run();
    const latencyMs = Math.round((performance.now() - started) * 100) / 100;
    const availableMetricCount = result.availableMetrics.length;
    const unavailableMetricCount = result.unavailableMetrics.length;
    emitCalculationTelemetry({
      type: "calculation_completed",
      status: result.status,
      latencyMs,
      engineVersion: result.engineVersion,
      availableMetricCount,
      unavailableMetricCount,
      warningCount:
        (result.resultWarnings?.length ?? 0) + (result.warnings?.length ?? 0),
      missingInputRate: computeMissingInputRate(
        availableMetricCount,
        unavailableMetricCount,
      ),
    });

    if (result.status === "FAILED" && result.issues && result.issues.length > 0) {
      const issue = result.issues[0]!;
      emitCalculationTelemetry({
        type: "calculation_error",
        category: issue.category,
        code: issue.code,
        latencyMs,
        engineVersion: result.engineVersion,
      });
    }

    return result;
  } catch (err) {
    const latencyMs = Math.round((performance.now() - started) * 100) / 100;
    emitCalculationTelemetry({
      type: "calculation_error",
      category: "numerical_failure",
      code: err instanceof Error ? err.name : "unknown",
      latencyMs,
      engineVersion: "unknown",
    });
    throw err;
  }
}
