import { describe, expect, it } from "vitest";

import {
  buildAdminCsv,
  escapeCsvCell,
  previewAdminCsv,
  sanitizeCsvCell,
} from "@/lib/admin/csv-export";
import {
  adminTableSkip,
  adminTableTotalPages,
  buildAdminTableHref,
  parseAdminTableState,
  toggleSortOrder,
} from "@/lib/admin/url-table-state";
import {
  buildAdminHomeProfile,
  filterAttentionByProfile,
} from "@/lib/admin/admin-home-by-role";

describe("sanitizeCsvCell / CSV injection", () => {
  it("prefixes formula-like cells", () => {
    expect(sanitizeCsvCell("=1+1")).toBe("'=1+1");
    expect(sanitizeCsvCell("+cmd")).toBe("'+cmd");
    expect(sanitizeCsvCell("-2+3")).toBe("'-2+3");
    expect(sanitizeCsvCell("@SUM(A1)")).toBe("'@SUM(A1)");
  });

  it("leaves normal text alone", () => {
    expect(sanitizeCsvCell("hello")).toBe("hello");
    expect(sanitizeCsvCell("user@example.com")).toBe("user@example.com");
  });

  it("escapes quotes and builds BOM csv", () => {
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
    const csv = buildAdminCsv({
      headers: ["a", "b"],
      rows: [["=cmd", 'x"y']],
    });
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("\"'=cmd\"");
  });

  it("preview warns on formula cells", () => {
    const preview = previewAdminCsv({
      headers: ["x"],
      rows: [["=1"], ["ok"]],
    });
    expect(preview.rowCount).toBe(2);
    expect(preview.warnings.length).toBeGreaterThan(0);
    expect(preview.sampleRows[0]?.[0]).toBe("'=1");
  });
});

describe("url-table-state", () => {
  it("parses page/sort/filters with clamps", () => {
    const state = parseAdminTableState(
      { page: "3", pageSize: "500", sort: "email", order: "asc", q: "a" },
      { filterKeys: ["q", "status"], defaultSort: "createdAt" },
    );
    expect(state.page).toBe(3);
    expect(state.pageSize).toBe(100);
    expect(state.sort).toBe("email");
    expect(state.order).toBe("asc");
    expect(state.filters.q).toBe("a");
    expect(adminTableSkip(state)).toBe(200);
  });

  it("builds href and toggles sort", () => {
    const state = parseAdminTableState(
      { q: "x" },
      { filterKeys: ["q"], defaultSort: "createdAt" },
    );
    const href = buildAdminTableHref("/admin/uzivatele", state, {
      page: 2,
      sort: "email",
      order: "asc",
    });
    expect(href).toContain("page=2");
    expect(href).toContain("sort=email");
    expect(href).toContain("order=asc");
    expect(href).toContain("q=x");

    expect(toggleSortOrder("email", "asc", "email").order).toBe("desc");
    expect(toggleSortOrder("email", "asc", "role")).toEqual({
      sort: "role",
      order: "asc",
    });
    expect(adminTableTotalPages(0, 25)).toBe(1);
    expect(adminTableTotalPages(26, 25)).toBe(2);
  });
});

describe("admin-home-by-role", () => {
  it("personalizes attention types", () => {
    const commerce = buildAdminHomeProfile("COMMERCE_ADMIN");
    expect(commerce.attentionTypes).toContain("payment_failed");
    expect(commerce.showInternalMetrics).toBe(false);

    const data = buildAdminHomeProfile("DATA_ADMIN");
    expect(data.showInternalMetrics).toBe(true);

    const items = [
      { type: "payment_failed" as const },
      { type: "dq_critical" as const },
    ];
    expect(filterAttentionByProfile(items, commerce)).toHaveLength(1);
  });
});
