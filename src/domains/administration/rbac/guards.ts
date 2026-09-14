/**
 * Server-side permission guards for Admin Control Center.
 */

import { AuthError, requireUser } from "@/lib/auth/guards";
import {
  roleHasPermission,
  listPermissionsForRole,
  isAdminZoneRole,
} from "@/domains/administration/rbac/roles";
import type { PermissionKey } from "@/domains/administration/rbac/permissions";

export function hasPermission(
  role: string | null | undefined,
  key: PermissionKey,
): boolean {
  return roleHasPermission(role, key);
}

export async function requirePermission(key: PermissionKey) {
  const user = await requireUser();
  if (!isAdminZoneRole(user.role) || !roleHasPermission(user.role, key)) {
    throw new AuthError(`Chybí oprávnění: ${key}`);
  }
  return user;
}

export async function requireAnyPermission(...keys: PermissionKey[]) {
  const user = await requireUser();
  if (!isAdminZoneRole(user.role)) {
    throw new AuthError("Nemáte přístup do administrace.");
  }
  const ok = keys.some((k) => roleHasPermission(user.role, k));
  if (!ok) {
    throw new AuthError(`Chybí oprávnění: ${keys.join(" | ")}`);
  }
  return user;
}

export { listPermissionsForRole };
