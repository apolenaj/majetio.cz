/**
 * Structured logger with mandatory PII / secret / Financial Passport redaction.
 * Never log passwords, tokens, or passport amounts.
 */

import { scrubPii } from "@/lib/analytics/scrub-pii";

const SECRET_KEY_RE =
  /^(password|passwd|pwd|secret|token|authorization|cookie|api[_-]?key|access[_-]?token|refresh[_-]?token|private[_-]?key|client[_-]?secret|auth[_-]?secret|session)$/i;

const FINANCIAL_KEY_RE =
  /^(monthlyIncomeCzk|monthlyLiabilitiesCzk|availableEquityCzk|equityPercent|creditScoreBand|income|liabilities|equity|passport|financialProfile|financialPassport|billingStreet|vatId)$/i;

const PATH_RE = /(?:[A-Za-z]:)?(?:\\|\/)(?:Users|home|var|tmp|app)[^:\s"']+/gi;
const SQL_HINT_RE =
  /\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN)\b[\s\S]{0,200}/i;

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogFields = Record<string, unknown>;

function redactValue(key: string, value: unknown): unknown {
  if (SECRET_KEY_RE.test(key) || FINANCIAL_KEY_RE.test(key)) {
    return "[redacted]";
  }
  if (typeof value === "string") {
    let s = value;
    if (/password|bearer\s+[a-z0-9._-]+/i.test(s)) {
      s = "[redacted_secret]";
    }
    s = s.replace(PATH_RE, "[path]");
    if (SQL_HINT_RE.test(s) && process.env.NODE_ENV === "production") {
      s = "[redacted_sql_or_query]";
    }
    return s;
  }
  if (Array.isArray(value)) {
    return value.map((v, i) => redactValue(String(i), v));
  }
  if (value && typeof value === "object") {
    return redactFields(value as Record<string, unknown>);
  }
  return value;
}

function scrubLeaves(value: unknown): unknown {
  if (typeof value === "string") {
    return scrubPii(value);
  }
  if (Array.isArray(value)) {
    return value.map(scrubLeaves);
  }
  if (value && typeof value === "object") {
    const nested: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SECRET_KEY_RE.test(k) || FINANCIAL_KEY_RE.test(k)) {
        nested[k] = "[redacted]";
        continue;
      }
      nested[k] = scrubLeaves(v);
    }
    return nested;
  }
  return value;
}

export function redactFields(input: Record<string, unknown>): Record<string, unknown> {
  return scrubLeaves(input) as Record<string, unknown>;
}

export function redactErrorForClient(err: unknown): {
  message: string;
  digest?: string;
} {
  if (process.env.NODE_ENV !== "production") {
    return {
      message: err instanceof Error ? err.message : "Internal error",
      digest: err instanceof Error ? (err as Error & { digest?: string }).digest : undefined,
    };
  }
  return { message: "Internal server error" };
}

function emit(level: LogLevel, message: string, fields?: LogFields): void {
  const payload = {
    level,
    msg: message,
    ts: new Date().toISOString(),
    ...(fields ? redactFields(fields) : {}),
  };
  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else if (level === "debug" && process.env.NODE_ENV !== "production") {
    console.debug(line);
  } else {
    console.info(line);
  }
}

export const logger = {
  debug: (message: string, fields?: LogFields) => emit("debug", message, fields),
  info: (message: string, fields?: LogFields) => emit("info", message, fields),
  warn: (message: string, fields?: LogFields) => emit("warn", message, fields),
  error: (message: string, fields?: LogFields) => emit("error", message, fields),
  /** Prefer for request-scoped logs — attaches correlationId when present. */
  withCorrelation: (
    level: LogLevel,
    message: string,
    correlationId: string | null | undefined,
    fields?: LogFields,
  ) =>
    emit(level, message, {
      ...fields,
      ...(correlationId ? { correlationId } : {}),
    }),
};
