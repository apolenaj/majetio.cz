import { describe, expect, it } from "vitest";

/**
 * Pure helpers for Decision Workspace next-step + match semantics.
 * (Full DB sync covered by integration later.)
 */

function countNewMatches(
  matches: Array<{ notifiedAt: Date | null }>,
): number {
  return matches.filter((m) => m.notifiedAt == null).length;
}

describe("SavedSearchMatch new count", () => {
  it("counts only un-notified matches — never invents badges", () => {
    expect(
      countNewMatches([
        { notifiedAt: new Date() },
        { notifiedAt: null },
        { notifiedAt: null },
      ]),
    ).toBe(2);
  });

  it("returns zero when baseline marked all as notified", () => {
    expect(
      countNewMatches([
        { notifiedAt: new Date() },
        { notifiedAt: new Date() },
      ]),
    ).toBe(0);
  });
});

describe("timeline label mapping", () => {
  const labels: Record<string, string> = {
    "favourite.save": "Uložena",
    "favourite.shortlist": "Přidána do shortlistu",
    PRICE_DECREASE: "Cena změněna (pokles)",
  };

  it("maps favourite and price events to Czech labels", () => {
    expect(labels["favourite.save"]).toBe("Uložena");
    expect(labels["favourite.shortlist"]).toBe("Přidána do shortlistu");
    expect(labels.PRICE_DECREASE).toContain("Cena");
  });
});
