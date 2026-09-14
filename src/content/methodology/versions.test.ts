import { describe, expect, it } from "vitest";

import {
  METHODOLOGY_PACKAGE_VERSION,
  METHODOLOGY_PUBLIC_HISTORY,
  findMethodologyHistoryEntry,
  getCurrentMethodologyPackageVersion,
  listMethodologyHistoryNewestFirst,
  methodologyVersionHref,
} from "./versions";

describe("methodology versions", () => {
  it("exposes a current package that appears in public history", () => {
    expect(getCurrentMethodologyPackageVersion()).toBe(
      METHODOLOGY_PACKAGE_VERSION,
    );
    expect(
      METHODOLOGY_PUBLIC_HISTORY.some(
        (e) => e.version === METHODOLOGY_PACKAGE_VERSION,
      ),
    ).toBe(true);
  });

  it("lists history newest first and marks public corrections", () => {
    const newest = listMethodologyHistoryNewestFirst();
    expect(newest[0]?.version).toBe(METHODOLOGY_PACKAGE_VERSION);
    const correction = newest.find((e) => e.isPublicCorrection);
    expect(correction?.correctionOfVersion).toBeTruthy();
    expect(correction?.correctionNoteCs).toBeTruthy();
  });

  it("builds deep links for historical stamps", () => {
    expect(methodologyVersionHref()).toBe("/metodika/verze");
    expect(methodologyVersionHref("methodology.v2026.07.01")).toBe(
      "/metodika/verze#methodology.v2026.07.01",
    );
    expect(findMethodologyHistoryEntry("missing")).toBeUndefined();
  });
});
