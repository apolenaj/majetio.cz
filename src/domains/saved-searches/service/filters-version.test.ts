import { describe, expect, it } from "vitest";

import {
  buildSavedSearchFilters,
  parseSavedSearchFilters,
  SAVED_SEARCH_FILTERS_VERSION,
} from "./filters-version";
import { EMPTY_PROPERTY_URL_STATE } from "@/domains/properties/search/url-state";

describe("saved search filters versioning", () => {
  it("builds versioned filter payload", () => {
    const payload = buildSavedSearchFilters({
      ...EMPTY_PROPERTY_URL_STATE,
      lokalita: "praha",
      cenaDo: 8_000_000,
      typ: ["byt"],
      razeni: "recommended",
    });
    expect(payload.version).toBe(SAVED_SEARCH_FILTERS_VERSION);
    expect(payload.state.lokalita).toBe("praha");
    expect(payload.state.cenaDo).toBe(8_000_000);
    expect(payload.state.typ).toEqual(["byt"]);
    expect(payload.state.stranka).toBe(1);
  });

  it("parses v1 and legacy flat shapes", () => {
    const v1 = parseSavedSearchFilters({
      version: 1,
      state: {
        ...EMPTY_PROPERTY_URL_STATE,
        lokalita: "brno",
        typ: ["dum"],
      },
    });
    expect(v1.state.lokalita).toBe("brno");
    expect(v1.state.typ).toEqual(["dum"]);

    const legacy = parseSavedSearchFilters({
      lokalita: "ostrava",
      typ: ["byt"],
      dispozice: ["2+kk"],
    });
    expect(legacy.version).toBe(1);
    expect(legacy.state.lokalita).toBe("ostrava");
    expect(legacy.state.dispozice).toEqual(["2+kk"]);
  });
});
