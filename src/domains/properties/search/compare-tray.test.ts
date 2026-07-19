import { describe, expect, it, beforeEach } from "vitest";
import {
  COMPARE_MAX,
  readCompareTray,
  toggleCompareItem,
  writeCompareTray,
} from "./compare-tray";

describe("compare tray", () => {
  beforeEach(() => {
    writeCompareTray([]);
  });

  it("adds up to max 4 items", () => {
    for (let i = 0; i < COMPARE_MAX; i++) {
      const result = toggleCompareItem({
        id: `id-${i}`,
        slug: `slug-${i}`,
        title: `T${i}`,
        href: `/nemovitosti/slug-${i}`,
      });
      expect(result.ok).toBe(true);
    }
    expect(readCompareTray()).toHaveLength(COMPARE_MAX);
    const full = toggleCompareItem({
      id: "extra",
      slug: "extra",
      title: "X",
      href: "/nemovitosti/extra",
    });
    expect(full.ok).toBe(false);
    if (!full.ok) expect(full.reason).toBe("full");
  });

  it("toggles remove", () => {
    toggleCompareItem({
      id: "a",
      slug: "a",
      title: "A",
      href: "/nemovitosti/a",
    });
    const removed = toggleCompareItem({
      id: "a",
      slug: "a",
      title: "A",
      href: "/nemovitosti/a",
    });
    expect(removed.ok).toBe(true);
    if (removed.ok) expect(removed.added).toBe(false);
    expect(readCompareTray()).toHaveLength(0);
  });
});
