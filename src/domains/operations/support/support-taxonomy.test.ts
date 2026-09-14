import { describe, expect, it } from "vitest";

import {
  formatSupportReference,
} from "@/lib/observability/support-reference";
import {
  PERFORMANCE_SLO_BASELINES,
  SUPPORT_ISSUE_CATEGORIES,
} from "@/domains/operations/support/support-taxonomy";

describe("Phase 4 — support reference + taxonomy", () => {
  it("formats digest and request id for support", () => {
    expect(
      formatSupportReference({
        digest: "abc123digest",
        requestId: "req-xyz-99999",
      }),
    ).toBe("digest abc123digest · request req-xyz-99999");
    expect(
      formatSupportReference({ digest: "only-digest", requestId: null }),
    ).toBe("only-digest");
  });

  it("defines support categories and SLO baselines", () => {
    expect(SUPPORT_ISSUE_CATEGORIES.length).toBeGreaterThanOrEqual(8);
    expect(PERFORMANCE_SLO_BASELINES.http_p95_ms.search).toBeLessThanOrEqual(
      2000,
    );
    expect(PERFORMANCE_SLO_BASELINES.error_rate_pct.critical).toBe(5);
  });
});
