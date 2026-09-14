/**
 * UTM helpers — capture campaign params without PII.
 * Never put email/phone/user id into utm_* values.
 */

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export type UtmParams = Partial<Record<(typeof UTM_KEYS)[number], string>>;

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_RE = /\+?\d[\d\s().-]{7,}\d/;

/** Reject values that look like PII or are oversized. */
export function sanitizeUtmValue(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().slice(0, 80);
  if (!trimmed) return null;
  if (EMAIL_RE.test(trimmed) || PHONE_RE.test(trimmed)) return null;
  if (/^(password|token|session)/i.test(trimmed)) return null;
  return trimmed;
}

export function parseUtmFromSearchParams(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
): UtmParams {
  const get = (key: string): string | null => {
    if (params instanceof URLSearchParams) {
      return params.get(key);
    }
    const v = params[key];
    if (Array.isArray(v)) return v[0] ?? null;
    return v ?? null;
  };

  const out: UtmParams = {};
  for (const key of UTM_KEYS) {
    const clean = sanitizeUtmValue(get(key));
    if (clean) out[key] = clean;
  }
  return out;
}

export function utmContainsPii(params: UtmParams): boolean {
  return Object.values(params).some(
    (v) => typeof v === "string" && (EMAIL_RE.test(v) || PHONE_RE.test(v)),
  );
}
