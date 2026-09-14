import { describe, expect, it } from "vitest";

import {
  assertNoSecretsInText,
  sanitizeAuditMeta,
  truncateSummary,
} from "@/domains/administration/audit/ops-audit-log";
import {
  INCIDENT_OPS_STATUSES,
  INCIDENT_SEV_LEVELS,
} from "@/domains/administration/incidents/incident-ops";
import {
  DATASET_HEALTH_STATUSES,
  deriveHealthFromSla,
} from "@/domains/administration/datasets/dataset-registry";

describe("Ops AuditLog secret hygiene", () => {
  it("redacts secret keys and token-like values", () => {
    const cleaned = sanitizeAuditMeta({
      orderId: "ord_1",
      api_key: "super-secret",
      nested: { password: "x", ok: true },
      authHeader: "Bearer abc.def.ghi",
    }) as Record<string, unknown>;

    expect(cleaned.orderId).toBe("ord_1");
    expect(cleaned.api_key).toBe("[REDACTED]");
    expect((cleaned.nested as Record<string, unknown>).password).toBe(
      "[REDACTED]",
    );
    expect((cleaned.nested as Record<string, unknown>).ok).toBe(true);
    expect(cleaned.authHeader).toBe("[REDACTED]");
  });

  it("rejects secret-like summaries", () => {
    expect(() =>
      assertNoSecretsInText("beforeSummary", "sk_live_abc123"),
    ).toThrow(/secret/i);
    expect(() => assertNoSecretsInText("reason", "user suspended")).not.toThrow();
  });

  it("truncates long summaries", () => {
    const long = "a".repeat(2500);
    const out = truncateSummary(long, 2000);
    expect(out?.endsWith("…")).toBe(true);
    expect(out!.length).toBe(2001);
  });
});

describe("Incident enums (126–131)", () => {
  it("exposes SEV1–SEV4 and lifecycle statuses", () => {
    expect(INCIDENT_SEV_LEVELS).toEqual(["SEV1", "SEV2", "SEV3", "SEV4"]);
    expect(INCIDENT_OPS_STATUSES).toContain("ACKNOWLEDGED");
    expect(INCIDENT_OPS_STATUSES).toContain("CLOSED");
  });
});

describe("Dataset health SLA (218–227)", () => {
  it("lists required health statuses", () => {
    expect(DATASET_HEALTH_STATUSES).toEqual([
      "HEALTHY",
      "STALE",
      "DEGRADED",
      "DISABLED",
    ]);
  });

  it("marks stale when older than SLA", () => {
    const now = new Date("2026-07-22T12:00:00Z");
    const refreshed = new Date("2026-07-22T08:00:00Z"); // 4h ago
    expect(
      deriveHealthFromSla({
        lastRefreshedAt: refreshed,
        qualitySlaMinutes: 60,
        latestScore: 95,
        qualitySlaScoreMin: 80,
        now,
      }),
    ).toBe("DEGRADED");
  });

  it("marks degraded on low DQ score", () => {
    expect(
      deriveHealthFromSla({
        lastRefreshedAt: new Date(),
        qualitySlaMinutes: 1440,
        latestScore: 40,
        qualitySlaScoreMin: 85,
      }),
    ).toBe("DEGRADED");
  });

  it("stays healthy within SLA", () => {
    expect(
      deriveHealthFromSla({
        lastRefreshedAt: new Date(),
        qualitySlaMinutes: 360,
        latestScore: 92,
        qualitySlaScoreMin: 85,
      }),
    ).toBe("HEALTHY");
  });
});
