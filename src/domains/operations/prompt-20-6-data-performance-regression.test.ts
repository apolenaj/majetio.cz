/**
 * Prompt 20.6 — DB / API performance & data quality regression.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { isDemoPropertyContentAllowed } from "@/lib/demo-content-gate";
import { isTransientJobError } from "@/domains/operations/jobs/transient-errors";
import {
  detectDataQualityIssues,
  PRICE_PER_SQM_WARN_MAX,
} from "@/domains/properties/service/data-quality";
import { formatDateTimeUtc, formatInstantForTimezone } from "@/domains/i18n/format";
import { usageDayKey, usageWeekKey } from "@/domains/entitlements/usage";
import { assertPublicMetricsOnly } from "@/domains/comparisons/decision/public-module-cache";
import type { ComparisonPublicPropertyMetrics } from "@/domains/comparisons/decision/types";

describe("Prompt 20.6 — L-06 demo property fail-closed", () => {
  it("denies demo property content in production without hatch", () => {
    expect(
      isDemoPropertyContentAllowed({
        NODE_ENV: "production",
        VERCEL_ENV: "production",
      } as NodeJS.ProcessEnv),
    ).toBe(false);
  });

  it("allows demo in development / with hatch", () => {
    expect(
      isDemoPropertyContentAllowed({
        NODE_ENV: "development",
      } as NodeJS.ProcessEnv),
    ).toBe(true);
    expect(
      isDemoPropertyContentAllowed({
        NODE_ENV: "production",
        ALLOW_DEMO_PROPERTY_CONTENT: "true",
      } as NodeJS.ProcessEnv),
    ).toBe(true);
  });

  it("detail-loader and discovery gate on isDemoPropertyContentAllowed", () => {
    const detail = readFileSync(
      join(process.cwd(), "src/domains/properties/service/detail-loader.ts"),
      "utf8",
    );
    const discovery = readFileSync(
      join(
        process.cwd(),
        "src/components/property/search/discovery-listing.tsx",
      ),
      "utf8",
    );
    expect(detail).toMatch(/isDemoPropertyContentAllowed/);
    expect(discovery).toMatch(/isDemoPropertyContentAllowed/);
  });
});

describe("Prompt 20.6 — Jobs transient-only retry", () => {
  it("classifies validation / not-found as permanent", () => {
    expect(isTransientJobError("Validation failed for payload")).toBe(false);
    expect(isTransientJobError("Property not found")).toBe(false);
    expect(isTransientJobError("Unique constraint violation")).toBe(false);
  });

  it("classifies timeouts / 503 as transient", () => {
    expect(isTransientJobError("ETIMEDOUT connecting to DB")).toBe(true);
    expect(isTransientJobError("Upstream 503 unavailable")).toBe(true);
  });
});

describe("Prompt 20.6 — Data quality anomalies & provenance contracts", () => {
  it("flags non-positive price and extreme Kč/m²", () => {
    const issues = detectDataQualityIssues({
      askingPrice: 0,
      usableArea: 50,
    });
    expect(issues.some((i) => i.ruleCode === "PRICE_NON_POSITIVE")).toBe(true);

    const high = detectDataQualityIssues({
      askingPrice: PRICE_PER_SQM_WARN_MAX * 100,
      usableArea: 50,
    });
    expect(high.some((i) => i.ruleCode === "EXTREME_PRICE_PER_SQM")).toBe(true);
  });

  it("comparison public cache rejects personal keys", () => {
    expect(() =>
      assertPublicMetricsOnly({
        financing: { ltv: 0.8 },
      } as unknown as ComparisonPublicPropertyMetrics),
    ).toThrow(/personal/i);
  });
});

describe("Prompt 20.6 — UTC windows & safe Intl formatting", () => {
  it("usage day/week keys are UTC ISO-shaped", () => {
    const day = usageDayKey(new Date("2026-07-22T23:30:00.000Z"));
    expect(day).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const week = usageWeekKey(new Date("2026-07-22T12:00:00.000Z"));
    expect(week).toMatch(/^\d{4}-W\d{2}$/);
  });

  it("invalid date / timezone does not throw", () => {
    expect(formatDateTimeUtc("not-a-date")).toBe("—");
    expect(
      formatInstantForTimezone({
        isoUtc: new Date("2026-07-22T10:00:00.000Z"),
        timeZone: "Not/AZone",
        locale: "cs-CZ",
      }),
    ).not.toBe("");
  });
});

describe("Prompt 20.6 — Email N+1 / cache invalidation contracts", () => {
  it("email delivery batches user findMany", () => {
    const src = readFileSync(
      join(
        process.cwd(),
        "src/domains/notifications/service/email-delivery.ts",
      ),
      "utf8",
    );
    expect(src).toMatch(/findMany\(/);
    expect(src).toMatch(/MAX_ALERT_EMAIL_ATTEMPTS/);
    expect(src).not.toMatch(/for \(const alert[\s\S]*findUnique/);
  });

  it("admin actions bust public property caches after mutations", () => {
    const src = readFileSync(
      join(process.cwd(), "src/domains/properties/server/admin-actions.ts"),
      "utf8",
    );
    expect(src).toMatch(/invalidatePublicPropertyCaches|revalidateAfterPropertyChange/);
  });
});
