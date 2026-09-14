import { beforeEach, describe, expect, it, vi } from "vitest";

const favouriteFindUnique = vi.fn();
const favouriteCreate = vi.fn();
const favouriteUpdate = vi.fn();
const favouriteDelete = vi.fn();
const favouriteDeleteMany = vi.fn();
const favouriteFindFirst = vi.fn();
const favouriteCount = vi.fn();
const propertyFindUnique = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    property: { findUnique: (...args: unknown[]) => propertyFindUnique(...args) },
    favourite: {
      findUnique: (...args: unknown[]) => favouriteFindUnique(...args),
      findFirst: (...args: unknown[]) => favouriteFindFirst(...args),
      create: (...args: unknown[]) => favouriteCreate(...args),
      update: (...args: unknown[]) => favouriteUpdate(...args),
      delete: (...args: unknown[]) => favouriteDelete(...args),
      deleteMany: (...args: unknown[]) => favouriteDeleteMany(...args),
      count: (...args: unknown[]) => favouriteCount(...args),
    },
  },
}));

import {
  listingLifecycleFromStatus,
  moveFavouriteToShortlist,
  removeFavourite,
  saveFavourite,
  updateFavouriteStatus,
} from "./favourite-service";
import {
  compareFavouriteSortRows,
  sortFavouriteSlimRows,
} from "./sort-favourites";
import { isRejectedFavourite, isShortlisted } from "../status";
import { excludeRejectedFromRecommendations } from "./recommendation-exclusion";

describe("favourite-service — add / duplicate / remove / shortlist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    favouriteCount.mockResolvedValue(0);
  });

  it("adds a favourite when none exists", async () => {
    propertyFindUnique.mockResolvedValue({
      id: "prop-1",
      askingPrice: 5_000_000,
      priceCzk: null,
    });
    favouriteFindUnique.mockResolvedValue(null);
    favouriteCreate.mockResolvedValue({ id: "fav-1" });

    const result = await saveFavourite({
      userId: "user-1",
      propertyId: "prop-1",
    });

    expect(result).toEqual({ ok: true, added: true, id: "fav-1" });
    expect(favouriteCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-1",
          propertyId: "prop-1",
          status: "CONSIDERING",
          priceAtSave: 5_000_000,
        }),
      }),
    );
  });

  it("duplicate favourite does not create a second row (added: false)", async () => {
    propertyFindUnique.mockResolvedValue({
      id: "prop-1",
      askingPrice: 5_000_000,
      priceCzk: null,
    });
    favouriteFindUnique.mockResolvedValue({ id: "fav-existing" });
    favouriteUpdate.mockResolvedValue({ id: "fav-existing" });

    const result = await saveFavourite({
      userId: "user-1",
      propertyId: "prop-1",
      status: "CONSIDERING",
    });

    expect(result).toEqual({ ok: true, added: false, id: "fav-existing" });
    expect(favouriteCreate).not.toHaveBeenCalled();
    expect(favouriteUpdate).toHaveBeenCalled();
  });

  it("removes favourite scoped by userId + favouriteId", async () => {
    favouriteFindFirst.mockResolvedValue({ id: "fav-1" });
    favouriteDelete.mockResolvedValue({ id: "fav-1" });

    const result = await removeFavourite({
      userId: "user-1",
      favouriteId: "fav-1",
    });

    expect(result).toEqual({ ok: true });
    expect(favouriteFindFirst).toHaveBeenCalledWith({
      where: { id: "fav-1", userId: "user-1" },
      select: { id: true },
    });
    expect(favouriteDelete).toHaveBeenCalledWith({ where: { id: "fav-1" } });
  });

  it("refuses remove when favourite is not owned", async () => {
    favouriteFindFirst.mockResolvedValue(null);
    const result = await removeFavourite({
      userId: "user-1",
      favouriteId: "fav-other",
    });
    expect(result.ok).toBe(false);
    expect(favouriteDelete).not.toHaveBeenCalled();
  });

  it("shortlist sets status to FAVORITE", async () => {
    favouriteFindFirst.mockResolvedValue({ id: "fav-1" });
    favouriteUpdate.mockResolvedValue({ id: "fav-1" });

    const result = await moveFavouriteToShortlist({
      userId: "user-1",
      favouriteId: "fav-1",
    });

    expect(result).toEqual({ ok: true });
    expect(favouriteUpdate).toHaveBeenCalledWith({
      where: { id: "fav-1" },
      data: { status: "FAVORITE", rejectionReason: null },
    });
    expect(isShortlisted("FAVORITE")).toBe(true);
  });

  it("reject with optional reason clears recommendation path", async () => {
    favouriteFindFirst.mockResolvedValue({ id: "fav-1" });
    favouriteUpdate.mockResolvedValue({ id: "fav-1" });

    const result = await updateFavouriteStatus({
      userId: "user-1",
      favouriteId: "fav-1",
      status: "REJECTED",
      rejectionReason: "TOO_EXPENSIVE",
    });

    expect(result).toEqual({ ok: true });
    expect(favouriteUpdate).toHaveBeenCalledWith({
      where: { id: "fav-1" },
      data: { status: "REJECTED", rejectionReason: "TOO_EXPENSIVE" },
    });
    expect(isRejectedFavourite("REJECTED")).toBe(true);
    expect(
      excludeRejectedFromRecommendations(
        [{ id: "prop-1" }, { id: "prop-2" }],
        new Set(["prop-1"]),
      ),
    ).toEqual([{ id: "prop-2" }]);
  });
});

describe("listing lifecycle — never auto-remove", () => {
  it("marks sold and inactive with keepForCompare", () => {
    expect(listingLifecycleFromStatus("SOLD").label).toBe("Prodáno");
    expect(listingLifecycleFromStatus("SOLD").keepForCompare).toBe(true);
    expect(listingLifecycleFromStatus("UNAVAILABLE").label).toBe(
      "Nabídka již není aktivní",
    );
    expect(listingLifecycleFromStatus("ACTIVE").label).toBeNull();
  });
});

describe("favourite sort helpers", () => {
  it("sorts price_drop with biggest decrease first", () => {
    const rows = sortFavouriteSlimRows(
      [
        {
          id: "a",
          status: "CONSIDERING",
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
          priority: null,
          priceAtSave: 6_000_000,
          askingPrice: 5_900_000,
          matchScore: null,
        },
        {
          id: "b",
          status: "CONSIDERING",
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
          priority: null,
          priceAtSave: 6_000_000,
          askingPrice: 5_500_000,
          matchScore: null,
        },
        {
          id: "c",
          status: "CONSIDERING",
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
          priority: null,
          priceAtSave: 6_000_000,
          askingPrice: 6_200_000,
          matchScore: null,
        },
      ],
      "price_drop",
    );
    expect(rows.map((r) => r.id)).toEqual(["b", "a", "c"]);
  });

  it("orders status Favorit before Prohlídka before Zvažuji", () => {
    expect(
      compareFavouriteSortRows(
        {
          id: "v",
          status: "VIEWING",
          createdAt: "2026-01-02",
          updatedAt: "2026-01-02",
          priority: null,
          priceAtSave: null,
          askingPrice: null,
          matchScore: null,
        },
        {
          id: "f",
          status: "FAVORITE",
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
          priority: null,
          priceAtSave: null,
          askingPrice: null,
          matchScore: null,
        },
        "status",
      ),
    ).toBeGreaterThan(0);
  });
});
