import { describe, expect, it } from "vitest";

import { brand } from "@/config/brand";

describe("brand config", () => {
  it("exposes primary Czech claim without yield guarantees", () => {
    expect(brand.claims.primary).toBe("Než koupíte, mějte jasno.");
    expect(brand.claims.english).toBe("Clarity before you buy.");
    expect(brand.claims.primary.toLowerCase()).not.toMatch(/garant|bezrizik/);
  });

  it("uses Layered Asset concept C", () => {
    expect(brand.logo.conceptId).toBe("C");
    expect(brand.logo.minSizePx).toBe(16);
  });
});
