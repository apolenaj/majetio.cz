import { Role } from "@prisma/client";

import {
  isAdminZoneRole,
  listPermissionsForRole,
  roleHasPermission,
} from "@/domains/administration/rbac/roles";
import type { PermissionKey } from "@/domains/administration/rbac/permissions";

/**
 * Role hierarchy for coarse permission checks (higher index = more privilege within staff).
 * Fine-grained admin ops use PermissionKey via requirePermission.
 */
const ROLE_RANK: Record<string, number> = {
  USER: 1,
  PAID_CLIENT: 2,
  PARTNER: 3,
  EDITOR: 4,
  ANALYST: 5,
  SALES: 5,
  PROPERTY_REVIEWER: 6,
  DATA_ADMIN: 6,
  COMMERCE_ADMIN: 6,
  OPERATIONS_ADMIN: 7,
  ADMIN: 8,
  SUPER_ADMIN: 10,
};

export function hasMinRole(userRole: Role, minimum: Role): boolean {
  return (ROLE_RANK[userRole] ?? 0) >= (ROLE_RANK[minimum] ?? 0);
}

export function isStaff(role: Role | string): boolean {
  return (
    isAdminZoneRole(role) ||
    role === "ANALYST" ||
    role === "SALES" ||
    role === "EDITOR"
  );
}

/** Legacy coarse admin (ADMIN | SUPER_ADMIN). Prefer requirePermission for new ops. */
export function isAdmin(role: Role | string): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export {
  isAdminZoneRole,
  listPermissionsForRole,
  roleHasPermission,
  type PermissionKey,
};

export { Role };
