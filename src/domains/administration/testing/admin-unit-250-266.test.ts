/**
 * Admin fixtures + RBAC matrix + IDOR + audit append-only + pure transitions
 * (checklist 250–266 unit layer).
 */

import { describe, expect, it } from "vitest";

import {
  buildAdminOpsFixtures,
  fixtureAttentionSignals,
} from "@/domains/administration/testing/admin-ops-fixtures";
import {
  ADMIN_ZONE_ROLE_VALUES,
  listPermissionsForRole,
  roleHasPermission,
  ROLE_PERMISSIONS,
} from "@/domains/administration/rbac/roles";
import {
  PERMISSION_KEYS,
  SENSITIVE_PERMISSIONS,
  isSensitivePermission,
  SENSITIVE_CONFIRM_TOKEN,
  type PermissionKey,
} from "@/domains/administration/rbac/permissions";
import {
  assertSensitiveActionInput,
  SensitiveActionError,
} from "@/domains/administration/rbac/sensitive";
import {
  assertNoSecretsInText,
  deleteAuditLog,
  sanitizeAuditMeta,
  updateAuditLog,
} from "@/domains/administration/audit/ops-audit-log";
import {
  assertActorIsSessionUser,
  AdminApiError,
  rejectUniversalDbEditor,
} from "@/domains/administration/api/admin-api-guards";
import { createNoteBodySchema } from "@/domains/administration/api/admin-dtos";
import {
  statusAfterModerationDecision,
  requiresModerationReason,
  buildUserFacingModerationMessage,
  MODERATION_DECISIONS,
} from "@/domains/properties/admin/moderation-copy";
import {
  canTransitionModelLifecycle,
  assertModelCanGoLive,
} from "@/domains/valuation/admin/metrics";
import { KILL_SWITCH_KEYS } from "@/domains/platform/admin/feature-flags";
import { isUserInPercentageRollout } from "@/domains/platform/admin/feature-flags";

const ALL_ADMIN_ROLES = [
  "PROPERTY_REVIEWER",
  "DATA_ADMIN",
  "COMMERCE_ADMIN",
  "OPERATIONS_ADMIN",
  "ADMIN",
  "SUPER_ADMIN",
] as const;

/** Explicit allow/deny expectations for high-risk keys (251–266). */
const MATRIX: Array<{
  key: PermissionKey;
  allow: readonly string[];
  deny: readonly string[];
}> = [
  {
    key: "property.merge",
    allow: [
      "PROPERTY_REVIEWER",
      "OPERATIONS_ADMIN",
      "ADMIN",
      "SUPER_ADMIN",
    ],
    deny: ["DATA_ADMIN", "COMMERCE_ADMIN", "USER", "SALES"],
  },
  {
    key: "property.moderate",
    allow: [
      "PROPERTY_REVIEWER",
      "OPERATIONS_ADMIN",
      "ADMIN",
      "SUPER_ADMIN",
    ],
    deny: ["DATA_ADMIN", "COMMERCE_ADMIN", "USER"],
  },
  {
    key: "dataQuality.resolve",
    allow: [
      "PROPERTY_REVIEWER",
      "DATA_ADMIN",
      "OPERATIONS_ADMIN",
      "ADMIN",
      "SUPER_ADMIN",
    ],
    deny: ["COMMERCE_ADMIN", "USER"],
  },
  {
    key: "payments.refund",
    allow: ["COMMERCE_ADMIN", "ADMIN", "SUPER_ADMIN"],
    deny: [
      "PROPERTY_REVIEWER",
      "DATA_ADMIN",
      "OPERATIONS_ADMIN",
      "USER",
    ],
  },
  {
    key: "commerce.entitlements.grant",
    allow: ["COMMERCE_ADMIN", "ADMIN", "SUPER_ADMIN"],
    deny: [
      "PROPERTY_REVIEWER",
      "DATA_ADMIN",
      "OPERATIONS_ADMIN",
      "USER",
    ],
  },
  {
    key: "users.delete",
    allow: ["ADMIN", "SUPER_ADMIN"],
    deny: [
      "PROPERTY_REVIEWER",
      "DATA_ADMIN",
      "COMMERCE_ADMIN",
      "OPERATIONS_ADMIN",
      "USER",
    ],
  },
  {
    key: "users.impersonate",
    allow: ["OPERATIONS_ADMIN", "ADMIN", "SUPER_ADMIN"],
    deny: ["COMMERCE_ADMIN", "PROPERTY_REVIEWER", "DATA_ADMIN", "USER"],
  },
  {
    key: "analytics.models.approve",
    allow: ["OPERATIONS_ADMIN", "ADMIN", "SUPER_ADMIN"],
    deny: ["DATA_ADMIN", "PROPERTY_REVIEWER", "COMMERCE_ADMIN", "USER"],
  },
  {
    key: "platform.flags.write",
    allow: ["OPERATIONS_ADMIN", "ADMIN", "SUPER_ADMIN"],
    deny: ["PROPERTY_REVIEWER", "DATA_ADMIN", "COMMERCE_ADMIN", "USER"],
  },
  {
    key: "platform.incidents.write",
    allow: [
      "COMMERCE_ADMIN",
      "OPERATIONS_ADMIN",
      "ADMIN",
      "SUPER_ADMIN",
    ],
    deny: ["PROPERTY_REVIEWER", "DATA_ADMIN", "USER"],
  },
  {
    key: "import.retry",
    allow: ["DATA_ADMIN", "OPERATIONS_ADMIN", "ADMIN", "SUPER_ADMIN"],
    deny: ["PROPERTY_REVIEWER", "COMMERCE_ADMIN", "USER"],
  },
];

