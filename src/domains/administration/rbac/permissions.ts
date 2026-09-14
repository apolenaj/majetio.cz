/**
 * Granular permission keys for Admin & Operations Control Center.
 * Code catalog — no Permission DB table in v1.
 */

export const PERMISSION_KEYS = [
  "ops.dashboard.read",
  "ops.search.read",
  "ops.notes.read",
  "ops.notes.write",
  "ops.assignments.read",
  "ops.assignments.write",
  "ops.health.read",
  "ops.jobs.read",
  "ops.jobs.write",
  "ops.repair.write",
  "property.read",
  "property.merge",
  "property.override",
  "property.moderate",
  "import.read",
  "import.retry",
  "dataQuality.read",
  "dataQuality.resolve",
  "analytics.models.read",
  "analytics.models.write",
  "analytics.models.approve",
  "users.read",
  "users.suspend",
  "users.financial_passport.read",
  "users.impersonate",
  "users.delete",
  "orgs.read",
  "orgs.verify",
  "orgs.billing.write",
  "leads.read",
  "leads.write",
  "payments.read",
  "payments.refund",
  "commerce.entitlements.grant",
  "pricing.read",
  "pricing.write",
  "pricing.approve",
  "platform.flags.read",
  "platform.flags.write",
  "platform.markets.write",
  "platform.content.read",
  "platform.content.write",
  "platform.content.publish",
  "platform.incidents.read",
  "platform.incidents.write",
  "platform.audit.read",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export function isPermissionKey(value: string): value is PermissionKey {
  return (PERMISSION_KEYS as readonly string[]).includes(value);
}

/** Permissions that require step-up (reason + confirm token). */
export const SENSITIVE_PERMISSIONS = [
  "users.delete",
  "users.financial_passport.read",
  "users.impersonate",
  "payments.refund",
  "commerce.entitlements.grant",
  "orgs.billing.write",
  "property.merge",
  "analytics.models.approve",
  "pricing.approve",
  "platform.flags.write",
  "platform.content.publish",
  "platform.markets.write",
] as const satisfies readonly PermissionKey[];

export type SensitivePermissionKey = (typeof SENSITIVE_PERMISSIONS)[number];

export function isSensitivePermission(
  key: PermissionKey,
): key is SensitivePermissionKey {
  return (SENSITIVE_PERMISSIONS as readonly string[]).includes(key);
}

/** Confirm token required for sensitive step-up (v1). */
export const SENSITIVE_CONFIRM_TOKEN = "CONFIRM_ACTION";

export const SENSITIVE_REASON_MIN_LENGTH = 12;
