import { Role } from "@prisma/client";

/**
 * Role hierarchy for coarse permission checks (higher index = more privilege within staff).
 * Product "client" entitlement maps to PAID_CLIENT — never set from the browser.
 */
const ROLE_RANK: Record<Role, number> = {
  USER: 1,
  PAID_CLIENT: 2,
  PARTNER: 3,
  EDITOR: 4,
  ANALYST: 5,
  SALES: 5,
  ADMIN: 8,
  SUPER_ADMIN: 10,
};

export function hasMinRole(userRole: Role, minimum: Role): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[minimum];
}

export function isStaff(role: Role): boolean {
  return (
    role === Role.ANALYST ||
    role === Role.SALES ||
    role === Role.EDITOR ||
    role === Role.ADMIN ||
    role === Role.SUPER_ADMIN
  );
}

export function isAdmin(role: Role): boolean {
  return role === Role.ADMIN || role === Role.SUPER_ADMIN;
}

export { Role };
