import { describe, expect, it } from "vitest";

import {
  ACCOUNT_NAV,
  ADMIN_NAV,
  FOOTER_GROUPS,
  MEGA_KALKULACKY,
  MEGA_NEMOVITOSTI,
  MOBILE_APP_NAV,
  NAV_PRIMARY,
  STRATEGIES,
} from "@/config/navigation";

describe("navigation config", () => {
  it("keeps primary nav focused on marketing conversion", () => {
    expect(NAV_PRIMARY.length).toBeLessThanOrEqual(8);
    expect(NAV_PRIMARY.map((i) => i.href)).toContain("/ukazky");
    expect(NAV_PRIMARY.map((i) => i.href)).toContain("/cenik");
    expect(NAV_PRIMARY.map((i) => i.href)).toContain("/kontakt");
  });

  it("only links megamenu to known routes", () => {
    const hrefs = [
      ...MEGA_NEMOVITOSTI.search.map((i) => i.href.split("?")[0]),
      ...MEGA_NEMOVITOSTI.strategies.map((i) => i.href),
      ...MEGA_NEMOVITOSTI.tools.map((i) => i.href.split("?")[0]),
      ...MEGA_KALKULACKY.map((i) => i.href),
    ];
    for (const href of hrefs) {
      expect(href).toBeTruthy();
      expect(href!.startsWith("/")).toBe(true);
      expect(href).not.toBe("#");
    }
  });

  it("footer has no hash-only links", () => {
    for (const group of FOOTER_GROUPS) {
      for (const link of group.links) {
        expect(link.href.startsWith("/")).toBe(true);
      }
    }
  });

  it("account and admin nav are complete", () => {
    expect(ACCOUNT_NAV.some((i) => i.href === "/ucet")).toBe(true);
    expect(ADMIN_NAV.some((i) => i.href === "/admin")).toBe(true);
  });

  it("mobile app nav has five items", () => {
    expect(MOBILE_APP_NAV).toHaveLength(5);
  });

  it("strategies have czech slugs", () => {
    for (const s of STRATEGIES) {
      expect(s.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });
});
