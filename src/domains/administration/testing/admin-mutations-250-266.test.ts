/**
 * Mutation-level admin tests with Prisma mocks (251–266).
 * Covers moderation apply, feature flags, model rollback, DQ transition,
 * audit write path, and IDOR-ish ownership checks.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildAdminOpsFixtures } from "@/domains/administration/testing/admin-ops-fixtures";

const fixtures = buildAdminOpsFixtures();

const auditLogCreate = vi.fn();
const writeAuditLog = vi.fn().mockResolvedValue(undefined);

const propertyFindUnique = vi.fn();
const propertyUpdate = vi.fn();
const propertyStatusHistoryCreate = vi.fn();

const dqFindUnique = vi.fn();
const dqUpdate = vi.fn();

const flagFindUnique = vi.fn();
const flagUpdate = vi.fn();
const flagChangeCreate = vi.fn();

const modelFindUnique = vi.fn();
const modelUpdate = vi.fn();
const modelGovernanceCreate = vi.fn();

const incidentFindUnique = vi.fn();
const incidentUpdate = vi.fn();
const incidentTimelineCreate = vi.fn();

const userFindUnique = vi.fn();
const entitlementCreate = vi.fn();

vi.mock("@/lib/auth/audit", () => ({
  writeAuditLog: (...args: unknown[]) => writeAuditLog(...args),
}));

vi.mock("@/domains/revenue/monetization-audit", () => ({
  writeMonetizationAuditLog: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    auditLog: {
      create: (...a: unknown[]) => auditLogCreate(...a),
    },
    property: {
      findUnique: (...a: unknown[]) => propertyFindUnique(...a),
      update: (...a: unknown[]) => propertyUpdate(...a),
    },
    propertyStatusHistory: {
      create: (...a: unknown[]) => propertyStatusHistoryCreate(...a),
    },
    dataQualityIssue: {
      findUnique: (...a: unknown[]) => dqFindUnique(...a),
      update: (...a: unknown[]) => dqUpdate(...a),
    },
    featureFlag: {
      findUnique: (...a: unknown[]) => flagFindUnique(...a),
      update: (...a: unknown[]) => flagUpdate(...a),
    },
    featureFlagChange: {
      create: (...a: unknown[]) => flagChangeCreate(...a),
    },
    valuationModelRegistry: {
      findUnique: (...a: unknown[]) => modelFindUnique(...a),
      update: (...a: unknown[]) => modelUpdate(...a),
    },
    modelGovernanceEvent: {
      create: (...a: unknown[]) => modelGovernanceCreate(...a),
    },
    incident: {
      findUnique: (...a: unknown[]) => incidentFindUnique(...a),
      update: (...a: unknown[]) => incidentUpdate(...a),
    },
    incidentTimelineEvent: {
      create: (...a: unknown[]) => incidentTimelineCreate(...a),
    },
    user: {
      findUnique: (...a: unknown[]) => userFindUnique(...a),
    },
    entitlement: {
      create: (...a: unknown[]) => entitlementCreate(...a),
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        valuationModelRegistry: {
          findUnique: (...a: unknown[]) => modelFindUnique(...a),
          update: (...a: unknown[]) => modelUpdate(...a),
          updateMany: vi.fn().mockResolvedValue({ count: 0 }),
          findFirst: vi.fn().mockResolvedValue(null),
        },
        modelGovernanceEvent: {
          create: (...a: unknown[]) => modelGovernanceCreate(...a),
        },
      };
      return fn(tx);
    },
  },
}));

import { writeOpsAuditLog } from "@/domains/administration/audit/ops-audit-log";
import { applyModerationDecision } from "@/domains/properties/admin/moderation-service";
import { transitionDataQualityIssue } from "@/domains/data-quality/admin/issues";
import { setFeatureFlagEnabled } from "@/domains/platform/admin/feature-flags";
import { rollbackValuationModel } from "@/domains/valuation/admin/control-center";
import { updateIncidentStatus } from "@/domains/administration/incidents/incident-ops";
import { grantManualEntitlement } from "@/domains/entitlements/manual";
import { roleHasPermission } from "@/domains/administration/rbac/roles";

describe("Audit write path is append-only create (251–266)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auditLogCreate.mockResolvedValue({ id: "audit_1" });
  });

  it("writeOpsAuditLog creates a row and never updates", async () => {
    const row = await writeOpsAuditLog({
      action: "ops.test.append",
      entityType: "Property",
      entityId: fixtures.pendingModerationProperty.id,
      actorId: fixtures.actors.propertyReviewer.id,
      reason: "Unit test append-only write",
      afterSummary: "PENDING_REVIEW inspected",
      meta: { apiKey: "should-redact", note: "ok" },
    });
    expect(row.id).toBe("audit_1");
    expect(auditLogCreate).toHaveBeenCalledTimes(1);
    const arg = auditLogCreate.mock.calls[0]?.[0] as {
      data: { meta?: Record<string, unknown>; action: string };
    };
    expect(arg.data.action).toBe("ops.test.append");
    expect(arg.data.meta?.apiKey).toBe("[REDACTED]");
    expect(arg.data.meta?.note).toBe("ok");
  });
});

describe("Moderation applyModerationDecision (251–266)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    propertyUpdate.mockResolvedValue({});
    propertyStatusHistoryCreate.mockResolvedValue({});
    writeAuditLog.mockResolvedValue(undefined);
  });

  it("approves PENDING_REVIEW → ACTIVE when publishable", async () => {
    propertyFindUnique.mockResolvedValue({
      ...fixtures.pendingModerationProperty,
      _count: { qualityIssues: 0 },
    });

    const result = await applyModerationDecision({
      propertyId: fixtures.pendingModerationProperty.id,
      decision: "APPROVE",
      reason: "Looks complete",
      actorUserId: fixtures.actors.propertyReviewer.id,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.userFacingMessage).toMatch(/schválena/i);
    }
    expect(propertyUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "ACTIVE" }),
      }),
    );
    expect(writeAuditLog).toHaveBeenCalled();
  });

  it("rejects without sufficient reason", async () => {
    propertyFindUnique.mockResolvedValue({
      ...fixtures.pendingModerationProperty,
      _count: { qualityIssues: 0 },
    });
    const result = await applyModerationDecision({
      propertyId: fixtures.pendingModerationProperty.id,
      decision: "REJECT",
      reason: "no",
      actorUserId: fixtures.actors.propertyReviewer.id,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/reason/i);
    expect(propertyUpdate).not.toHaveBeenCalled();
  });

  it("PROPERTY_REVIEWER may moderate; COMMERCE may not (RBAC gate)", () => {
    expect(
      roleHasPermission(fixtures.actors.propertyReviewer.role, "property.moderate"),
    ).toBe(true);
    expect(
      roleHasPermission(fixtures.actors.commerceAdmin.role, "property.moderate"),
    ).toBe(false);
  });
});

describe("Feature flag mutation with reason (251–266)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    flagUpdate.mockResolvedValue({
      ...fixtures.killPaymentsFlag,
      enabled: true,
    });
    flagChangeCreate.mockResolvedValue({});
    writeAuditLog.mockResolvedValue(undefined);
  });

  it("engages kill.payments with change log", async () => {
    flagFindUnique.mockResolvedValue({ ...fixtures.killPaymentsFlag });
    const result = await setFeatureFlagEnabled({
      flagId: fixtures.killPaymentsFlag.id,
      enabled: true,
      reason: "PSP outage — halt captures",
      actorUserId: fixtures.actors.operationsAdmin.id,
    });
    expect(result.ok).toBe(true);
    expect(flagUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ enabled: true }),
      }),
    );
    expect(flagChangeCreate).toHaveBeenCalled();
    expect(writeAuditLog).toHaveBeenCalled();
  });

  it("rejects short reason", async () => {
    flagFindUnique.mockResolvedValue({ ...fixtures.killPaymentsFlag });
    const result = await setFeatureFlagEnabled({
      flagId: fixtures.killPaymentsFlag.id,
      enabled: true,
      reason: "short",
      actorUserId: fixtures.actors.operationsAdmin.id,
    });
    expect(result.ok).toBe(false);
  });
});

describe("Safe model rollback via previousActiveModelId (251–266)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    modelUpdate.mockResolvedValue({});
    modelGovernanceCreate.mockResolvedValue({});
    writeAuditLog.mockResolvedValue(undefined);
  });

  it("restores previous model and demotes current ACTIVE", async () => {
    modelFindUnique
      .mockResolvedValueOnce({ ...fixtures.activeModel })
      .mockResolvedValueOnce({ ...fixtures.previousActiveModel });

    const result = await rollbackValuationModel({
      modelId: fixtures.activeModel.id,
      actorUserId: fixtures.actors.operationsAdmin.id,
      reason: "MAE regression vs baseline — safe rollback",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.restoredModelId).toBe(fixtures.previousActiveModel.id);
    }
    expect(modelUpdate).toHaveBeenCalled();
    expect(modelGovernanceCreate).toHaveBeenCalled();
  });

  it("refuses rollback without previousActiveModelId", async () => {
    modelFindUnique.mockResolvedValueOnce({
      ...fixtures.activeModel,
      previousActiveModelId: null,
    });
    const result = await rollbackValuationModel({
      modelId: fixtures.activeModel.id,
      actorUserId: fixtures.actors.operationsAdmin.id,
      reason: "Trying unsafe rollback without previous id",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/previousActiveModelId/i);
  });
});

describe("DQ transition + incident status (251–266)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dqUpdate.mockResolvedValue({});
    writeAuditLog.mockResolvedValue(undefined);
    incidentUpdate.mockResolvedValue({});
    incidentTimelineCreate.mockResolvedValue({ id: "tl_1" });
    auditLogCreate.mockResolvedValue({ id: "audit_inc" });
  });

  it("resolves DQ issue with reason", async () => {
    dqFindUnique.mockResolvedValue({ ...fixtures.openDqIssue });
    const result = await transitionDataQualityIssue({
      issueId: fixtures.openDqIssue.id,
      nextStatus: "RESOLVED",
      reason: "Price corrected after source refresh",
      actorUserId: fixtures.actors.dataAdmin.id,
    });
    expect(result.ok).toBe(true);
    expect(dqUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "RESOLVED",
          resolutionReason: "Price corrected after source refresh",
        }),
      }),
    );
  });

  it("moves incident OPEN → RESOLVED and sets resolvedAt", async () => {
    incidentFindUnique
      .mockResolvedValueOnce({ ...fixtures.openIncident })
      .mockResolvedValueOnce({ id: fixtures.openIncident.id });

    const result = await updateIncidentStatus({
      incidentId: fixtures.openIncident.id,
      status: "RESOLVED",
      actorUserId: fixtures.actors.operationsAdmin.id,
      note: "Feed schema fixed and reprocessed",
    });
    expect(result.ok).toBe(true);
    expect(incidentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "RESOLVED",
          resolvedAt: expect.any(Date),
        }),
      }),
    );
    expect(incidentTimelineCreate).toHaveBeenCalled();
  });
});

describe("Billing ops manual entitlement grant (251–266)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    entitlementCreate.mockResolvedValue({ id: "ent_manual_1" });
  });

  it("ADMIN can grant MANUAL_ADMIN entitlement without orderId", async () => {
    userFindUnique.mockResolvedValue({
      id: fixtures.actors.admin.id,
      role: "ADMIN",
    });
    const result = await grantManualEntitlement({
      userId: fixtures.paymentMismatch.order.userId,
      productKey: fixtures.paymentMismatch.order.productKey,
      reason: "Repair payment mismatch — paid order missing entitlement",
      actorUserId: fixtures.actors.admin.id,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.entitlementId).toBe("ent_manual_1");
    expect(entitlementCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderId: null,
          source: "MANUAL_ADMIN",
          status: "ACTIVE",
        }),
      }),
    );
  });

  it("rejects non-admin actor (IDOR / privilege)", async () => {
    userFindUnique.mockResolvedValue({
      id: fixtures.actors.commerceAdmin.id,
      role: "COMMERCE_ADMIN",
    });
    const result = await grantManualEntitlement({
      userId: fixtures.actors.regularUser.id,
      productKey: "pro_monthly",
      reason: "Should fail for commerce role at function gate",
      actorUserId: fixtures.actors.commerceAdmin.id,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/ADMIN/i);
  });
});
