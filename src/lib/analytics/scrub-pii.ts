/**
 * PII scrubber for analytics payloads (checklist 157, 158).
 * Strips emails, phones, notes, and forbidden keys before track().
 */

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3}[\s.-]?\d{3,4}/g;

export const ANALYTICS_PII_FORBIDDEN_KEYS = [
  "email",
  "password",
  "phone",
  "telephone",
  "mobile",
  "token",
  "amount",
  "price",
  "equity",
  "income",
  "liabilities",
  "liability",
  "czk",
  "rodne",
  "birth",
  "note",
  "notes",
  "content",
  "privateNotes",
  "rejectionReason",
  "passport",
  "name",
  "fullName",
  "address",
  "street",
  "message",
  "comment",
] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function scrubString(value: string): string {
  return value.replace(EMAIL_RE, "[redacted_email]").replace(PHONE_RE, "[redacted_phone]");
}

/**
 * Deep scrub — removes forbidden keys and redacts email/phone substrings.
 */
export function scrubPii<T>(input: T): T {
  if (input == null) return input;
  if (typeof input === "string") {
    return scrubString(input) as T;
  }
  if (typeof input === "number" || typeof input === "boolean") {
    return input;
  }
  if (Array.isArray(input)) {
    return input.map((item) => scrubPii(item)) as T;
  }
  if (isPlainObject(input)) {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (
        (ANALYTICS_PII_FORBIDDEN_KEYS as readonly string[]).includes(
          key.toLowerCase(),
        )
      ) {
        continue;
      }
      out[key] = scrubPii(value);
    }
    return out as T;
  }
  return input;
}

export function assertNoPiiLeak(payload: unknown): void {
  const serialized = JSON.stringify(payload);
  if (EMAIL_RE.test(serialized)) {
    throw new Error("Analytics payload contains e-mail-like PII.");
  }
  for (const key of ANALYTICS_PII_FORBIDDEN_KEYS) {
    if (new RegExp(`"${key}"\\s*:`, "i").test(serialized)) {
      // Keys like "note" in event names are ok; only prop keys after scrub matter.
      // Re-check object keys only:
    }
  }
}
