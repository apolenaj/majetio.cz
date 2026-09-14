/**
 * Error tracker adapter — noop until SENTRY_DSN / ERROR_TRACKER_WEBHOOK is set.
 * Never send PII; scrub via logger redaction helpers at call sites.
 */

import { redactFields, logger } from "@/lib/security/logger";

export type ErrorTrackerEvent = {
  message: string;
  name?: string;
  stack?: string;
  correlationId?: string | null;
  tags?: Record<string, string>;
  level?: "error" | "warning" | "info";
};

export type ErrorTracker = {
  name: string;
  captureException: (err: unknown, context?: Omit<ErrorTrackerEvent, "message">) => void;
  captureMessage: (message: string, context?: Omit<ErrorTrackerEvent, "message">) => void;
};

function toEvent(err: unknown, context?: Omit<ErrorTrackerEvent, "message">): ErrorTrackerEvent {
  if (err instanceof Error) {
    return {
      message: err.message.slice(0, 500),
      name: err.name,
      stack: process.env.NODE_ENV === "production" ? undefined : err.stack?.slice(0, 2000),
      ...context,
    };
  }
  return {
    message: String(err).slice(0, 500),
    ...context,
  };
}

const noopTracker: ErrorTracker = {
  name: "noop",
  captureException() {
    /* production default until SENTRY_DSN configured */
  },
  captureMessage() {},
};

const consoleTracker: ErrorTracker = {
  name: "console",
  captureException(err, context) {
    const event = toEvent(err, context);
    logger.error("error_tracker.exception", redactFields({ ...event }) as Record<string, unknown>);
  },
  captureMessage(message, context) {
    logger.warn("error_tracker.message", redactFields({ message, ...context }) as Record<string, unknown>);
  },
};

/**
 * Optional HTTPS webhook (e.g. Better Stack / custom) — POST JSON, no PII fields.
 * Set ERROR_TRACKER_WEBHOOK_URL in staging/prod when ready.
 */
function webhookTracker(url: string): ErrorTracker {
  return {
    name: "webhook",
    captureException(err, context) {
      const event = toEvent(err, context);
      void fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "exception",
          ...redactFields(event as unknown as Record<string, unknown>),
        }),
      }).catch(() => undefined);
    },
    captureMessage(message, context) {
      void fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "message",
          message: message.slice(0, 500),
          ...redactFields({ ...(context ?? {}) } as Record<string, unknown>),
        }),
      }).catch(() => undefined);
    },
  };
}

let override: ErrorTracker | null = null;

export function setErrorTracker(tracker: ErrorTracker | null): void {
  override = tracker;
}

export function getErrorTracker(): ErrorTracker {
  if (override) return override;
  const webhook = process.env.ERROR_TRACKER_WEBHOOK_URL?.trim();
  if (webhook?.startsWith("https://")) return webhookTracker(webhook);
  if (process.env.ERROR_TRACKER === "console" || process.env.NODE_ENV === "development") {
    return consoleTracker;
  }
  return noopTracker;
}

export function captureException(
  err: unknown,
  context?: Omit<ErrorTrackerEvent, "message">,
): void {
  getErrorTracker().captureException(err, context);
}

export function captureMessage(
  message: string,
  context?: Omit<ErrorTrackerEvent, "message">,
): void {
  getErrorTracker().captureMessage(message, context);
}
