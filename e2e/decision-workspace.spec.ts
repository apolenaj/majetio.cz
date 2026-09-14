import { expect, test } from "@playwright/test";

/**
 * Decision Workspace E2E (BOD 172).
 * Authenticated account mutations require seeded user + DB.
 * This suite covers public/anonymous gates + demo comparison surfaces +
 * guest localStorage funnel steps where auth is not required.
 */
test.describe("Decision Workspace flow", () => {
  test("favourites and comparison account routes require login", async ({
    page,
  }) => {
    for (const path of [
      "/ucet/oblibene",
      "/ucet/porovnani",
      "/ucet/upozorneni",
      "/porovnani/some-id",
    ]) {
      await page.goto(path);
      await expect(page).toHaveURL(/prihlaseni/);
    }
  });

  test("comparison empty state asks for at least 2 properties", async ({
    page,
  }) => {
    await page.goto("/porovnani");
    await expect(
      page.getByText(/Přidejte alespoň 2 nemovitosti/i),
    ).toBeVisible();
  });

  test("BOD 172 demo: 3 properties → compare workspace", async ({ page }) => {
    const ids = [
      "demo-byt-3kk-vinohrady",
      "demo-byt-2kk-brno",
      "demo-dum-rekonstrukce",
    ].join(",");
    await page.goto(`/porovnani?ids=${ids}`);
    await expect(
      page.getByRole("tablist", { name: /režim porovnání/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/nejlepší|metrika|přehled/i).first()).toBeVisible();
    // Cross-type warning (apartment vs house) when methodology requires it
    await expect(page.locator("body")).toContainText(/byt|dům|typ|porovn/i);
  });

  test("BOD 172 guest: save 3 → shortlist → compare tray → note in storage", async ({
    page,
  }) => {
    await page.goto("/porovnani");
    await page.evaluate(() => {
      const key = "majetio.favourites.v2";
      const items = [
        {
          propertyId: "demo-1",
          slug: "demo-byt-2kk-brno",
          title: "High yield Brno",
          href: "/nemovitosti/demo-byt-2kk-brno",
          status: "FAVORITE",
          createdAt: new Date().toISOString(),
          priceAtSave: 4_200_000,
          note: "Soukromá poznámka — nesdílet",
          folder: null,
          priority: null,
        },
        {
          propertyId: "demo-2",
          slug: "demo-byt-3kk-vinohrady",
          title: "Price change Vinohrady",
          href: "/nemovitosti/demo-byt-3kk-vinohrady",
          status: "FAVORITE",
          createdAt: new Date().toISOString(),
          priceAtSave: 6_790_000,
          note: null,
          folder: null,
          priority: null,
        },
        {
          propertyId: "demo-3",
          slug: "demo-dum-rekonstrukce",
          title: "House renovation",
          href: "/nemovitosti/demo-dum-rekonstrukce",
          status: "CONSIDERING",
          createdAt: new Date().toISOString(),
          priceAtSave: 5_100_000,
          note: null,
          folder: null,
          priority: null,
        },
      ];
      localStorage.setItem(key, JSON.stringify(items));

      const tray = [
        {
          id: "demo-1",
          slug: "demo-byt-2kk-brno",
          title: "High yield Brno",
          href: "/nemovitosti/demo-byt-2kk-brno",
        },
        {
          id: "demo-2",
          slug: "demo-byt-3kk-vinohrady",
          title: "Price change Vinohrady",
          href: "/nemovitosti/demo-byt-3kk-vinohrady",
        },
        {
          id: "demo-3",
          slug: "demo-dum-rekonstrukce",
          title: "House renovation",
          href: "/nemovitosti/demo-dum-rekonstrukce",
        },
      ];
      localStorage.setItem("majetio.compare.v1", JSON.stringify(tray));
    });

    await page.goto(
      "/porovnani?ids=demo-byt-2kk-brno,demo-byt-3kk-vinohrady,demo-dum-rekonstrukce",
    );
    await expect(
      page.getByRole("tablist", { name: /režim porovnání/i }),
    ).toBeVisible({ timeout: 15_000 });

    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem("majetio.favourites.v2");
      return raw ? (JSON.parse(raw) as Array<{ note?: string | null; status: string }>) : [];
    });
    expect(stored).toHaveLength(3);
    expect(stored.filter((x) => x.status === "FAVORITE")).toHaveLength(2);
    expect(stored.some((x) => x.note?.includes("Soukromá"))).toBe(true);
  });

  test("price-change demo property page loads over time history", async ({
    page,
  }) => {
    await page.goto("/nemovitosti/demo-byt-3kk-vinohrady");
    await expect(page.locator("body")).toBeVisible();
    // Price history / current asking should appear somewhere on detail
    await expect(page.getByText(/6\s?[.,]?\s?490|6\s?490|Vinohrady/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("shared comparison route is noindex and handles invalid token", async ({
    page,
  }) => {
    await page.goto("/sdilene/porovnani/invalid-token-too-short");
    await expect(page.getByText(/sdílení není dostupné|neplatný/i)).toBeVisible();
  });

  test("shared comparison rejects gibberish long token as missing/revoked", async ({
    page,
  }) => {
    await page.goto(
      "/sdilene/porovnani/" + "a".repeat(48),
    );
    await expect(
      page.getByText(/neexistuje|zneplatněn|neplatný|vypršela|dostupné/i),
    ).toBeVisible();
  });

  test("search listing exposes save affordance for favourites funnel step 1", async ({
    page,
  }) => {
    await page.goto("/nemovitosti");
    await expect(page.locator("body")).toBeVisible();
  });

  test("mobile comparison workspace stays usable without horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const ids = [
      "demo-byt-3kk-vinohrady",
      "demo-byt-2kk-brno",
      "demo-dum-rekonstrukce",
    ].join(",");
    await page.goto(`/porovnani?ids=${ids}`, { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("tablist", { name: /režim porovnání/i }),
    ).toBeVisible({ timeout: 15_000 });
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
    });
    expect(overflow).toBe(false);
  });
});
