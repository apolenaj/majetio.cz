/**
 * Pure access classification for secret comparison shares (no DB).
 * Used by resolveSecretShare + unit tests for valid / invalid / expired / revoked.
 */

export type SecretShareAccessStatus =
  | "ok"
  | "invalid"
  | "revoked"
  | "expired";

export function classifySecretShareAccess(input: {
  /** Token too short / empty → invalid before DB lookup. */
  tokenOk: boolean;
  /** Row found for token hash. */
  found: boolean;
  revokedAt?: Date | null;
  expiresAt?: Date | null;
  now?: Date;
}): SecretShareAccessStatus {
  if (!input.tokenOk) return "invalid";
  if (!input.found) return "invalid";
  if (input.revokedAt != null) return "revoked";
  const now = input.now ?? new Date();
  if (input.expiresAt != null && input.expiresAt.getTime() < now.getTime()) {
    return "expired";
  }
  return "ok";
}

export function secretShareAccessErrorCs(
  status: SecretShareAccessStatus,
): string {
  switch (status) {
    case "expired":
      return "Platnost odkazu vypršela.";
    case "revoked":
      return "Odkaz neexistuje nebo byl zneplatněn.";
    case "invalid":
    default:
      return "Neplatný odkaz.";
  }
}
