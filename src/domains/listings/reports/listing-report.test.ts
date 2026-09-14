import { describe, expect, it } from "vitest";

import {
  LISTING_REPORT_ISSUE_LABELS_CS,
  LISTING_REPORT_ISSUE_TYPES,
} from "./constants";

describe("listing report issue types", () => {
  it("covers required dispute categories with Czech labels", () => {
    expect(LISTING_REPORT_ISSUE_TYPES).toEqual([
      "INCORRECT_DATA",
      "DUPLICATE",
      "UNAVAILABLE",
      "MISLEADING",
      "PROHIBITED_CONTENT",
    ]);
    for (const t of LISTING_REPORT_ISSUE_TYPES) {
      expect(LISTING_REPORT_ISSUE_LABELS_CS[t].length).toBeGreaterThan(3);
    }
  });
});
