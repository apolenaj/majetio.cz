/**
 * Simulated E2E admin operations (checklist 267–272).
 * Full flows with realistic fixtures + Prisma mocks — no fake metrics.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildAdminOpsFixtures } from "@/domains/administration/testing/admin-ops-fixtures";
import {
  canTransitionModelLifecycle,
  assertModelCanGoLive,
} from "@/domains/valuation/admin/metrics";
import { roleHasPermission } from "@/domains/administration/rbac/roles";
import { SENSITIVE_CONFIRM_TOKEN } from "@/domains/administration/rbac/permissions";
import { assertSensitiveActionInput } from "@/domains/administration/rbac/sensitive";
import type { IncidentOpsStatus } from "@/domains/administration/incidents/incident-ops";
import { statusAfterModerationDecision } from "@/domains/properties/admin/moderation-copy";
import { planNonDestructiveMerge } from "@/domains/properties/service/merge-strategy";

const fixtures = buildAdminOpsFixtures();

const writeAuditLog = vi.fn().mockResolvedValue(undefined);
const auditLogCreate = vi.fn();

const dqFindUnique = vi.fn();
const dqUpdate = vi.fn();

const propertyFindUnique = vi.fn();
const propertyUpdate = vi.fn();
const propertyUpdateMany = vi.fn();
const propertyStatusHistoryCreate = vi.fn();
const propertySourceUpdateMany = vi.fn();
const duplicateFindUnique = vi.fn();
const duplicateUpdate = vi.fn();
const duplicateUpdateMany = vi.fn();
const mergeEventCreate = vi.fn();

const modelFindUnique = vi.fn();
const modelUpdate = vi.fn();
const modelUpdateMany = vi.fn();
const modelFindFirst = vi.fn();
const modelGovernanceCreate = vi.fn();

const incidentFindUnique = vi.fn();
const incidentUpdate = vi.fn();
const incidentTimelineCreate = vi.fn();

const userFindUnique = vi.fn();
const entitlementCreate = vi.fn();
const entitlementFindMany = vi.fn();

vi.mock("@/lib/auth/audit", () => ({
  writeAuditLog: (...a: unknown[]) => writeAuditLog(...a),
}));

vi.mock("@/domains/revenue/monetization-audit", () => ({
  writeMonetizationAuditLog: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    auditLog: { create: (...a: unknown[]) => auditLogCreate(...a) },
    dataQualityIssue: {
      findUnique: (...a: unknown[]) => dqFindUnique(...a),
      update: (...a: unknown[]) => dqUpdate(...a),
    },
    property: {
      findUnique: (...a: unknown[]) => propertyFindUnique(...a),
      update: (...a: unknown[]) => propertyUpdate(...a),
      updateMany: (...a: unknown[]) => propertyUpdateMany(...a),
    },
    propertyStatusHistory: {
      create: (...a: unknown[]) => propertyStatusHistoryCreate(...a),
    },
    propertySource: {
      updateMany: (...a: unknown[]) => propertySourceUpdateMany(...a),
    },
    propertyDuplicateCandidate: {
      findUnique: (...a: unknown[]) => duplicateFindUnique(...a),
      update: (...a: unknown[]) => duplicateUpdate(...a),
      updateMany: (...a: unknown[]) => duplicateUpdateMany(...a),
    },
    propertyMergeEvent: {
      create: (...a: unknown[]) => mergeEventCreate(...a),
    },
    valuationModelRegistry: {
      findUnique: (...a: unknown[]) => modelFindUnique(...a),
      update: (...a: unknown[]) => modelUpdate(...a),
      updateMany: (...a: unknown[]) => modelUpdateMany(...a),
      findFirst: (...a: unknown[]) => modelFindFirst(...a),
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
      findMany: (...a: unknown[]) => entitlementFindMany(...a),
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        property: {
          update: (...a: unknown[]) => propertyUpdate(...a),
          findUnique: (...a: unknown[]) => propertyFindUnique(...a),
        },
        propertySource: {
          updateMany: (...a: unknown[]) => propertySourceUpdateMany(...a),
        },
        propertyDuplicateCandidate: {
          update: (...a: unknown[]) => duplicateUpdate(...a),
          updateMany: (...a: unknown[]) => duplicateUpdateMany(...a),
        },
        propertyMergeEvent: {
          create: (...a: unknown[]) => mergeEventCreate(...a),
        },
        valuationModelRegistry: {
          findUnique: (...a: unknown[]) => modelFindUnique(...a),
          findFirst: (...a: unknown[]) => modelFindFirst(...a),
          update: (...a: unknown[]) => modelUpdate(...a),
          updateMany: (...a: unknown[]) => modelUpdateMany(...a),
        },
        modelGovernanceEvent: {
          create: (...a: unknown[]) => modelGovernanceCreate(...a),
        },
      };
      return fn(tx);
    },
  },
}));

import { transitionDataQualityIssue } from "@/domains/data-quality/admin/issues";
import {
  previewPropertyMerge,
  executePropertyMerge,
} from "@/domains/properties/admin/merge-service";
import { applyModerationDecision } from "@/domains/properties/admin/moderation-service";
import {
  transitionValuationModel,
  rollbackValuationModel,
} from "@/domains/valuation/admin/control-center";
import { updateIncidentStatus } from "@/domains/administration/incidents/incident-ops";
import {
  grantManualEntitlement,
  listManualEntitlementsForUser,
} from "@/domains/entitlements/manual";

describe("E2E · Data issue resolution (267)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    writeAuditLog.mockResolvedValue(undefined);
  });

  it("OPEN → IN_REVIEW → RESOLVED with audit trail", async () => {
    expect(
      roleHasPermission(fixtures.actors.dataAdmin.role, "dataQuality.resolve"),
    ).toBe(true);

    dqFindUnique.mockResolvedValue({ ...fixtures.openDqIssue });
    dqUpdate.mockResolvedValue({});

    const review = await transitionDataQualityIssue({
      issueId: fixtures.openDqIssue.id,
      nextStatus: "IN_REVIEW",
      reason: "Investigating price anomaly",
      actorUserId: fixtures.actors.dataAdmin.id,
    });
    expect(review.ok).toBe(true);
    expect(dqUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "IN_REVIEW",
          reviewedByUserId: fixtures.actors.dataAdmin.id,
        }),
      }),
    );

    dqFindUnique.mockResolvedValue({
      ...fixtures.openDqIssue,
      status: "IN_REVIEW",
    });
    const resolved = await transitionDataQualityIssue({
      issueId: fixtures.openDqIssue.id,
      nextStatus: "RESOLVED",
      reason: "Source refreshed; price within band after fix",
      actorUserId: fixtures.actors.dataAdmin.id,
    });
    expect(resolved.ok).toBe(true);
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "admin.dq.resolved",
        entity: "DataQualityIssue",
        entityId: fixtures.openDqIssue.id,
      }),
    );
  });

  it("blocks resolution without reason", async () => {
    dqFindUnique.mockResolvedValue({ ...fixtures.openDqIssue });
    const bad = await transitionDataQualityIssue({
      issueId: fixtures.openDqIssue.id,
      nextStatus: "RESOLVED",
      reason: "x",
      actorUserId: fixtures.actors.dataAdmin.id,
    });
    expect(bad.ok).toBe(false);
  });
});

describe("E2E · Property duplicate merge (268)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    writeAuditLog.mockResolvedValue(undefined);
    mergeEventCreate.mockResolvedValue({ id: "merge_evt_1" });
    duplicateUpdate.mockResolvedValue({});
    duplicateUpdateMany.mockResolvedValue({ count: 1 });
    propertyUpdate.mockResolvedValue({});
    propertySourceUpdateMany.mockResolvedValue({ count: 1 });
  });

  it("dry-run preview then execute non-destructive merge with step-up", async () => {
    expect(
      roleHasPermission(fixtures.actors.propertyReviewer.role, "property.merge"),
    ).toBe(true);

    assertSensitiveActionInput({
      reason: "Confirmed duplicate Vinohrady listings",
      confirmToken: SENSITIVE_CONFIRM_TOKEN,
    });

    duplicateFindUnique.mockResolvedValue({
      ...fixtures.duplicateCandidate,
      propertyA: fixtures.propertyA,
      propertyB: fixtures.propertyB,
    });

    const preview = await previewPropertyMerge({
      candidateId: fixtures.duplicateCandidate.id,
      preferredCanonicalId: fixtures.propertyA.id,
    });
    expect(preview.error).toBeNull();
    expect(preview.preview).not.toBeNull();
    expect(preview.preview?.surviving.id).toBe(fixtures.propertyA.id);
    expect(preview.preview?.secondary.id).toBe(fixtures.propertyB.id);
    expect(preview.preview?.fieldPreview.length).toBeGreaterThan(0);

    // Pure strategy also agrees on preferred canonical
    const plan = planNonDestructiveMerge({
      propertyAId: fixtures.propertyA.id,
      propertyBId: fixtures.propertyB.id,
      preferredCanonicalId: fixtures.propertyA.id,
      fieldGroups: [
        [
          {
            fieldKey: "title",
            value: fixtures.propertyA.title,
            trust: "portal",
          },
          {
            fieldKey: "title",
            value: fixtures.propertyB.title,
            trust: "manual",
          },
        ],
      ],
      overrides: [],
    });
    expect(plan.canonicalPropertyId).toBe(fixtures.propertyA.id);
    expect(plan.secondaryPropertyId).toBe(fixtures.propertyB.id);

    propertyFindUnique.mockResolvedValue({
      ...fixtures.propertyB,
      sources: fixtures.propertyB.sources,
    });

    const executed = await executePropertyMerge({
      candidateId: fixtures.duplicateCandidate.id,
      preferredCanonicalId: fixtures.propertyA.id,
      actorUserId: fixtures.actors.propertyReviewer.id,
      notes: "Merged after dry-run preview",
    });

    expect(executed.ok).toBe(true);
    if (executed.ok) {
      expect(executed.canonicalPropertyId).toBe(fixtures.propertyA.id);
      expect(executed.secondaryPropertyId).toBe(fixtures.propertyB.id);
      expect(executed.mergeEventId).toBe("merge_evt_1");
    }

    expect(propertyUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: fixtures.propertyB.id },
        data: expect.objectContaining({ status: "ARCHIVED" }),
      }),
    );
    expect(duplicateUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "PENDING" }),
        data: expect.objectContaining({ status: "MERGED" }),
      }),
    );
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "admin.property.merge" }),
    );
  });

  it("refuses preview when candidate already MERGED", async () => {
    duplicateFindUnique.mockResolvedValue({
      ...fixtures.duplicateCandidate,
      status: "MERGED",
      propertyA: fixtures.propertyA,
      propertyB: fixtures.propertyB,
    });
    const preview = await previewPropertyMerge({
      candidateId: fixtures.duplicateCandidate.id,
    });
    expect(preview.preview).toBeNull();
    expect(preview.error).toMatch(/MERGED/i);
  });
});

describe("E2E · Listing moderation (269)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    writeAuditLog.mockResolvedValue(undefined);
    propertyUpdate.mockResolvedValue({});
    propertyStatusHistoryCreate.mockResolvedValue({});
  });

  it("PENDING_REVIEW → APPROVE → ACTIVE end-to-end", async () => {
    expect(statusAfterModerationDecision("APPROVE")).toBe("ACTIVE");
    propertyFindUnique.mockResolvedValue({
      ...fixtures.pendingModerationProperty,
      _count: { qualityIssues: 0 },
    });

    const result = await applyModerationDecision({
      propertyId: fixtures.pendingModerationProperty.id,
      decision: "APPROVE",
      reason: "Complete listing",
      actorUserId: fixtures.actors.propertyReviewer.id,
    });
    expect(result.ok).toBe(true);
    expect(propertyUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "ACTIVE" }),
      }),
    );
    expect(propertyStatusHistoryCreate).toHaveBeenCalled();
  });

  it("REQUEST_CHANGES returns listing to DRAFT with public message", async () => {
    propertyFindUnique.mockResolvedValue({
      ...fixtures.pendingModerationProperty,
      _count: { qualityIssues: 0 },
    });
    const result = await applyModerationDecision({
      propertyId: fixtures.pendingModerationProperty.id,
      decision: "REQUEST_CHANGES",
      reason: "Doplňte fotografie a upřesněte cenu",
      actorUserId: fixtures.actors.propertyReviewer.id,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.userFacingMessage).toMatch(/úpravy/i);
    }
    expect(propertyUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "DRAFT" }),
      }),
    );
  });
});

describe("E2E · Model governance lifecycle (270)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    writeAuditLog.mockResolvedValue(undefined);
    modelUpdate.mockResolvedValue({});
    modelUpdateMany.mockResolvedValue({ count: 1 });
    modelGovernanceCreate.mockResolvedValue({});
    modelFindFirst.mockResolvedValue({ ...fixtures.previousActiveModel });
  });

  it("DRAFT → REVIEW_REQUESTED → APPROVED → ACTIVE → rollback", async () => {
    expect(canTransitionModelLifecycle("DRAFT", "REVIEW_REQUESTED")).toBe(true);
    expect(canTransitionModelLifecycle("REVIEW_REQUESTED", "APPROVED")).toBe(
      true,
    );
    expect(assertModelCanGoLive("APPROVED").ok).toBe(true);

    // DRAFT → REVIEW_REQUESTED
    modelFindUnique.mockResolvedValue({ ...fixtures.draftModel });
    const toReview = await transitionValuationModel({
      modelId: fixtures.draftModel.id,
      nextStatus: "REVIEW_REQUESTED",
      actorUserId: fixtures.actors.dataAdmin.id,
      reason: "Ready for peer review",
    });
    expect(toReview.ok).toBe(true);

    // REVIEW_REQUESTED → APPROVED (ops approve)
    expect(
      roleHasPermission(
        fixtures.actors.operationsAdmin.role,
        "analytics.models.approve",
      ),
    ).toBe(true);
    modelFindUnique.mockResolvedValue({
      ...fixtures.draftModel,
      lifecycleStatus: "REVIEW_REQUESTED",
    });
    const approved = await transitionValuationModel({
      modelId: fixtures.draftModel.id,
      nextStatus: "APPROVED",
      actorUserId: fixtures.actors.operationsAdmin.id,
      reason: "MAE within SLA on holdout set",
    });
    expect(approved.ok).toBe(true);

    // APPROVED → ACTIVE (publishes, stores previousActiveModelId)
    modelFindUnique.mockResolvedValue({
      ...fixtures.draftModel,
      lifecycleStatus: "APPROVED",
      shadowMode: false,
    });
    modelFindFirst.mockResolvedValue({ ...fixtures.activeModel });
    const activated = await transitionValuationModel({
      modelId: fixtures.draftModel.id,
      nextStatus: "ACTIVE",
      actorUserId: fixtures.actors.operationsAdmin.id,
      reason: "Promote v3 after approval",
    });
    expect(activated.ok).toBe(true);
    expect(modelUpdate).toHaveBeenCalled();

    // Safe rollback of the previously active v2 fixture model
    modelFindUnique
      .mockResolvedValueOnce({ ...fixtures.activeModel })
      .mockResolvedValueOnce({ ...fixtures.previousActiveModel });
    const rollback = await rollbackValuationModel({
      modelId: fixtures.activeModel.id,
      actorUserId: fixtures.actors.operationsAdmin.id,
      reason: "Production MAE regression — restore previous",
    });
    expect(rollback.ok).toBe(true);
    if (rollback.ok) {
      expect(rollback.restoredModelId).toBe(fixtures.previousActiveModel.id);
    }
  });

  it("blocks DRAFT → ACTIVE shortcut", async () => {
    modelFindUnique.mockResolvedValue({ ...fixtures.draftModel });
    const bad = await transitionValuationModel({
      modelId: fixtures.draftModel.id,
      nextStatus: "ACTIVE",
      actorUserId: fixtures.actors.operationsAdmin.id,
      reason: "Illegal shortcut activation attempt",
    });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error).toMatch(/Invalid transition|APPROVED/i);
  });
});

describe("E2E · Incident resolution (271)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auditLogCreate.mockResolvedValue({ id: "audit_inc_1" });
    incidentUpdate.mockResolvedValue({});
    incidentTimelineCreate.mockResolvedValue({ id: "tl_1" });
  });

  it("OPEN → INVESTIGATING → MITIGATED → RESOLVED", async () => {
    expect(
      roleHasPermission(
        fixtures.actors.operationsAdmin.role,
        "platform.incidents.write",
      ),
    ).toBe(true);

    const steps = [
      "INVESTIGATING",
      "MITIGATED",
      "RESOLVED",
    ] as const satisfies ReadonlyArray<IncidentOpsStatus>;

    let current: Omit<typeof fixtures.openIncident, "status"> & {
      status: IncidentOpsStatus;
    } = { ...fixtures.openIncident };
    for (const status of steps) {
      incidentFindUnique
        .mockResolvedValueOnce(current)
        .mockResolvedValueOnce({ id: current.id });

      const result = await updateIncidentStatus({
        incidentId: current.id,
        status,
        actorUserId: fixtures.actors.operationsAdmin.id,
        note: `Moving to ${status} after fixture import fix`,
      });
      expect(result.ok).toBe(true);
      current = {
        ...current,
        status,
        resolvedAt:
          status === "RESOLVED" ? fixtures.now : current.resolvedAt,
      };
    }

    expect(incidentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "RESOLVED" }),
      }),
    );
    expect(incidentTimelineCreate).toHaveBeenCalled();
    expect(auditLogCreate).toHaveBeenCalled();
  });
});

describe("E2E · Billing ops entitlement repair (272)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    entitlementCreate.mockResolvedValue({ id: "ent_repair_1" });
    entitlementFindMany.mockResolvedValue([
      {
        id: "ent_repair_1",
        productKey: fixtures.paymentMismatch.order.productKey,
        kind: "LEGACY_PRODUCT",
        status: "ACTIVE",
        expiresAt: null,
        manualReason: "Repair payment mismatch",
        manualActorUserId: fixtures.actors.admin.id,
        manualGrantedAt: fixtures.now,
        createdAt: fixtures.now,
      },
    ]);
  });

  it("repairs PAID order without entitlement via MANUAL_ADMIN grant", async () => {
    expect(fixtures.paymentMismatch.entitlement).toBeNull();
    expect(fixtures.paymentMismatch.order.status).toBe("PAID");
    expect(
      roleHasPermission(fixtures.actors.admin.role, "commerce.entitlements.grant"),
    ).toBe(true);

    userFindUnique.mockResolvedValue({
      id: fixtures.actors.admin.id,
      role: "ADMIN",
    });

    const grant = await grantManualEntitlement({
      userId: fixtures.paymentMismatch.order.userId,
      productKey: fixtures.paymentMismatch.order.productKey,
      reason:
        "Repair payment_mismatch: order paid, entitlement missing after webhook lag",
      actorUserId: fixtures.actors.admin.id,
    });
    expect(grant.ok).toBe(true);

    const listed = await listManualEntitlementsForUser(
      fixtures.paymentMismatch.order.userId,
    );
    expect(listed).toHaveLength(1);
    expect(listed[0]?.productKey).toBe(
      fixtures.paymentMismatch.order.productKey,
    );
    expect(entitlementCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          source: "MANUAL_ADMIN",
          orderId: null,
          userId: fixtures.paymentMismatch.order.userId,
        }),
      }),
    );
  });

  it("does not allow regular USER to self-grant", async () => {
    userFindUnique.mockResolvedValue({
      id: fixtures.actors.regularUser.id,
      role: "USER",
    });
    const result = await grantManualEntitlement({
      userId: fixtures.actors.regularUser.id,
      productKey: "pro_monthly",
      reason: "Self grant attempt must fail",
      actorUserId: fixtures.actors.regularUser.id,
    });
    expect(result.ok).toBe(false);
  });
});
