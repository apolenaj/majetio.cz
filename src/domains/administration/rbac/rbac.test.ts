import { describe, expect, it } from "vitest";

import {
  roleHasPermission,
  listPermissionsForRole,
  isAdminZoneRole,
} from "@/domains/administration/rbac/roles";
import {
  assertSensitiveActionInput,
  SensitiveActionError,
  SENSITIVE_CONFIRM_TOKEN,
} from "@/domains/administration/rbac/sensitive";

describe("Admin RBAC least privilege", () => {
  it("PROPERTY_REVIEWER cannot refund payments", () => {
    expect(roleHasPermission("PROPERTY_REVIEWER", "property.read")).toBe(true);
    expect(roleHasPermission("PROPERTY_REVIEWER", "property.merge")).toBe(true);
    expect(roleHasPermission("PROPERTY_REVIEWER", "property.moderate")).toBe(true);
    expect(roleHasPermission("PROPERTY_REVIEWER", "payments.refund")).toBe(
      false,
    );
    expect(isAdminZoneRole("PROPERTY_REVIEWER")).toBe(true);
  });

  it("COMMERCE_ADMIN can refund but not merge properties", () => {
    expect(roleHasPermission("COMMERCE_ADMIN", "payments.refund")).toBe(true);
    expect(roleHasPermission("COMMERCE_ADMIN", "property.merge")).toBe(false);
    expect(roleHasPermission("COMMERCE_ADMIN", "orgs.verify")).toBe(true);
    expect(roleHasPermission("COMMERCE_ADMIN", "pricing.approve")).toBe(true);
    expect(roleHasPermission("COMMERCE_ADMIN", "leads.write")).toBe(true);
  });

  it("OPERATIONS_ADMIN can reveal passport / impersonate; COMMERCE cannot", () => {
    expect(
      roleHasPermission("OPERATIONS_ADMIN", "users.financial_passport.read"),
    ).toBe(true);
    expect(roleHasPermission("OPERATIONS_ADMIN", "users.impersonate")).toBe(
      true,
    );
    expect(
      roleHasPermission("COMMERCE_ADMIN", "users.financial_passport.read"),
    ).toBe(false);
    expect(roleHasPermission("COMMERCE_ADMIN", "users.impersonate")).toBe(
      false,
    );
  });

  it("DATA_ADMIN owns imports + DQ, not user delete", () => {
    expect(roleHasPermission("DATA_ADMIN", "import.read")).toBe(true);
    expect(roleHasPermission("DATA_ADMIN", "dataQuality.resolve")).toBe(true);
    expect(roleHasPermission("DATA_ADMIN", "analytics.models.write")).toBe(
      true,
    );
    expect(roleHasPermission("DATA_ADMIN", "analytics.models.approve")).toBe(
      false,
    );
    expect(roleHasPermission("DATA_ADMIN", "users.delete")).toBe(false);
  });

  it("OPERATIONS_ADMIN can approve analytics models", () => {
    expect(
      roleHasPermission("OPERATIONS_ADMIN", "analytics.models.approve"),
    ).toBe(true);
  });

  it("SUPER_ADMIN has all permissions", () => {
    const all = listPermissionsForRole("SUPER_ADMIN");
    expect(all.length).toBeGreaterThan(10);
    expect(roleHasPermission("SUPER_ADMIN", "payments.refund")).toBe(true);
    expect(roleHasPermission("SUPER_ADMIN", "users.delete")).toBe(true);
    expect(roleHasPermission("SUPER_ADMIN", "platform.markets.write")).toBe(
      true,
    );
  });

  it("USER cannot enter admin zone", () => {
    expect(isAdminZoneRole("USER")).toBe(false);
    expect(roleHasPermission("USER", "ops.dashboard.read")).toBe(false);
  });
});

describe("Sensitive action step-up", () => {
  it("rejects short reason and wrong confirm token", () => {
    expect(() =>
      assertSensitiveActionInput({
        reason: "short",
        confirmToken: SENSITIVE_CONFIRM_TOKEN,
      }),
    ).toThrow(SensitiveActionError);

    expect(() =>
      assertSensitiveActionInput({
        reason: "Valid reason text here",
        confirmToken: "WRONG",
      }),
    ).toThrow(SensitiveActionError);

    expect(() =>
      assertSensitiveActionInput({
        reason: "Valid reason text here",
        confirmToken: SENSITIVE_CONFIRM_TOKEN,
      }),
    ).not.toThrow();
  });
});
