import { describe, expect, it } from "vitest";

import {
  isKillSwitchKey,
  isUserInPercentageRollout,
  KILL_SWITCH_KEYS,
} from "@/domains/platform/admin/feature-flags";
import {
  assertSafeConfigValue,
  getSecretEnvStatuses,
} from "@/domains/platform/admin/config-center";
import {
  canTransitionCmsStatus,
  isTranslationApprovedForPublic,
} from "@/domains/platform/admin/content-governance";
import { isSensitivePermission } from "@/domains/administration/rbac/permissions";
import { roleHasPermission } from "@/domains/administration/rbac/roles";

describe("Kill switches catalog", () => {
  it("covers payments, listings, valuations, markets", () => {
    expect(KILL_SWITCH_KEYS).toEqual([
      "kill.payments",
      "kill.new_listings",
      "kill.valuations",
      "kill.markets",
    ]);
    expect(isKillSwitchKey("kill.payments")).toBe(true);
    expect(isKillSwitchKey("INVESTOR_PRO_ENABLED")).toBe(false);
  });
});

describe("USER_PERCENTAGE rollout", () => {
  it("is stable and respects bounds", () => {
    expect(isUserInPercentageRollout("user-a", 0)).toBe(false);
    expect(isUserInPercentageRollout("user-a", 100)).toBe(true);
    const a = isUserInPercentageRollout("stable-user-1", 50);
    const b = isUserInPercentageRollout("stable-user-1", 50);
    expect(a).toBe(b);
  });
});

describe("Config Center secrets", () => {
  it("never stores secret-looking keys", () => {
    expect(assertSafeConfigValue("api_key", "x").ok).toBe(false);
    expect(assertSafeConfigValue("limits.max", 10).ok).toBe(true);
  });

  it("reports configured without values", () => {
    const statuses = getSecretEnvStatuses({
      DATABASE_URL: "postgres://secret",
      AUTH_SECRET: "",
    });
    const db = statuses.find((s) => s.key === "DATABASE_URL");
    const auth = statuses.find((s) => s.key === "AUTH_SECRET");
    expect(db?.configured).toBe(true);
    expect(auth?.configured).toBe(false);
    expect(JSON.stringify(statuses)).not.toContain("postgres://secret");
  });
});

describe("CMS workflow", () => {
  it("allows DRAFT → REVIEW → PUBLISHED", () => {
    expect(canTransitionCmsStatus("DRAFT", "REVIEW")).toBe(true);
    expect(canTransitionCmsStatus("REVIEW", "PUBLISHED")).toBe(true);
    expect(canTransitionCmsStatus("DRAFT", "PUBLISHED")).toBe(false);
  });

  it("requires APPROVED for regulatory translations", () => {
    expect(isTranslationApprovedForPublic("MACHINE_DRAFT", true)).toBe(false);
    expect(isTranslationApprovedForPublic("REVIEWED", true)).toBe(false);
    expect(isTranslationApprovedForPublic("APPROVED", true)).toBe(true);
    expect(isTranslationApprovedForPublic("REVIEWED", false)).toBe(true);
  });
});

describe("Platform RBAC", () => {
  it("marks flag write / content publish / markets write sensitive", () => {
    expect(isSensitivePermission("platform.flags.write")).toBe(true);
    expect(isSensitivePermission("platform.content.publish")).toBe(true);
    expect(isSensitivePermission("platform.markets.write")).toBe(true);
  });

  it("OPERATIONS_ADMIN can manage flags and content", () => {
    expect(roleHasPermission("OPERATIONS_ADMIN", "platform.flags.write")).toBe(
      true,
    );
    expect(
      roleHasPermission("OPERATIONS_ADMIN", "platform.content.publish"),
    ).toBe(true);
    expect(
      roleHasPermission("OPERATIONS_ADMIN", "platform.incidents.write"),
    ).toBe(true);
  });

  it("EDITOR can write content but not publish or flip flags", () => {
    expect(roleHasPermission("EDITOR", "platform.content.write")).toBe(true);
    expect(roleHasPermission("EDITOR", "platform.content.publish")).toBe(
      false,
    );
    expect(roleHasPermission("EDITOR", "platform.flags.write")).toBe(false);
  });
});