describe("Admin fixtures (250)", () => {
  const fixtures = buildAdminOpsFixtures();

  it("includes failed import with error counts", () => {
    expect(fixtures.failedImport.status).toBe("FAILED");
    expect(fixtures.failedImport.errorCount).toBeGreaterThan(0);
    expect(fixtures.failedImport.processedCount).toBe(
      fixtures.failedImport.successCount + fixtures.failedImport.errorCount,
    );
    expect(fixtures.failedImport.items.some((i) => i.status === "FAILED")).toBe(
      true,
    );
  });

  it("includes stale source + stale property", () => {
    expect(fixtures.staleSource.healthStatus).toBe("STALE");
    expect(fixtures.staleSource.lastSeenAt.getTime()).toBeLessThan(
      fixtures.now.getTime() - 7 * 24 * 60 * 60 * 1000,
    );
    expect(fixtures.staleProperty.freshness).toBe("STALE");
    expect(fixtures.staleProperty.sources[0]?.id).toBe(fixtures.staleSource.id);
  });

  it("includes pending moderation listing", () => {
    expect(fixtures.pendingModerationProperty.status).toBe("PENDING_REVIEW");
    expect(fixtures.pendingModerationProperty._count.qualityIssues).toBe(0);
  });

  it("includes payment mismatch without entitlement", () => {
    expect(fixtures.paymentMismatch.order.status).toBe("PAID");
    expect(fixtures.paymentMismatch.payment.status).toBe("SUCCEEDED");
    expect(fixtures.paymentMismatch.entitlement).toBeNull();
    expect(fixtures.paymentMismatch.drift.type).toBe("payment_mismatch");
  });

  it("maps fixtures to attention signals", () => {
    const signals = fixtureAttentionSignals(fixtures);
    const types = new Set(signals.map((s) => s.type));
    expect(types.has("import_failed")).toBe(true);
    expect(types.has("dq_critical")).toBe(true);
    expect(types.has("stale_property")).toBe(true);
    expect(types.has("payment_mismatch")).toBe(true);
    expect(types.has("market_review_required")).toBe(true);
  });

  it("ships governance models with previousActiveModelId for rollback", () => {
    expect(fixtures.activeModel.previousActiveModelId).toBe(
      fixtures.previousActiveModel.id,
    );
    expect(fixtures.activeModel.lifecycleStatus).toBe("ACTIVE");
    expect(fixtures.draftModel.lifecycleStatus).toBe("DRAFT");
  });
});

