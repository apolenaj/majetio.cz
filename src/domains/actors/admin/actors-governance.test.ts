import { describe, expect, it } from "vitest";

import {
  maskFinancialPassport,
} from "@/domains/users/admin/user-ops";
import {
  assertCannotForcePaymentSucceeded,
  buildPricingPreview,
} from "@/domains/commerce/admin/pricing-governance";
import { isSensitivePermission } from "@/domains/administration/rbac/permissions";
import { roleHasPermission } from "@/domains/administration/rbac/roles";

describe("Financial Passport privacy default", () => {
  it("masks passport by default", () => {
    const masked = maskFinancialPassport();
    expect(masked.visible).toBe(false);
    expect(masked.masked).toBe(true);
    expect(masked.message).toMatch(/financial_passport\.read/i);
  });

  it("treats passport + impersonate as sensitive", () => {
    expect(isSensitivePermission("users.financial_passport.read")).toBe(true);
    expect(isSensitivePermission("users.impersonate")).toBe(true);
    expect(isSensitivePermission("pricing.approve")).toBe(true);
  });
});

describe("Agent KYC vs listing verification", () => {
  it("keeps KYC permission separate from property moderate", () => {
    expect(roleHasPermission("COMMERCE_ADMIN", "orgs.verify")).toBe(true);
    expect(roleHasPermission("COMMERCE_ADMIN", "property.moderate")).toBe(
      false,
    );
    expect(roleHasPermission("PROPERTY_REVIEWER", "orgs.verify")).toBe(false);
    expect(roleHasPermission("PROPERTY_REVIEWER", "property.moderate")).toBe(
      true,
    );
  });
});

describe("Pricing governance", () => {
  it("only DRAFT plans can activate via preview", () => {
    const draft = buildPricingPreview({
      key: "pro",
      versionKey: "v2",
      name: "Pro",
      priceGrossMinor: 99000,
      currency: "CZK",
      activeFrom: new Date("2026-08-01"),
      status: "DRAFT",
    });
    expect(draft.canActivate).toBe(true);

    const active = buildPricingPreview({
      key: "pro",
      versionKey: "v1",
      name: "Pro",
      priceGrossMinor: 79000,
      currency: "CZK",
      activeFrom: new Date("2026-01-01"),
      status: "ACTIVE",
    });
    expect(active.canActivate).toBe(false);
    expect(active.warnings.some((w) => /DRAFT/i.test(w))).toBe(true);
  });
});

describe("Payment SUCCEEDED hard guard", () => {
  it("refuses manual force to SUCCEEDED", () => {
    const blocked = assertCannotForcePaymentSucceeded();
    expect(blocked.ok).toBe(false);
    expect(blocked.error).toMatch(/SUCCEEDED/);
    expect(blocked.error).toMatch(/reconcile/i);
  });
});

describe("Lead + pricing RBAC", () => {
  it("COMMERCE_ADMIN owns leads and pricing approve", () => {
    expect(roleHasPermission("COMMERCE_ADMIN", "leads.read")).toBe(true);
    expect(roleHasPermission("COMMERCE_ADMIN", "leads.write")).toBe(true);
    expect(roleHasPermission("COMMERCE_ADMIN", "pricing.read")).toBe(true);
    expect(roleHasPermission("COMMERCE_ADMIN", "pricing.approve")).toBe(true);
  });

  it("PROPERTY_REVIEWER cannot impersonate or read financial passport", () => {
    expect(
      roleHasPermission("PROPERTY_REVIEWER", "users.impersonate"),
    ).toBe(false);
    expect(
      roleHasPermission("PROPERTY_REVIEWER", "users.financial_passport.read"),
    ).toBe(false);
  });
});
