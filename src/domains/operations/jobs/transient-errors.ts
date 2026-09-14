/**
 * Classify job / worker failures — only transient errors should retry (Prompt 20.6).
 */

const PERMANENT_PATTERNS = [
  /validation/i,
  /invalid\b/i,
  /not found/i,
  /forbidden/i,
  /unauthorized/i,
  /permanent/i,
  /schema/i,
  /unique constraint/i,
  /foreign key/i,
  /payload/i,
];

const TRANSIENT_PATTERNS = [
  /timeout/i,
  /timed out/i,
  /econnreset/i,
  /econnrefused/i,
  /enotfound/i,
  /socket/i,
  /503/,
  /502/,
  /504/,
  /429/,
  /rate limit/i,
  /temporarily/i,
  /unavailable/i,
  /deadlock/i,
  /serialization/i,
];

export function isTransientJobError(error: string): boolean {
  const msg = error.trim();
  if (!msg) return true;
  if (PERMANENT_PATTERNS.some((re) => re.test(msg))) return false;
  if (TRANSIENT_PATTERNS.some((re) => re.test(msg))) return true;
  // Default: retry once path via maxAttempts (unknown infra errors often transient)
  return true;
}
