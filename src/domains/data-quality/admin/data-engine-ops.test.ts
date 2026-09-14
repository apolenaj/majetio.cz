import { describe, expect, it } from "vitest";

import {
  categoryForRuleCode,
  detectPriceVsMedianIssue,
  explainDataQualityIssue,
  toWorkflowStatus,
} from "./taxonomy";
import {
  finalizeOpsImportJobStatus,
  presentImportJobStatus,
} from "@/domains/property-sources/service/import-status";
import {
  computeSourceHealth,
  isLicenseExpired,
} from "@/domains/property-sources/admin/health";
import { mayImportFromSource } from "@/domains/property-sources/admin/source-ops";

describe("DQ taxonomy", () => {
  it("maps rule codes to categories", () => {
    expect(categoryForRuleCode("AREA_MISMATCH")).toBe("CONFLICT");
    expect(categoryForRuleCode("LOCATION_METRIC_STALE")).toBe("STALE");
    expect(categoryForRuleCode("REQUIRED_TITLE")).toBe("MISSING");
    expect(categoryForRuleCode("DUPLICATE_CANDIDATE")).toBe("DUPLICATE");
    expect(categoryForRuleCode("USER_REPORT_MISLEADING")).toBe("USER_REPORT");
  });

  it("normalizes legacy statuses", () => {
    expect(toWorkflowStatus("ACKNOWLEDGED")).toBe("IN_REVIEW");
    expect(toWorkflowStatus("IGNORED")).toBe("FALSE_POSITIVE");
  });

  it("explains median deviation clearly", () => {
    const msg = explainDataQualityIssue({
      ruleCode: "PRICE_BELOW_MEDIAN",
      message: "Suspicious",
      meta: {
        askingPrice: 1_000_000,
        medianPrice: 6_000_000,
        pctBelowMedian: 83.3,
      },
    });
    expect(msg).toMatch(/83/);
    expect(msg.toLowerCase()).not.toBe("suspicious");
  });

  it("detects price vs median anomaly", () => {
    const hit = detectPriceVsMedianIssue({
      askingPrice: 1_000_000,
      medianPrice: 6_000_000,
    });
    expect(hit?.ruleCode).toBe("PRICE_BELOW_MEDIAN");
    expect(hit?.explanation).toMatch(/%/);
  });
});

describe("import status presentation", () => {
  it("maps legacy PENDING/PARTIAL to ops labels", () => {
    expect(presentImportJobStatus("PENDING")).toBe("QUEUED");
    expect(presentImportJobStatus("PARTIAL")).toBe("COMPLETED_WITH_WARNINGS");
  });

  it("finalizes with warnings when mixed outcomes", () => {
    expect(
      finalizeOpsImportJobStatus({
        processedCount: 10,
        successCount: 8,
        errorCount: 2,
        skippedCount: 0,
      }),
    ).toBe("COMPLETED_WITH_WARNINGS");
  });
});

describe("source health & license", () => {
  it("disables on expired license", () => {
    expect(isLicenseExpired(new Date("2020-01-01"), new Date("2024-01-01"))).toBe(
      true,
    );
    expect(
      computeSourceHealth({
        importEnabled: true,
        licenseExpiresAt: new Date("2020-01-01"),
        now: new Date("2024-01-01"),
      }),
    ).toBe("DISABLED");
  });

  it("gates import when provider disabled", () => {
    expect(
      mayImportFromSource({
        providerConfig: {
          importEnabled: false,
          healthStatus: "DISABLED",
        },
      }),
    ).toBe(false);
    expect(
      mayImportFromSource({
        providerConfig: {
          importEnabled: true,
          healthStatus: "HEALTHY",
        },
        source: { importEnabled: true, healthStatus: "HEALTHY" },
      }),
    ).toBe(true);
  });
});
