/**
 * PII masking for admin surfaces (190–192).
 * Never return full phone / national ID on default admin DTOs.
 */

export function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.indexOf("@");
  if (at <= 0) return "***";
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

/**
 * Partial phone mask — keep country hint + last 2 digits.
 * Examples: +420777123456 → +420***56
 */
export function maskPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.length < 4) return "***";
  const suffix = digits.slice(-2);
  if (digits.startsWith("+") && digits.length >= 6) {
    const cc = digits.slice(0, Math.min(4, digits.length - 2));
    return `${cc}***${suffix}`;
  }
  return `***${suffix}`;
}

export function maskIban(iban: string | null | undefined): string | null {
  if (!iban) return null;
  const compact = iban.replace(/\s+/g, "").toUpperCase();
  if (compact.length < 8) return "****";
  return `${compact.slice(0, 4)}****${compact.slice(-4)}`;
}

export function maskNationalId(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const compact = value.replace(/\s+/g, "");
  if (compact.length < 4) return "****";
  return `****${compact.slice(-2)}`;
}

/** Strip keys that must never appear on admin list/search DTOs. */
export function omitSensitiveKeys<T extends Record<string, unknown>>(
  row: T,
  keys: readonly string[] = [
    "passwordHash",
    "password",
    "token",
    "secret",
    "apiKey",
    "accessToken",
    "refreshToken",
  ],
): Partial<T> {
  const out: Record<string, unknown> = { ...row };
  for (const key of keys) {
    delete out[key];
  }
  return out as Partial<T>;
}
