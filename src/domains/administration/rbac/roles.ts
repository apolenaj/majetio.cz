/**
 * Role → permission maps (Principle of Least Privilege).
 * SUPER_ADMIN = wildcard (*).
 */

import {
  PERMISSION_KEYS,
  type PermissionKey,
} from "@/domains/administration/rbac/permissions";

const ALL = [...PERMISSION_KEYS] as PermissionKey[];

/** Roles that may enter /admin zone (JWT middleware). */
export const ADMIN_ZONE_ROLE_VALUES = [
  "OPERATIONS_ADMIN",
  "DATA_ADMIN",
  "PROPERTY_REVIEWER",
  "COMMERCE_ADMIN",
  "ADMIN",
  "SUPER_ADMIN",
] as const;

export type AdminZoneRole = (typeof ADMIN_ZONE_ROLE_VALUES)[number];

export function isAdminZoneRole(role: unknown): role is AdminZoneRole {
  return (
    typeof role === "string" &&
    (ADMIN_ZONE_ROLE_VALUES as readonly string[]).includes(role)
  );
}

const PROPERTY_REVIEWER_PERMS: PermissionKey[] = [
  "ops.dashboard.read",
  "ops.search.read",
  "ops.notes.read",
  "ops.notes.write",
  "ops.assignments.read",
  "ops.assignments.write",
  "ops.health.read",
  "ops.jobs.read",
  "property.read",
  "property.merge",
  "property.override",
  "property.moderate",
  "dataQuality.read",
  "dataQuality.resolve",
];

const DATA_ADMIN_PERMS: PermissionKey[] = [
  "ops.dashboard.read",
  "ops.search.read",
  "ops.notes.read",
  "ops.notes.write",
  "ops.assignments.read",
  "ops.health.read",
  "ops.jobs.read",
  "ops.jobs.write",
  "ops.repair.write",
  "property.read",
  "import.read",
  "import.retry",
  "dataQuality.read",
  "dataQuality.resolve",
  "analytics.models.read",
  "analytics.models.write",
  "platform.flags.read",
  "platform.content.read",
  "platform.incidents.read",
];

const COMMERCE_ADMIN_PERMS: PermissionKey[] = [
  "ops.dashboard.read",
  "ops.search.read",
  "ops.notes.read",
  "ops.notes.write",
  "ops.assignments.read",
  "ops.assignments.write",
  "users.read",
  "users.suspend",
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
  "platform.incidents.read",
  "platform.incidents.write",
  "platform.audit.read",
];

const OPERATIONS_ADMIN_PERMS: PermissionKey[] = [
  ...new Set<PermissionKey>([
    ...PROPERTY_REVIEWER_PERMS,
    ...DATA_ADMIN_PERMS,
    "users.read",
    "users.suspend",
    "users.financial_passport.read",
    "users.impersonate",
    "orgs.read",
    "orgs.verify",
    "leads.read",
    "leads.write",
    "payments.read",
    "pricing.read",
    "ops.assignments.write",
    "ops.health.read",
    "ops.jobs.read",
    "ops.jobs.write",
    "ops.repair.write",
    "platform.flags.read",
    "platform.flags.write",
    "platform.markets.write",
    "platform.content.read",
    "platform.content.write",
    "platform.content.publish",
    "platform.incidents.read",
    "platform.incidents.write",
    "platform.audit.read",
    "analytics.models.read",
    "analytics.models.write",
    "analytics.models.approve",
  ]),
];

/** ADMIN ≈ operations + commerce (not full SUPER_ADMIN wildcard). */
const ADMIN_PERMS: PermissionKey[] = [
  ...new Set<PermissionKey>([
    ...OPERATIONS_ADMIN_PERMS,
    ...COMMERCE_ADMIN_PERMS,
    "users.delete",
  ]),
];

export const ROLE_PERMISSIONS: Record<string, PermissionKey[] | "*"> = {
  USER: [],
  PAID_CLIENT: [],
  PARTNER: [],
  EDITOR: [
    "ops.dashboard.read",
    "analytics.models.read",
    "platform.content.read",
    "platform.content.write",
  ],
  ANALYST: [
    "ops.dashboard.read",
    "property.read",
    "dataQuality.read",
    "analytics.models.read",
    "analytics.models.write",
  ],
  SALES: [
    "ops.dashboard.read",
    "ops.search.read",
    "ops.notes.read",
    "ops.notes.write",
    "ops.assignments.read",
    "ops.assignments.write",
    "users.read",
    "payments.read",
    "orgs.read",
    "leads.read",
    "leads.write",
  ],
  PROPERTY_REVIEWER: PROPERTY_REVIEWER_PERMS,
  DATA_ADMIN: DATA_ADMIN_PERMS,
  COMMERCE_ADMIN: COMMERCE_ADMIN_PERMS,
  OPERATIONS_ADMIN: OPERATIONS_ADMIN_PERMS,
  ADMIN: ADMIN_PERMS,
  SUPER_ADMIN: "*",
};

export function listPermissionsForRole(role: string): PermissionKey[] {
  if (role === "SUPER_ADMIN") return ALL;
  const mapped = ROLE_PERMISSIONS[role];
  if (mapped === "*") return ALL;
  if (!mapped) return [];
  return [...mapped];
}

export function roleHasPermission(
  role: string | null | undefined,
  key: PermissionKey,
): boolean {
  if (!role) return false;
  if (role === "SUPER_ADMIN") return true;
  const mapped = ROLE_PERMISSIONS[role];
  if (mapped === "*") return true;
  if (!mapped) return false;
  return mapped.includes(key);
}
