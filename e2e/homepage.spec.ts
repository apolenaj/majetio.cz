import { test, expect } from "@playwright/test";

test.describe("homepage production surface", () => {
  test("single H1, primary CTAs, demo labels, skip link", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /Zjistěte, zda se nemovitost skutečně vyplatí koupit/i,
      }),
    ).toBeVisible();

    const skip = page.getByRole("link", { name: /Přeskočit na obsah/i });
    await skip.focus();
    await expect(skip).toBeVisible();

    await expect(
      page.getByRole("link", { name: /Analyzovat nemovitost/i }).first(),
    ).toHaveAttribute("href", "/analyza");
    await expect(page.getByText(/Demo/i).first()).toBeVisible();
    await expect(page.getByText(/Orientační údaje/i)).toBeVisible();
  });

  test("quick analysis validates and redirects on valid URL", async ({ page }) => {
    await page.goto("/");
    await page.locator("#homepage-listing-url").fill("https://www.sreality.cz/detail/123");
    await Promise.all([
      page.waitForURL(/\/analyza\/nova/, { timeout: 15_000 }),
      page.getByRole("button", { name: /Pokračovat k analýze/i }).click(),
    ]);
    expect(page.url()).toContain("source=url");
    expect(page.url()).toContain("listingUrl=");
  });

  test("quick analysis shows error for blocked host", async ({ page }) => {
    await page.goto("/");
    await page.locator("#homepage-listing-url").fill("https://127.0.0.1/listing");
    await page.getByRole("button", { name: /Pokračovat k analýze/i }).click();
    await expect(page.locator("#homepage-listing-url-error")).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });

  test("mobile viewport keeps CTAs usable without horizontal scroll", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto("/");
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
    });
    expect(overflow).toBeFalsy();
    await expect(
      page.getByRole("link", { name: /Analyzovat nemovitost/i }).first(),
    ).toBeVisible();
  });

  test("key section CTAs are clickable", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Spočítat financování/i })).toHaveAttribute(
      "href",
      "/kalkulacky/financovani",
    );
    await expect(page.getByRole("link", { name: /Zobrazit ceník/i })).toHaveAttribute(
      "href",
      "/cenik",
    );
    await expect(
      page.getByRole("link", { name: /Procházet nemovitosti/i }).last(),
    ).toHaveAttribute("href", "/nemovitosti");
  });

  test("SSR HTML includes hero and disclaimer without client JS", async ({ request }) => {
    const response = await request.get("/");
    expect(response.ok()).toBeTruthy();
    const html = await response.text();
    expect(html).toMatch(/Zjistěte, zda se nemovitost skutečně vyplatí koupit/);
    expect(html).toMatch(/Orientační údaje/);
    expect(html).toMatch(/Analyzovat nemovitost/);
    expect(html).toMatch(/application\/ld\+json/);
  });
});
