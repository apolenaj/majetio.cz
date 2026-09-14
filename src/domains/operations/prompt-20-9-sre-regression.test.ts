/**
 * Prompt 20.9 — SRE / DR / release readiness regression contracts.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  ALERT_RULES,
  SYNTHETIC_CHECKS,
  shouldEmitAlert,
  resetAlertDedupeForTests,
} from "@/domains/operations/monitoring/alert-rules";
import {
  resolveOrCreateRequestId,
  normalizeCorrelationId,
} from "@/lib/observability/correlation";
import { probeDatabase } from "@/domains/operations/monitoring/system-health";

const root = (...parts: string[]) => join(process.cwd(), ...parts);

describe("Prompt 20.9 — docs", () => {
  it("DISASTER_RECOVERY and RELEASE_PROCESS exist with required sections", () => {
    const dr = readFileSync(root("docs/DISASTER_RECOVERY.md"), "utf8");
    expect(dr).toMatch(/Database loss/);
    expect(dr).toMatch(/Corrupt data import/);
    expect(dr).toMatch(/Provider outages/);
    expect(dr).toMatch(/RTO|RPO/);

    const rel = readFileSync(root("docs/RELEASE_PROCESS.md"), "utf8");
    expect(rel).toMatch(/Local/);
    expect(rel).toMatch(/CI/);
    expect(rel).toMatch(/Staging/);
    expect(rel).toMatch(/Production/);
    expect(rel).toMatch(/Pre-release checklist/);
    expect(rel).toMatch(/DROP TABLE|destructive/i);
  });
});

describe("Prompt 20.9 — health endpoints", () => {
  it("public ready route uses DB probe and returns safe shape", () => {
    const src = readFileSync(root("src/app/api/ready/route.ts"), "utf8");
    expect(src).toMatch(/probeDatabase/);
    expect(src).toMatch(/not_ready/);
    expect(src).not.toMatch(/DATABASE_URL|password/i);
    expect(src).not.toMatch(/process\.env/);
  });

  it("public health is liveness without DB", () => {
    const src = readFileSync(root("src/app/api/health/route.ts"), "utf8");
    expect(src).toMatch(/status:\s*"ok"/);
    expect(src).not.toMatch(/probeDatabase|\$queryRaw/);
  });

  it("admin health remains permission-gated", () => {
    const src = readFileSync(root("src/app/api/admin/health/route.ts"), "utf8");
    expect(src).toMatch(/ops\.health\.read/);
    expect(src).toMatch(/buildSystemHealthReport/);
  });
});

describe("Prompt 20.9 — correlation + alerts", () => {
  it("mints and validates request ids", () => {
    expect(normalizeCorrelationId("short")).toBeNull();
    expect(normalizeCorrelationId("abcd1234-valid")).toBe("abcd1234-valid");
    const id = resolveOrCreateRequestId(null);
    expect(id.length).toBeGreaterThanOrEqual(8);
  });

  it("middleware sets x-request-id", () => {
    const src = readFileSync(root("src/middleware.ts"), "utf8");
    expect(src).toMatch(/REQUEST_ID_HEADER|x-request-id/);
    expect(src).toMatch(/resolveOrCreateRequestId/);
  });

  it("alert rules cover payments, imports, auth with dedupe", () => {
    expect(ALERT_RULES.some((r) => r.id.startsWith("payments."))).toBe(true);
    expect(ALERT_RULES.some((r) => r.id.startsWith("import."))).toBe(true);
    expect(ALERT_RULES.some((r) => r.id.startsWith("auth."))).toBe(true);
    resetAlertDedupeForTests();
    expect(shouldEmitAlert("test:fp", 30)).toBe(true);
    expect(shouldEmitAlert("test:fp", 30)).toBe(false);
  });

  it("synthetic checks include health and ready", () => {
    const paths = SYNTHETIC_CHECKS.map((c) => c.urlPath);
    expect(paths).toContain("/api/health");
    expect(paths).toContain("/api/ready");
    expect(paths).toContain("/");
  });
});

describe("Prompt 20.9 — migration safety scan", () => {
  it("flags known historical DROP TABLE and documents pending additive policy", () => {
    const destructive = readFileSync(
      root(
        "prisma/migrations/20260719100000_valuation_engine_foundation/migration.sql",
      ),
      "utf8",
    );
    expect(destructive).toMatch(/DROP TABLE/);

    const release = readFileSync(root("docs/RELEASE_PROCESS.md"), "utf8");
    expect(release).toMatch(/20260719100000_valuation_engine_foundation/);
    expect(release).toMatch(/Expand/);
  });
});

describe("Prompt 20.9 — reconcile fail-loud", () => {
  it("revenue-reconcile workflow exits non-zero without DATABASE_URL", () => {
    const yml = readFileSync(
      root(".github/workflows/revenue-reconcile.yml"),
      "utf8",
    );
    expect(yml).toMatch(/exit 1/);
    expect(yml).not.toMatch(/skipping reconcile/);
  });
});

describe("Prompt 20.9 — probeDatabase export", () => {
  it("exports probeDatabase for ready route", () => {
    expect(typeof probeDatabase).toBe("function");
  });
});