describe("RBAC permission matrix — all roles allowed/denied (251–266)", () => {
  it("admin zone roles are exactly the ops set", () => {
    expect([...ADMIN_ZONE_ROLE_VALUES].sort()).toEqual(
      [...ALL_ADMIN_ROLES].sort(),
    );
  });

  it("ROLE_PERMISSIONS covers every admin zone role", () => {
    for (const role of ALL_ADMIN_ROLES) {
      if (role === "SUPER_ADMIN") {
        expect(ROLE_PERMISSIONS[role]).toBe("*");
      } else {
        expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true);
        expect((ROLE_PERMISSIONS[role] as PermissionKey[]).length).toBeGreaterThan(
          0,
        );
      }
    }
  });

  it("SUPER_ADMIN has every permission key", () => {
    for (const key of PERMISSION_KEYS) {
      expect(roleHasPermission("SUPER_ADMIN", key)).toBe(true);
    }
    expect(listPermissionsForRole("SUPER_ADMIN")).toEqual([...PERMISSION_KEYS]);
  });

  it("USER / PAID_CLIENT / PARTNER have empty admin permissions", () => {
    for (const role of ["USER", "PAID_CLIENT", "PARTNER"] as const) {
      expect(listPermissionsForRole(role)).toEqual([]);
      expect(roleHasPermission(role, "ops.dashboard.read")).toBe(false);
    }
  });

  for (const row of MATRIX) {
    it(`${row.key}: allow/deny across roles`, () => {
      for (const role of row.allow) {
        expect(roleHasPermission(role, row.key)).toBe(true);
      }
      for (const role of row.deny) {
        expect(roleHasPermission(role, row.key)).toBe(false);
      }
    });
  }

  it("marks sensitive permissions requiring step-up", () => {
    for (const key of SENSITIVE_PERMISSIONS) {
      expect(isSensitivePermission(key)).toBe(true);
    }
    expect(isSensitivePermission("ops.dashboard.read")).toBe(false);
    expect(SENSITIVE_PERMISSIONS).toContain("property.merge");
    expect(SENSITIVE_PERMISSIONS).toContain("commerce.entitlements.grant");
    expect(SENSITIVE_PERMISSIONS).toContain("analytics.models.approve");
  });

  it("step-up rejects short reason and wrong token", () => {
    expect(() =>
      assertSensitiveActionInput({
        reason: "too-short",
        confirmToken: SENSITIVE_CONFIRM_TOKEN,
      }),
    ).toThrow(SensitiveActionError);

    expect(() =>
      assertSensitiveActionInput({
        reason: "Sufficiently long rollback reason",
        confirmToken: "NOPE",
      }),
    ).toThrow(SensitiveActionError);

    expect(() =>
      assertSensitiveActionInput({
        reason: "Sufficiently long rollback reason",
        confirmToken: SENSITIVE_CONFIRM_TOKEN,
      }),
    ).not.toThrow();
  });
});

describe("IDOR & actor binding (251–266)", () => {
  it("blocks client-supplied actor mismatch", () => {
    expect(() => assertActorIsSessionUser("session_user", "attacker")).toThrow(
      AdminApiError,
    );
    expect(() => assertActorIsSessionUser("same", "same")).not.toThrow();
  });

  it("rejects authorUserId on note create schema (IDOR vector)", () => {
    const bad = createNoteBodySchema.safeParse({
      entityKind: "USER",
      entityId: "u1",
      body: "hello note body",
      authorUserId: "attacker",
    });
    expect(bad.success).toBe(false);

    const good = createNoteBodySchema.safeParse({
      entityKind: "PROPERTY",
      entityId: "prop_1",
      body: "legitimate note",
    });
    expect(good.success).toBe(true);
  });

  it("bans universal DB editor endpoint", () => {
    expect(() => rejectUniversalDbEditor()).toThrow(/DB editor/i);
  });

  it("foreign user fixtures cannot share identity with admin actors", () => {
    const f = buildAdminOpsFixtures();
    expect(f.actors.foreignUser.id).not.toBe(f.actors.admin.id);
    expect(f.actors.regularUser.role).toBe("USER");
    expect(roleHasPermission(f.actors.regularUser.role, "users.delete")).toBe(
      false,
    );
  });
});

