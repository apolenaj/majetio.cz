/**
 * Source health thresholds (HEALTHY → DISABLED).
 */

export type SourceHealthStatus =
  | "HEALTHY"
  | "DEGRADED"
  | "UNHEALTHY"
  | "DISABLED";

export const SOURCE_HEALTH_STATUSES: SourceHealthStatus[] = [
  "HEALTHY",
  "DEGRADED",
  "UNHEALTHY",
  "DISABLED",
];

export function isLicenseExpired(
  expiresAt: Date | string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!expiresAt) return false;
  const d = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  return d.getTime() <= now.getTime();
}

/**
 * Derive health from config + freshness signal.
 * Explicit DISABLED / expired license always wins.
 */
export function computeSourceHealth(input: {
  configuredHealth?: SourceHealthStatus | null;
  importEnabled: boolean;
  licenseExpiresAt?: Date | null;
  lastSeenAt?: Date | null;
  /** 0–1 share of stale source rows for provider. */
  staleSourceRatio?: number;
  now?: Date;
}): SourceHealthStatus {
  if (!input.importEnabled) return "DISABLED";
  if (isLicenseExpired(input.licenseExpiresAt, input.now)) return "DISABLED";
  if (input.configuredHealth === "DISABLED") return "DISABLED";
  if (input.configuredHealth === "UNHEALTHY") return "UNHEALTHY";
  if (input.configuredHealth === "DEGRADED") return "DEGRADED";

  const ratio = input.staleSourceRatio ?? 0;
  if (ratio >= 0.5) return "UNHEALTHY";
  if (ratio >= 0.2) return "DEGRADED";
  return input.configuredHealth ?? "HEALTHY";
}
