import { describe, expect, it } from "vitest";

import {
  FAVOURITE_STATUS_LABELS_CS,
  FAVOURITE_REJECTION_REASON_LABELS_CS,
  favouriteStatusLabel,
  isFavouriteStatus,
  isRejectedFavourite,
  isShortlisted,
  normalizeFavouriteStatus,
  SHORTLIST_STATUS,
  FAVORITE_STATUS,
} from "./status";
import { MERGE_PROMPT_TITLE, SAVE_FAILURE_MESSAGE } from "./types";
import {
  sanitizeFavouriteFolder,
  sanitizeFavouriteNote,
} from "./service/sanitize";
import {
  excludeRejectedFromRecommendations,
  isExcludedFromRecommendations,
} from "./service/recommendation-exclusion";
import { listingLifecycleFromStatus } from "./service/favourite-service";

describe("Favourite status labels (BOD 83)", () => {
  it("exposes Czech labels — Zvažuji, Prohlídka, Favorit, Vyřazeno", () => {
    expect(FAVOURITE_STATUS_LABELS_CS.CONSIDERING).toBe("Zvažuji");
    expect(FAVOURITE_STATUS_LABELS_CS.VIEWING).toBe("Prohlídka");
    expect(FAVOURITE_STATUS_LABELS_CS.FAVORITE).toBe("Favorit");
    expect(FAVOURITE_STATUS_LABELS_CS.REJECTED).toBe("Vyřazeno");
  });

  it("maps legacy statuses for guest storage / old rows", () => {
    expect(normalizeFavouriteStatus("SAVED")).toBe("CONSIDERING");
    expect(normalizeFavouriteStatus("SHORTLISTED")).toBe("FAVORITE");
    expect(normalizeFavouriteStatus("VIEWING_PLANNED")).toBe("VIEWING");
    expect(normalizeFavouriteStatus("ANALYZING")).toBe("CONSIDERING");
  });

  it("shortlist / Favorit is distinct from considering", () => {
    expect(isShortlisted("CONSIDERING")).toBe(false);
    expect(isShortlisted(SHORTLIST_STATUS)).toBe(true);
    expect(favouriteStatusLabel(FAVORITE_STATUS)).toBe("Favorit");
  });

  it("REJECTED is an explicit negative recommendation signal", () => {
    expect(isRejectedFavourite("REJECTED")).toBe(true);
    expect(isRejectedFavourite("FAVORITE")).toBe(false);
  });

  it("validates status values", () => {
    expect(isFavouriteStatus("CONSIDERING")).toBe(true);
    expect(isFavouriteStatus("SAVED")).toBe(false);
    expect(isFavouriteStatus("NOT_A_STATUS")).toBe(false);
  });

  it("optional rejection reasons have Czech labels (BOD 84)", () => {
    expect(FAVOURITE_REJECTION_REASON_LABELS_CS.TOO_EXPENSIVE).toBe(
      "Příliš drahé",
    );
    expect(FAVOURITE_REJECTION_REASON_LABELS_CS.LOCATION).toBe("Lokalita");
  });

  it("defines user-facing save failure and merge copy", () => {
    expect(SAVE_FAILURE_MESSAGE).toBe("Nemovitost se nepodařilo uložit.");
    expect(MERGE_PROMPT_TITLE).toBe("Přenést uložené nemovitosti do účtu");
  });
});

describe("Favourite note XSS sanitization (BOD 134–135)", () => {
  it("strips script tags and event handlers", () => {
    expect(
      sanitizeFavouriteNote('<script>alert(1)</script>Hello'),
    ).toBe("Hello");
    expect(
      sanitizeFavouriteNote('<img src=x onerror="alert(1)">byt'),
    ).toBe("byt");
  });

  it("clamps length and empties to null", () => {
    expect(sanitizeFavouriteNote("   ")).toBeNull();
    expect(sanitizeFavouriteNote("a".repeat(3000))?.length).toBe(2000);
  });

  it("sanitizes folder labels", () => {
    expect(sanitizeFavouriteFolder("<b>Investice</b>")).toBe("Investice");
  });
});

describe("Recommendation exclusion (BOD 85–89)", () => {
  it("filters rejected property ids", () => {
    const rejected = new Set(["p-bad"]);
    const list = [{ id: "p-ok" }, { id: "p-bad" }, { id: "p-ok2" }];
    expect(excludeRejectedFromRecommendations(list, rejected).map((x) => x.id)).toEqual([
      "p-ok",
      "p-ok2",
    ]);
    expect(isExcludedFromRecommendations("p-bad", rejected)).toBe(true);
  });
});

describe("Listing lifecycle badges (BOD 120–122)", () => {
  it("keeps UNAVAILABLE with inactive badge — never auto-deletes favourite", () => {
    expect(listingLifecycleFromStatus("UNAVAILABLE")).toEqual({
      kind: "inactive",
      label: "Nabídka již není aktivní",
      keepForCompare: true,
    });
  });

  it("marks SOLD for archive-or-keep compare", () => {
    expect(listingLifecycleFromStatus("SOLD").kind).toBe("sold");
    expect(listingLifecycleFromStatus("SOLD").keepForCompare).toBe(true);
  });
});