describe("AuditLog append-only + secret hygiene (275–276, 280–281)", () => {
  it("updateAuditLog always throws", async () => {
    await expect(updateAuditLog()).rejects.toThrow(/append-only/i);
  });

  it("deleteAuditLog always throws", async () => {
    await expect(deleteAuditLog()).rejects.toThrow(/append-only/i);
  });

  it("sanitizeAuditMeta redacts secrets", () => {
    const cleaned = sanitizeAuditMeta({
      entityId: "e1",
      apiKey: "sk_live_xxx",
      nested: { token: "abc", count: 2 },
    }) as Record<string, unknown>;
    expect(cleaned.entityId).toBe("e1");
    expect(cleaned.apiKey).toBe("[REDACTED]");
    expect((cleaned.nested as Record<string, unknown>).token).toBe("[REDACTED]");
    expect((cleaned.nested as Record<string, unknown>).count).toBe(2);
  });

  it("assertNoSecretsInText blocks secret-like summaries", () => {
    expect(() =>
      assertNoSecretsInText("afterSummary", "Bearer eyJhbGciOi"),
    ).toThrow(/secret/i);
    expect(() =>
      assertNoSecretsInText("reason", "Resolved import schema drift"),
    ).not.toThrow();
  });
});

describe("Moderation transitions (pure) (251–266)", () => {
  it("maps every decision to a target status", () => {
    expect(statusAfterModerationDecision("APPROVE")).toBe("ACTIVE");
    expect(statusAfterModerationDecision("REJECT")).toBe("REJECTED");
    expect(statusAfterModerationDecision("REQUEST_CHANGES")).toBe("DRAFT");
    expect(statusAfterModerationDecision("SUSPEND")).toBe("SUSPENDED");
    expect(MODERATION_DECISIONS).toHaveLength(4);
  });

  it("requires reason for reject/suspend/request_changes", () => {
    expect(requiresModerationReason("APPROVE")).toBe(false);
    expect(requiresModerationReason("REJECT")).toBe(true);
    expect(requiresModerationReason("SUSPEND")).toBe(true);
    expect(requiresModerationReason("REQUEST_CHANGES")).toBe(true);
  });

  it("builds safe user-facing copy without internal tokens", () => {
    const msg = buildUserFacingModerationMessage({
      decision: "REJECT",
      reason: "Missing price and internal partner feed sql stack",
    });
    expect(msg).toMatch(/neschválili/i);
    expect(msg.toLowerCase()).not.toContain("partner");
    expect(msg.toLowerCase()).not.toContain("sql");
  });
});

describe("Model lifecycle + feature flag contracts (251–266)", () => {
  it("enforces DRAFT → REVIEW_REQUESTED → APPROVED → ACTIVE", () => {
    expect(canTransitionModelLifecycle("DRAFT", "REVIEW_REQUESTED")).toBe(true);
    expect(canTransitionModelLifecycle("REVIEW_REQUESTED", "APPROVED")).toBe(
      true,
    );
    expect(canTransitionModelLifecycle("APPROVED", "ACTIVE")).toBe(true);
    expect(canTransitionModelLifecycle("DRAFT", "ACTIVE")).toBe(false);
    expect(assertModelCanGoLive("DRAFT").ok).toBe(false);
    expect(assertModelCanGoLive("APPROVED").ok).toBe(true);
  });

  it("defines kill switch keys used by fixtures", () => {
    expect(KILL_SWITCH_KEYS).toContain("kill.payments");
    expect(KILL_SWITCH_KEYS).toContain("kill.new_listings");
    const f = buildAdminOpsFixtures();
    expect(f.killPaymentsFlag.key).toBe("kill.payments");
    expect(f.killPaymentsFlag.enabled).toBe(false);
  });

  it("percentage rollout is deterministic per userId", () => {
    const a = isUserInPercentageRollout("user_regular", 0);
    const b = isUserInPercentageRollout("user_regular", 100);
    expect(a).toBe(false);
    expect(b).toBe(true);
    expect(isUserInPercentageRollout("user_regular", 50)).toBe(
      isUserInPercentageRollout("user_regular", 50),
    );
  });
});
