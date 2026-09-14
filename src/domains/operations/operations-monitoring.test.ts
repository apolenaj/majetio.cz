import { describe, expect, it } from "vitest";

import {
  canTransitionModelLifecycle,
  compareModelVersions,
  assertModelCanGoLive,
} from "@/domains/valuation/admin/metrics";
import {
  JOB_STARTS_PER_MINUTE,
  MAX_PROPERTY_IDS_PER_JOB,
  SYSTEM_JOB_STATUSES,
} from "@/domains/operations/jobs/job-queue";
import { SYSTEM_HEALTH_STATUSES } from "@/domains/operations/monitoring/system-health";
import { roleHasPermission } from "@/domains/administration/rbac/roles";

describe("Model governance workflow (172–177)", () => {
  it("follows DRAFT → REVIEW_REQUESTED → APPROVED → ACTIVE", () => {
    expect(canTransitionModelLifecycle("DRAFT", "REVIEW_REQUESTED")).toBe(true);
    expect(canTransitionModelLifecycle("REVIEW_REQUESTED", "APPROVED")).toBe(
      true,
    );
    expect(canTransitionModelLifecycle("APPROVED", "ACTIVE")).toBe(true);
    expect(canTransitionModelLifecycle("DRAFT", "ACTIVE")).toBe(false);
    expect(assertModelCanGoLive("REVIEW_REQUESTED").ok).toBe(false);
  });

  it("compares versions", () => {
    const c = compareModelVersions({
      left: {
        algorithmVersion: "v1",
        lifecycleStatus: "ACTIVE",
        mae: 100,
      },
      right: {
        algorithmVersion: "v2",
        lifecycleStatus: "APPROVED",
        mae: 80,
      },
    });
    expect(c.sameAlgorithm).toBe(false);
    expect(c.maeDelta).toBe(-20);
    expect(c.notes.length).toBeGreaterThan(0);
  });
});

describe("Jobs & health enums (139–150)", () => {
  it("exposes job statuses including RETRYING and DEAD_LETTER", () => {
    expect(SYSTEM_JOB_STATUSES).toContain("QUEUED");
    expect(SYSTEM_JOB_STATUSES).toContain("RUNNING");
    expect(SYSTEM_JOB_STATUSES).toContain("RETRYING");
    expect(SYSTEM_JOB_STATUSES).toContain("DEAD_LETTER");
  });

  it("rate-limits batch size", () => {
    expect(MAX_PROPERTY_IDS_PER_JOB).toBe(100);
    expect(JOB_STARTS_PER_MINUTE).toBeGreaterThan(0);
  });

  it("defines health statuses", () => {
    expect(SYSTEM_HEALTH_STATUSES).toEqual([
      "UP",
      "DEGRADED",
      "DOWN",
      "UNKNOWN",
    ]);
  });
});

describe("Ops monitoring RBAC", () => {
  it("DATA_ADMIN can read health/jobs and enqueue repair", () => {
    expect(roleHasPermission("DATA_ADMIN", "ops.health.read")).toBe(true);
    expect(roleHasPermission("DATA_ADMIN", "ops.jobs.read")).toBe(true);
    expect(roleHasPermission("DATA_ADMIN", "ops.jobs.write")).toBe(true);
    expect(roleHasPermission("DATA_ADMIN", "ops.repair.write")).toBe(true);
  });

  it("PROPERTY_REVIEWER can read health but not repair", () => {
    expect(roleHasPermission("PROPERTY_REVIEWER", "ops.health.read")).toBe(
      true,
    );
    expect(roleHasPermission("PROPERTY_REVIEWER", "ops.repair.write")).toBe(
      false,
    );
  });
});
