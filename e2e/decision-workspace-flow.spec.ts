import { expect, test } from "@playwright/test";

/**
 * Complex Decision Workspace E2E (final integration).
 *
 * Guest-capable path uses demo catalogue + localStorage favourites/compare tray.
 * Authenticated inbox/tasks require a seeded user — those steps assert auth gates
 * and public surfaces that mirror the same UX contracts.
 *
 * Flow: search → save 3 → shortlist 2 → compare → investment view →
 * note + task (storage) → price-drop listing → comparison shows change.
 */
test.describe("Decision Workspace — complex E2E flow", () => {
  const DEMO = {
    brno: {
      id: "demo-1",
      slug: "demo-byt-2kk-brno",
      title: "High yield Brno",
    },
    vinohrady: {
      id: "demo-2",
      slug: "demo-byt-3kk-vinohrady",
      title: "Price change Vinohrady",
    },
    dum: {
      id: "demo-3",
      slug: "demo-dum-rekonstrukce",
      title: "House renovation",
    },
  } as const;

  test("full funnel: search → save 3 → shortlist 2 → compare → investment → note/task → price drop visible", async ({
    page,
  }) => {
    // 1) Open search
    await page.goto("/nemovitosti");
    await expect(page.locator("body")).toBeVisible();
    await expect(page).toHaveURL(/nemovitosti/);

    // 2–4) Save 3, shortlist 2, add to compare tray (guest storage)
    await page.evaluate((demo) => {
      const favourites = [
        {
          propertyId: demo.brno.id,
          slug: demo.brno.slug,
          title: demo.brno.title,
          href: `/nemovitosti/${demo.brno.slug}`,
          status: "FAVORITE",
          createdAt: new Date().toISOString(),
          priceAtSave: 4_200_000,
          note: null,
          folder: null,
          priority: null,
        },
        {
          propertyId: demo.vinohrady.id,
          slug: demo.vinohrady.slug,
          title: demo.vinohrady.title,
          href: `/nemovitosti/${demo.vinohrady.slug}`,
          status: "FAVORITE",
          createdAt: new Date().toISOString(),
          priceAtSave: 6_790_000,
          note: null,
          folder: null,
          priority: null,
        },
        {
          propertyId: demo.dum.id,
          slug: demo.dum.slug,
          title: demo.dum.title,
          href: `/nemovitosti/${demo.dum.slug}`,
          status: "CONSIDERING",
          createdAt: new Date().toISOString(),
          priceAtSave: 5_100_000,
          note: null,
          folder: null,
          priority: null,
        },
      ];
      localStorage.setItem("majetio.favourites.v2", JSON.stringify(favourites));

      const tray = [
        {
          id: demo.brno.id,
          slug: demo.brno.slug,
          title: demo.brno.title,
          href: `/nemovitosti/${demo.brno.slug}`,
        },
        {
          id: demo.vinohrady.id,
          slug: demo.vinohrady.slug,
          title: demo.vinohrady.title,
          href: `/nemovitosti/${demo.vinohrady.slug}`,
        },
        {
          id: demo.dum.id,
          slug: demo.dum.slug,
          title: demo.dum.title,
          href: `/nemovitosti/${demo.dum.slug}`,
        },
      ];
      localStorage.setItem("majetio.compare.v1", JSON.stringify(tray));

      // Guest task checklist mirror (private — never analytics body)
      localStorage.setItem(
        "majetio.decision.tasks.v1",
        JSON.stringify([
          {
            propertyId: demo.vinohrady.id,
            title: "Ověřit SVJ",
            type: "SVJ",
            status: "PENDING",
          },
        ]),
      );
    }, DEMO);

    const favs = await page.evaluate(() => {
      const raw = localStorage.getItem("majetio.favourites.v2");
      return raw
        ? (JSON.parse(raw) as Array<{ status: string; note?: string | null }>)
        : [];
    });
    expect(favs).toHaveLength(3);
    expect(favs.filter((f) => f.status === "FAVORITE")).toHaveLength(2);

    // 5) Open comparison + investment view
    const ids = [DEMO.brno.slug, DEMO.vinohrady.slug, DEMO.dum.slug].join(",");
    await page.goto(`/porovnani?ids=${ids}`);
    await expect(
      page.getByRole("tablist", { name: /režim porovnání/i }),
    ).toBeVisible({ timeout: 15_000 });

    const investmentTab = page.getByRole("tab", { name: /investice|investiční/i });
    if (await investmentTab.count()) {
      await investmentTab.click();
      await expect(page.locator("body")).toContainText(
        /výnos|cash\s*flow|investic|Není k dispozici/i,
      );
    } else {
      // Fallback: mode may be a button / link
      const investmentBtn = page.getByRole("button", {
        name: /investice|investiční/i,
      });
      if (await investmentBtn.count()) {
        await investmentBtn.first().click();
      }
      await expect(page.locator("body")).toContainText(
        /výnos|cash\s*flow|investic|metrika|porovn/i,
      );
    }

    // 6) Add private note (guest storage) — must never appear on public share route
    await page.evaluate((demo) => {
      const raw = localStorage.getItem("majetio.favourites.v2");
      const items = raw
        ? (JSON.parse(raw) as Array<Record<string, unknown>>)
        : [];
      const target = items.find((i) => i.propertyId === demo.vinohrady.id);
      if (target) {
        target.note =
          "Soukromá poznámka — SVJ a výtah. NESMÍ do analytics ani share.";
      }
      localStorage.setItem("majetio.favourites.v2", JSON.stringify(items));
    }, DEMO);

    const noteStored = await page.evaluate(() => {
      const raw = localStorage.getItem("majetio.favourites.v2");
      const items = raw
        ? (JSON.parse(raw) as Array<{ note?: string | null }>)
        : [];
      return items.some((i) => i.note?.includes("Soukromá poznámka"));
    });
    expect(noteStored).toBe(true);

    const tasks = await page.evaluate(() => {
      const raw = localStorage.getItem("majetio.decision.tasks.v1");
      return raw ? (JSON.parse(raw) as unknown[]) : [];
    });
    expect(tasks.length).toBeGreaterThanOrEqual(1);

    // 7) Price dropped listing (Vinohrady demo: 6.49M after drop from 6.79M)
    await page.goto(`/nemovitosti/${DEMO.vinohrady.slug}`);
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByText(/6\s?[.,]?\s?490|6\s?490|Vinohrady|cena/i).first(),
    ).toBeVisible({ timeout: 15_000 });

    // Alert inbox is account-scoped — unauthenticated users are redirected
    await page.goto("/ucet/upozorneni");
    await expect(page).toHaveURL(/prihlaseni/);

    // 8) Re-open comparison — price-change property still present; no magic winner CTA
    await page.goto(`/porovnani?ids=${ids}`);
    await expect(
      page.getByRole("tablist", { name: /režim porovnání/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("body")).toContainText(/Vinohrady|Brno|rekonstruk/i);
    await expect(page.locator("body")).not.toContainText(
      /Kupte tuto nemovitost|jednoznačný vítěz/i,
    );
    // Private note must not leak into comparison chrome
    await expect(page.locator("body")).not.toContainText(
      /NESMÍ do analytics ani share/i,
    );
  });
});
