/**
 * Authorization for property visibility (Prompt 7 Part 5 — IDOR guard).
 */

import type { PropertyRecord, PropertyVisibility } from "./dto";

export type PropertyViewer = {
  userId?: string | null;
  role?: "PUBLIC" | "USER" | "OWNER" | "STAFF" | "ADMIN" | string | null;
};

export function canViewProperty(
  record: Pick<PropertyRecord, "visibility" | "ownerUserId" | "status">,
  viewer: PropertyViewer = {},
): boolean {
  const visibility = record.visibility as PropertyVisibility;
  const role = (viewer.role ?? "PUBLIC").toUpperCase();
  const isStaff = role === "STAFF" || role === "ADMIN";

  if (isStaff) return true;

  if (visibility === "PUBLIC") {
    return true;
  }

  if (!viewer.userId) return false;

  if (visibility === "PRIVATE" || visibility === "ACCOUNT_ONLY") {
    return record.ownerUserId != null && record.ownerUserId === viewer.userId;
  }

  return false;
}

/** Resolve DTO viewer role from auth context. */
export function resolveViewerRole(
  record: Pick<PropertyRecord, "ownerUserId">,
  viewer: PropertyViewer = {},
): "PUBLIC" | "OWNER" | "STAFF" {
  const role = (viewer.role ?? "PUBLIC").toUpperCase();
  if (role === "STAFF" || role === "ADMIN") return "STAFF";
  if (viewer.userId && record.ownerUserId === viewer.userId) return "OWNER";
  return "PUBLIC";
}
